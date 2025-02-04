import { WebSocketManager } from './websocket';
import { VersionControl } from './versionControl';

interface User {
  id: string;
  name: string;
  avatar?: string;
  cursor?: { x: number; y: number };
  selection?: { start: number; end: number };
}

interface CollaborationState {
  users: Map<string, User>;
  lastUpdate: number;
}

export class CollaborationManager {
  private static instance: CollaborationManager;
  private ws: WebSocketManager;
  private vc: VersionControl;
  private states: Map<string, CollaborationState> = new Map();
  private callbacks: Map<string, ((state: CollaborationState) => void)[]> = new Map();

  private constructor() {
    this.ws = WebSocketManager.getInstance();
    this.vc = VersionControl.getInstance();
  }

  static getInstance(): CollaborationManager {
    if (!CollaborationManager.instance) {
      CollaborationManager.instance = new CollaborationManager();
    }
    return CollaborationManager.instance;
  }

  async joinProject(
    projectId: string,
    user: User,
    callback: (state: CollaborationState) => void
  ): Promise<() => void> {
    // Initialize project state if needed
    if (!this.states.has(projectId)) {
      this.states.set(projectId, {
        users: new Map(),
        lastUpdate: Date.now(),
      });
      this.callbacks.set(projectId, []);
    }

    // Add user to project
    const state = this.states.get(projectId)!;
    state.users.set(user.id, user);
    this.callbacks.get(projectId)!.push(callback);

    // Subscribe to project updates
    const unsubscribe = this.ws.subscribeToProject(
      projectId,
      this.handleMessage.bind(this, projectId)
    );

    // Broadcast user joined
    await this.ws.broadcastToProject(projectId, {
      type: 'user_presence',
      payload: {
        action: 'join',
        user,
      },
    });

    // Return cleanup function
    return () => {
      unsubscribe();
      this.leaveProject(projectId, user.id);
    };
  }

  private async leaveProject(projectId: string, userId: string) {
    const state = this.states.get(projectId);
    if (!state) return;

    state.users.delete(userId);
    this.notifyProjectUpdate(projectId);

    await this.ws.broadcastToProject(projectId, {
      type: 'user_presence',
      payload: {
        action: 'leave',
        userId,
      },
    });
  }

  async updateCursor(
    projectId: string,
    userId: string,
    cursor: { x: number; y: number }
  ) {
    const state = this.states.get(projectId);
    if (!state) return;

    const user = state.users.get(userId);
    if (!user) return;

    user.cursor = cursor;
    this.notifyProjectUpdate(projectId);

    await this.ws.broadcastToProject(projectId, {
      type: 'user_presence',
      payload: {
        action: 'cursor',
        userId,
        cursor,
      },
    });
  }

  async updateSelection(
    projectId: string,
    userId: string,
    selection: { start: number; end: number }
  ) {
    const state = this.states.get(projectId);
    if (!state) return;

    const user = state.users.get(userId);
    if (!user) return;

    user.selection = selection;
    this.notifyProjectUpdate(projectId);

    await this.ws.broadcastToProject(projectId, {
      type: 'user_presence',
      payload: {
        action: 'selection',
        userId,
        selection,
      },
    });
  }

  private handleMessage(projectId: string, message: any) {
    const state = this.states.get(projectId);
    if (!state) return;

    switch (message.type) {
      case 'user_presence':
        this.handleUserPresence(projectId, message.payload);
        break;
      // Add more message handlers as needed
    }
  }

  private handleUserPresence(projectId: string, payload: any) {
    const state = this.states.get(projectId);
    if (!state) return;

    switch (payload.action) {
      case 'join':
        state.users.set(payload.user.id, payload.user);
        break;
      case 'leave':
        state.users.delete(payload.userId);
        break;
      case 'cursor':
        const userWithCursor = state.users.get(payload.userId);
        if (userWithCursor) {
          userWithCursor.cursor = payload.cursor;
        }
        break;
      case 'selection':
        const userWithSelection = state.users.get(payload.userId);
        if (userWithSelection) {
          userWithSelection.selection = payload.selection;
        }
        break;
    }

    this.notifyProjectUpdate(projectId);
  }

  private notifyProjectUpdate(projectId: string) {
    const state = this.states.get(projectId);
    const callbacks = this.callbacks.get(projectId);
    if (!state || !callbacks) return;

    state.lastUpdate = Date.now();
    callbacks.forEach(callback => callback(state));
  }
}
