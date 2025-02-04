import { parse as parseHTML } from 'node-html-parser';

interface OptimizationOptions {
  minify: boolean;
  removeUnusedStyles: boolean;
  combineMediaQueries: boolean;
  inlineSmallImages: boolean;
  optimizeClassNames: boolean;
}

export class CodeOptimizer {
  private options: OptimizationOptions;

  constructor(options: Partial<OptimizationOptions> = {}) {
    this.options = {
      minify: true,
      removeUnusedStyles: true,
      combineMediaQueries: true,
      inlineSmallImages: true,
      optimizeClassNames: true,
      ...options,
    };
  }

  optimizeHTML(html: string): string {
    const root = parseHTML(html);
    
    if (this.options.removeUnusedStyles) {
      this.removeUnusedStyles(root);
    }
    
    if (this.options.optimizeClassNames) {
      this.optimizeClassNames(root);
    }
    
    let output = root.toString();
    
    if (this.options.minify) {
      output = this.minifyHTML(output);
    }
    
    return output;
  }

  optimizeCSS(css: string): string {
    let optimized = css;
    
    if (this.options.removeUnusedStyles) {
      optimized = this.removeUnusedCSS(optimized);
    }
    
    if (this.options.combineMediaQueries) {
      optimized = this.combineMediaQueries(optimized);
    }
    
    if (this.options.minify) {
      optimized = this.minifyCSS(optimized);
    }
    
    return optimized;
  }

  private removeUnusedStyles(root: any): void {
    const usedClasses = new Set<string>();
    root.querySelectorAll('*').forEach((el: any) => {
      if (el.classList) {
        el.classList.forEach((cls: string) => usedClasses.add(cls));
      }
    });

    root.querySelectorAll('style').forEach((style: any) => {
      // Remove unused class definitions
      style.text = style.text.replace(/\.[\w-]+\s*{[^}]*}/g, (match: string) => {
        const className = match.match(/\.([\w-]+)/)?.[1];
        return className && usedClasses.has(className) ? match : '';
      });
    });
  }

  private optimizeClassNames(root: any): void {
    const classMap = new Map<string, string>();
    let counter = 0;

    root.querySelectorAll('*').forEach((el: any) => {
      if (el.classList) {
        const newClasses: string[] = [];
        el.classList.forEach((cls: string) => {
          if (!classMap.has(cls)) {
            classMap.set(cls, `c${counter++}`);
          }
          newClasses.push(classMap.get(cls)!);
        });
        el.setAttribute('class', newClasses.join(' '));
      }
    });

    // Update style definitions
    root.querySelectorAll('style').forEach((style: any) => {
      let css = style.text;
      classMap.forEach((newName, oldName) => {
        css = css.replace(
          new RegExp(`\\.${oldName}\\b`, 'g'),
          `.${newName}`
        );
      });
      style.text = css;
    });
  }

  private minifyHTML(html: string): string {
    return html
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();
  }

  private minifyCSS(css: string): string {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;\}/g, '}')
      .trim();
  }

  private removeUnusedCSS(css: string): string {
    // Implement more sophisticated unused CSS removal
    return css;
  }

  private combineMediaQueries(css: string): string {
    const mediaQueries = new Map<string, string[]>();
    
    // Extract media queries
    css.match(/@media[^{]+{([^}]+)}/g)?.forEach(query => {
      const [condition, rules] = query.match(/@media([^{]+){(.+)}/)?.slice(1) || [];
      if (condition && rules) {
        if (!mediaQueries.has(condition)) {
          mediaQueries.set(condition, []);
        }
        mediaQueries.get(condition)?.push(rules);
      }
    });

    // Combine media queries with same conditions
    let output = css;
    mediaQueries.forEach((rules, condition) => {
      const combined = `@media${condition}{${rules.join('')}}`;
      rules.forEach(rule => {
        output = output.replace(`@media${condition}{${rule}}`, '');
      });
      output += combined;
    });

    return output;
  }
}
