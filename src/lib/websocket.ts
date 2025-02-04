import { createClient } from '@supabase/supabase-js';

export type WebSocketMessage = {
  type: 'code_update' | 'component_update' | 'user_presence';
  payload: any;
  timestamp: number;
};

export class WebSocketManager {
  private static instance: WebSocketManager;
  private supabase;
  private channels: Map<string, any> = new Map();
  private messageHandlers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  subscribeToProject(projectId: string, handler: (message: WebSocketMessage) => void) {
    if (!this.channels.has(projectId)) {
      const channel = this.supabase.channel(`project:${projectId}`)
        .on('broadcast', { event: 'message' }, ({ payload }) => {
          const message = payload as WebSocketMessage;
          this.notifyHandlers(projectId, message);
        })
        .subscribe();

      this.channels.set(projectId, channel);
    }

    if (!this.messageHandlers.has(projectId)) {
      this.messageHandlers.set(projectId, []);
    }
    this.messageHandlers.get(projectId)!.push(handler);

    return () => this.unsubscribeFromProject(projectId, handler);
  }

  private unsubscribeFromProject(projectId: string, handler: (message: WebSocketMessage) => void) {
    const handlers = this.messageHandlers.get(projectId);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }

      if (handlers.length === 0) {
        const channel = this.channels.get(projectId);
        if (channel) {
          channel.unsubscribe();
          this.channels.delete(projectId);
        }
        this.messageHandlers.delete(projectId);
      }
    }
  }

  private notifyHandlers(projectId: string, message: WebSocketMessage) {
    const handlers = this.messageHandlers.get(projectId);
    if (handlers) {
      handlers.forEach(handler => handler(message));
    }
  }

  async broadcastToProject(projectId: string, message: Omit<WebSocketMessage, 'timestamp'>) {
    const channel = this.channels.get(projectId);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          ...message,
          timestamp: Date.now(),
        },
      });
    }
  }

  // User presence tracking
  async updateUserPresence(projectId: string, userId: string, status: 'online' | 'offline') {
    await this.broadcastToProject(projectId, {
      type: 'user_presence',
      payload: {
        userId,
        status,
        lastSeen: Date.now(),
      },
    });
  }
}
