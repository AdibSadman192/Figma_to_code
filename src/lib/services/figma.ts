import { SupabaseClient } from '@supabase/auth-helpers-nextjs';

const FIGMA_API_BASE = 'https://api.figma.com/v1';

export class FigmaService {
  private supabase: SupabaseClient;
  private figmaApiKey: string | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  private async getFigmaApiKey(): Promise<string> {
    if (this.figmaApiKey) return this.figmaApiKey;

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('figma_access_token')
      .single();

    if (!profile?.figma_access_token) {
      throw new Error('Figma API key not found. Please connect your Figma account.');
    }

    this.figmaApiKey = profile.figma_access_token;
    return this.figmaApiKey;
  }

  private extractFileKey(url: string): string {
    // Handle both file and design URLs
    const fileMatch = url.match(/file\/(.*?)(?:\/|\?|$)/);
    const designMatch = url.match(/design\/(.*?)(?:\/|\?|$)/);
    
    const fileKey = fileMatch?.[1] || designMatch?.[1];
    if (!fileKey) {
      throw new Error('Invalid Figma URL. Please provide a valid Figma file or design URL.');
    }
    
    return fileKey;
  }

  async processFile(figmaUrl: string) {
    try {
      const fileKey = this.extractFileKey(figmaUrl);
      const apiKey = await this.getFigmaApiKey();

      // Get file metadata
      const fileResponse = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
        headers: {
          'X-Figma-Token': apiKey,
        },
      });

      if (!fileResponse.ok) {
        throw new Error('Failed to fetch Figma file. Please check your URL and try again.');
      }

      const fileData = await fileResponse.json();

      // Get the user's session
      const { data: { session } } = await this.supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Save to database
      const { error: dbError } = await this.supabase
        .from('projects')
        .insert({
          user_id: session.user.id,
          figma_url: figmaUrl,
          figma_file_key: fileKey,
          name: fileData.name,
          status: 'processing',
          document: fileData.document,
          last_modified: fileData.lastModified,
          version: fileData.version,
          thumbnail_url: fileData.thumbnailUrl,
        });

      if (dbError) {
        throw dbError;
      }

      return {
        success: true,
        fileKey,
        name: fileData.name,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async getFigmaFile(fileKey: string) {
    const apiKey = await this.getFigmaApiKey();
    
    const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma file');
    }

    return response.json();
  }

  async getFigmaImages(fileKey: string, nodeIds: string[]) {
    const apiKey = await this.getFigmaApiKey();
    
    const response = await fetch(
      `${FIGMA_API_BASE}/images/${fileKey}?ids=${nodeIds.join(',')}&format=png`,
      {
        headers: {
          'X-Figma-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Figma images');
    }

    return response.json();
  }

  async getFile(fileKey: string) {
    return this.getFigmaFile(fileKey);
  }

  async getFileNodes(fileKey: string, nodeIds: string[]) {
    const apiKey = await this.getFigmaApiKey();
    
    const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${nodeIds.join(',')}`, {
      headers: {
        'X-Figma-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma file nodes');
    }

    return response.json();
  }

  async getImageFills(fileKey: string) {
    const apiKey = await this.getFigmaApiKey();
    
    const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}/images`, {
      headers: {
        'X-Figma-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma image fills');
    }

    return response.json();
  }

  async getImageUrls(fileKey: string, nodeIds: string[]) {
    const apiKey = await this.getFigmaApiKey();
    
    const params = new URLSearchParams({
      format: 'png',
      ids: nodeIds.join(','),
    });
    const response = await fetch(`${FIGMA_API_BASE}/images/${fileKey}?${params}`, {
      headers: {
        'X-Figma-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma image URLs');
    }

    return response.json();
  }

  async getComponents(fileKey: string) {
    const apiKey = await this.getFigmaApiKey();
    
    const response = await fetch(`${FIGMA_API_BASE}/files/${fileKey}/components`, {
      headers: {
        'X-Figma-Token': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Figma components');
    }

    return response.json();
  }

  // Helper method to extract styles from a node
  extractStyles(node: any) {
    return {
      backgroundColor: node.backgroundColor,
      opacity: node.opacity,
      position: node.position,
      size: {
        width: node.size?.width,
        height: node.size?.height,
      },
      layout: node.layout,
      fills: node.fills,
      strokes: node.strokes,
      effects: node.effects,
      constraints: node.constraints,
    };
  }

  // Helper method to process a design node into HTML/CSS structure
  processNode(node: any) {
    const styles = this.extractStyles(node);
    const children = node.children?.map((child: any) => this.processNode(child)) || [];

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      styles,
      children,
    };
  }
}
