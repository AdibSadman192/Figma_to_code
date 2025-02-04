interface StyleDefinition {
  colors: {
    primary: string[];
    secondary: string[];
    accent: string[];
    background: string[];
    text: string[];
  };
  typography: {
    fontFamilies: string[];
    fontSizes: string[];
    lineHeights: string[];
    fontWeights: number[];
  };
  spacing: {
    padding: string[];
    margin: string[];
    gap: string[];
  };
  effects: {
    shadows: string[];
    blurs: string[];
    opacity: number[];
  };
  borders: {
    widths: string[];
    radii: string[];
    styles: string[];
  };
}

export class StyleTransfer {
  private static instance: StyleTransfer;
  
  private constructor() {}
  
  static getInstance(): StyleTransfer {
    if (!StyleTransfer.instance) {
      StyleTransfer.instance = new StyleTransfer();
    }
    return StyleTransfer.instance;
  }

  extractStyles(figmaNodes: any[]): StyleDefinition {
    const styles: StyleDefinition = {
      colors: {
        primary: [],
        secondary: [],
        accent: [],
        background: [],
        text: [],
      },
      typography: {
        fontFamilies: [],
        fontSizes: [],
        lineHeights: [],
        fontWeights: [],
      },
      spacing: {
        padding: [],
        margin: [],
        gap: [],
      },
      effects: {
        shadows: [],
        blurs: [],
        opacity: [],
      },
      borders: {
        widths: [],
        radii: [],
        styles: [],
      },
    };

    figmaNodes.forEach(node => this.extractNodeStyles(node, styles));
    return this.normalizeStyles(styles);
  }

  private extractNodeStyles(node: any, styles: StyleDefinition) {
    // Extract colors
    if (node.fills) {
      node.fills.forEach((fill: any) => {
        if (fill.type === 'SOLID') {
          const color = this.rgbToHex(fill.color);
          if (fill.opacity < 0.5) {
            styles.colors.background.push(color);
          } else {
            styles.colors.primary.push(color);
          }
        }
      });
    }

    // Extract typography
    if (node.style) {
      styles.typography.fontFamilies.push(node.style.fontFamily);
      styles.typography.fontSizes.push(node.style.fontSize + 'px');
      styles.typography.lineHeights.push(node.style.lineHeight + 'px');
      styles.typography.fontWeights.push(node.style.fontWeight);
    }

    // Extract spacing
    if (node.paddingTop !== undefined) {
      styles.spacing.padding.push(`${node.paddingTop}px`);
    }
    if (node.itemSpacing !== undefined) {
      styles.spacing.gap.push(`${node.itemSpacing}px`);
    }

    // Extract effects
    if (node.effects) {
      node.effects.forEach((effect: any) => {
        if (effect.type === 'DROP_SHADOW') {
          styles.effects.shadows.push(
            `${effect.offset.x}px ${effect.offset.y}px ${effect.radius}px ${this.rgbToHex(effect.color)}`
          );
        } else if (effect.type === 'BLUR') {
          styles.effects.blurs.push(`${effect.radius}px`);
        }
      });
    }

    // Extract borders
    if (node.strokeWeight !== undefined) {
      styles.borders.widths.push(`${node.strokeWeight}px`);
    }
    if (node.cornerRadius !== undefined) {
      styles.borders.radii.push(`${node.cornerRadius}px`);
    }

    // Recursively process children
    if (node.children) {
      node.children.forEach((child: any) => 
        this.extractNodeStyles(child, styles)
      );
    }
  }

  private normalizeStyles(styles: StyleDefinition): StyleDefinition {
    return {
      colors: {
        primary: [...new Set(styles.colors.primary)],
        secondary: [...new Set(styles.colors.secondary)],
        accent: [...new Set(styles.colors.accent)],
        background: [...new Set(styles.colors.background)],
        text: [...new Set(styles.colors.text)],
      },
      typography: {
        fontFamilies: [...new Set(styles.typography.fontFamilies)],
        fontSizes: [...new Set(styles.typography.fontSizes)],
        lineHeights: [...new Set(styles.typography.lineHeights)],
        fontWeights: [...new Set(styles.typography.fontWeights)],
      },
      spacing: {
        padding: [...new Set(styles.spacing.padding)],
        margin: [...new Set(styles.spacing.margin)],
        gap: [...new Set(styles.spacing.gap)],
      },
      effects: {
        shadows: [...new Set(styles.effects.shadows)],
        blurs: [...new Set(styles.effects.blurs)],
        opacity: [...new Set(styles.effects.opacity)],
      },
      borders: {
        widths: [...new Set(styles.borders.widths)],
        radii: [...new Set(styles.borders.radii)],
        styles: [...new Set(styles.borders.styles)],
      },
    };
  }

  private rgbToHex(color: { r: number; g: number; b: number; a?: number }): string {
    const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
    const hex = `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
    return color.a !== undefined && color.a !== 1
      ? `${hex}${toHex(color.a)}`
      : hex;
  }

  applyStylesToNode(node: any, styles: StyleDefinition): any {
    // Create a deep copy to avoid modifying the original
    const styledNode = JSON.parse(JSON.stringify(node));

    // Apply styles based on node type and existing properties
    if (styledNode.type === 'FRAME' || styledNode.type === 'GROUP') {
      this.applyContainerStyles(styledNode, styles);
    } else if (styledNode.type === 'TEXT') {
      this.applyTextStyles(styledNode, styles);
    }

    // Recursively apply styles to children
    if (styledNode.children) {
      styledNode.children = styledNode.children.map((child: any) =>
        this.applyStylesToNode(child, styles)
      );
    }

    return styledNode;
  }

  private applyContainerStyles(node: any, styles: StyleDefinition) {
    // Apply background color
    if (styles.colors.background.length > 0) {
      node.fills = [{
        type: 'SOLID',
        color: this.hexToRgb(styles.colors.background[0]),
      }];
    }

    // Apply border
    if (styles.borders.widths.length > 0) {
      node.strokeWeight = parseInt(styles.borders.widths[0]);
    }
    if (styles.borders.radii.length > 0) {
      node.cornerRadius = parseInt(styles.borders.radii[0]);
    }

    // Apply spacing
    if (styles.spacing.padding.length > 0) {
      const padding = parseInt(styles.spacing.padding[0]);
      node.paddingTop = padding;
      node.paddingRight = padding;
      node.paddingBottom = padding;
      node.paddingLeft = padding;
    }
  }

  private applyTextStyles(node: any, styles: StyleDefinition) {
    if (!node.style) node.style = {};

    // Apply typography
    if (styles.typography.fontFamilies.length > 0) {
      node.style.fontFamily = styles.typography.fontFamilies[0];
    }
    if (styles.typography.fontSizes.length > 0) {
      node.style.fontSize = parseInt(styles.typography.fontSizes[0]);
    }
    if (styles.typography.lineHeights.length > 0) {
      node.style.lineHeight = parseInt(styles.typography.lineHeights[0]);
    }
    if (styles.typography.fontWeights.length > 0) {
      node.style.fontWeight = styles.typography.fontWeights[0];
    }

    // Apply text color
    if (styles.colors.text.length > 0) {
      node.fills = [{
        type: 'SOLID',
        color: this.hexToRgb(styles.colors.text[0]),
      }];
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number; a?: number } {
    hex = hex.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : undefined;
    return a !== undefined ? { r, g, b, a } : { r, g, b };
  }
}
