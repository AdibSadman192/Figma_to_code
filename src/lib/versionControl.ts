import { createClient } from '@supabase/supabase-js';

interface Version {
  id: string;
  projectId: string;
  userId: string;
  timestamp: number;
  changes: {
    type: 'add' | 'modify' | 'delete';
    path: string;
    content?: string;
    previousContent?: string;
  }[];
  message: string;
}

export class VersionControl {
  private static instance: VersionControl;
  private supabase;
  private currentChanges: Map<string, Version['changes']> = new Map();

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): VersionControl {
    if (!VersionControl.instance) {
      VersionControl.instance = new VersionControl();
    }
    return VersionControl.instance;
  }

  async trackChange(
    projectId: string,
    userId: string,
    change: Version['changes'][0]
  ) {
    if (!this.currentChanges.has(projectId)) {
      this.currentChanges.set(projectId, []);
    }
    this.currentChanges.get(projectId)!.push(change);
  }

  async commit(
    projectId: string,
    userId: string,
    message: string
  ): Promise<string> {
    const changes = this.currentChanges.get(projectId) || [];
    if (changes.length === 0) return '';

    const version: Version = {
      id: crypto.randomUUID(),
      projectId,
      userId,
      timestamp: Date.now(),
      changes,
      message,
    };

    const { error } = await this.supabase
      .from('versions')
      .insert(version);

    if (error) throw error;

    this.currentChanges.set(projectId, []);
    return version.id;
  }

  async getHistory(projectId: string): Promise<Version[]> {
    const { data, error } = await this.supabase
      .from('versions')
      .select('*')
      .eq('projectId', projectId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getVersion(versionId: string): Promise<Version> {
    const { data, error } = await this.supabase
      .from('versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (error) throw error;
    return data;
  }

  async revert(projectId: string, versionId: string): Promise<void> {
    const version = await this.getVersion(versionId);
    const reversedChanges = version.changes
      .slice()
      .reverse()
      .map(change => ({
        ...change,
        type: change.type === 'add' ? 'delete' :
              change.type === 'delete' ? 'add' :
              'modify',
        content: change.previousContent,
        previousContent: change.content,
      }));

    await this.commit(projectId, version.userId, `Revert to version ${versionId}`);
  }
}
