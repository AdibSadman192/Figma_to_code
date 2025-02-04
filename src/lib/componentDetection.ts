interface ComponentPattern {
  name: string;
  rules: {
    type: 'layout' | 'style' | 'children';
    condition: (node: any) => boolean;
  }[];
}

export class ComponentDetector {
  private patterns: ComponentPattern[] = [
    {
      name: 'Button',
      rules: [
        {
          type: 'layout',
          condition: (node) => 
            node.type === 'INSTANCE' || 
            (node.type === 'FRAME' && node.children?.length <= 3),
        },
        {
          type: 'style',
          condition: (node) =>
            node.fills?.some((fill: any) => fill.type === 'SOLID') ||
            node.strokes?.length > 0,
        },
      ],
    },
    {
      name: 'Card',
      rules: [
        {
          type: 'layout',
          condition: (node) =>
            node.type === 'FRAME' &&
            node.layoutMode === 'VERTICAL',
        },
        {
          type: 'children',
          condition: (node) =>
            node.children?.length >= 2,
        },
      ],
    },
    {
      name: 'Input',
      rules: [
        {
          type: 'layout',
          condition: (node) =>
            node.type === 'FRAME' &&
            node.layoutMode === 'HORIZONTAL',
        },
        {
          type: 'style',
          condition: (node) =>
            node.strokes?.length > 0 ||
            node.effects?.some((effect: any) => effect.type === 'INNER_SHADOW'),
        },
      ],
    },
  ];

  detectComponent(node: any): string | null {
    for (const pattern of this.patterns) {
      if (this.matchesPattern(node, pattern)) {
        return pattern.name;
      }
    }
    return null;
  }

  private matchesPattern(node: any, pattern: ComponentPattern): boolean {
    return pattern.rules.every(rule => rule.condition(node));
  }

  detectHierarchy(node: any): any {
    const componentType = this.detectComponent(node);
    const result: any = {
      id: node.id,
      name: node.name,
      type: componentType || node.type,
      children: [],
    };

    if (node.children) {
      result.children = node.children.map((child: any) => 
        this.detectHierarchy(child)
      );
    }

    return result;
  }

  analyzeLayout(node: any): any {
    return {
      id: node.id,
      type: node.type,
      layout: {
        mode: node.layoutMode || 'NONE',
        padding: node.padding,
        spacing: node.itemSpacing,
        alignment: node.primaryAxisAlignItems,
        constraints: {
          horizontal: node.constraints?.horizontal,
          vertical: node.constraints?.vertical,
        },
      },
      size: {
        width: node.width,
        height: node.height,
      },
      position: {
        x: node.x,
        y: node.y,
      },
      children: node.children?.map((child: any) => 
        this.analyzeLayout(child)
      ) || [],
    };
  }
}
