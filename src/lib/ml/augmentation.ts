interface AugmentationConfig {
  colorJitter: boolean;
  rotation: boolean;
  scaling: boolean;
  translation: boolean;
  noise: boolean;
}

interface ColorJitterConfig {
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
}

export class DataAugmentation {
  private static instance: DataAugmentation;
  
  private constructor() {}
  
  static getInstance(): DataAugmentation {
    if (!DataAugmentation.instance) {
      DataAugmentation.instance = new DataAugmentation();
    }
    return DataAugmentation.instance;
  }

  augmentData(
    data: any[],
    config: AugmentationConfig,
    multiplier: number = 2
  ): any[] {
    const augmented: any[] = [...data];

    for (let i = 0; i < data.length * (multiplier - 1); i++) {
      const originalItem = data[i % data.length];
      let augmentedItem = JSON.parse(JSON.stringify(originalItem));

      if (config.colorJitter) {
        augmentedItem = this.applyColorJitter(augmentedItem);
      }
      if (config.rotation) {
        augmentedItem = this.applyRotation(augmentedItem);
      }
      if (config.scaling) {
        augmentedItem = this.applyScaling(augmentedItem);
      }
      if (config.translation) {
        augmentedItem = this.applyTranslation(augmentedItem);
      }
      if (config.noise) {
        augmentedItem = this.applyNoise(augmentedItem);
      }

      augmented.push(augmentedItem);
    }

    return this.shuffle(augmented);
  }

  private applyColorJitter(item: any): any {
    if (!item.style || !item.style.fills) return item;

    const config: ColorJitterConfig = {
      brightness: 0.2 * (Math.random() - 0.5),
      contrast: 0.2 * (Math.random() - 0.5),
      saturation: 0.2 * (Math.random() - 0.5),
      hue: 0.1 * (Math.random() - 0.5),
    };

    item.style.fills = item.style.fills.map((fill: any) => {
      if (fill.type === 'SOLID') {
        fill.color = this.adjustColor(fill.color, config);
      }
      return fill;
    });

    return item;
  }

  private adjustColor(
    color: { r: number; g: number; b: number },
    config: ColorJitterConfig
  ): { r: number; g: number; b: number } {
    // Convert RGB to HSL
    const hsl = this.rgbToHsl(color.r, color.g, color.b);
    
    // Apply adjustments
    hsl[2] *= (1 + config.brightness); // Brightness
    hsl[1] *= (1 + config.saturation); // Saturation
    hsl[0] += config.hue; // Hue

    // Clamp values
    hsl[0] = (hsl[0] + 1) % 1;
    hsl[1] = Math.max(0, Math.min(1, hsl[1]));
    hsl[2] = Math.max(0, Math.min(1, hsl[2]));

    // Convert back to RGB
    const rgb = this.hslToRgb(hsl[0], hsl[1], hsl[2]);
    return { r: rgb[0], g: rgb[1], b: rgb[2] };
  }

  private applyRotation(item: any): any {
    if (!item.transform) return item;

    const angle = Math.random() * 360;
    item.transform = {
      ...item.transform,
      rotation: (item.transform.rotation || 0) + angle,
    };

    return item;
  }

  private applyScaling(item: any): any {
    if (!item.size) return item;

    const scale = 0.8 + Math.random() * 0.4; // Scale between 0.8 and 1.2
    item.size = {
      width: item.size.width * scale,
      height: item.size.height * scale,
    };

    return item;
  }

  private applyTranslation(item: any): any {
    if (!item.position) return item;

    const dx = (Math.random() - 0.5) * 20;
    const dy = (Math.random() - 0.5) * 20;
    item.position = {
      x: item.position.x + dx,
      y: item.position.y + dy,
    };

    return item;
  }

  private applyNoise(item: any): any {
    if (!item.effects) return item;

    item.effects = item.effects || [];
    item.effects.push({
      type: 'LAYER_BLUR',
      radius: Math.random() * 2,
    });

    return item;
  }

  private shuffle(array: any[]): any[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  private rgbToHsl(r: number, g: number, b: number): number[] {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      
      h /= 6;
    }

    return [h, s, l];
  }

  private hslToRgb(h: number, s: number, l: number): number[] {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b];
  }
}
