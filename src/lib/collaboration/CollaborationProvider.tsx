'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSupabase } from '../providers/supabase-provider';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Presence {
  user_id: string;
  email: string;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
}

interface CollaborationContextType {
  presence: Record<string, Presence>;
  updatePresence: (data: Partial<Presence>) => void;
  projectHistory: Array<{
    id: string;
    user_id: string;
    email: string;
    timestamp: string;
    changes: string;
    type: 'html' | 'css';
  }>;
  saveVersion: (changes: string, type: 'html' | 'css') => Promise<void>;
  restoreVersion: (versionId: string) => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}

interface CollaborationProviderProps {
  children: React.ReactNode;
  projectId: string;
}

export function CollaborationProvider({
  children,
  projectId,
}: CollaborationProviderProps) {
  const { supabase } = useSupabase();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [presence, setPresence] = useState<Record<string, Presence>>({});
  const [projectHistory, setProjectHistory] = useState<
    CollaborationContextType['projectHistory']
  >([]);

  useEffect(() => {
    // Initialize realtime channel
    const channel = supabase.channel(`project:${projectId}`, {
      config: {
        presence: {
          key: 'project_presence',
        },
      },
    });

    // Handle presence state changes
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      setPresence(
        Object.entries(state).reduce((acc, [key, value]) => {
          acc[key] = value[0] as Presence;
          return acc;
        }, {} as Record<string, Presence>)
      );
    });

    // Handle presence joins
    channel.on('presence', { event: 'join' }, ({ key, newPresence }) => {
      setPresence((prev) => ({
        ...prev,
        [key]: newPresence[0] as Presence,
      }));
    });

    // Handle presence leaves
    channel.on('presence', { event: 'leave' }, ({ key }) => {
      setPresence((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    });

    // Subscribe to channel
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (user) {
          await channel.track({
            user_id: user.id,
            email: user.email,
          });
        }
      }
    });

    setChannel(channel);

    // Load project history
    loadProjectHistory();

    return () => {
      channel.unsubscribe();
    };
  }, [projectId, supabase]);

  const loadProjectHistory = async () => {
    const { data, error } = await supabase
      .from('project_history')
      .select('*')
      .eq('project_id', projectId)
      .order('timestamp', { ascending: false });

    if (!error && data) {
      setProjectHistory(data);
    }
  };

  const updatePresence = async (data: Partial<Presence>) => {
    if (channel) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      
      if (user) {
        await channel.track({
          user_id: user.id,
          email: user.email,
          ...data,
        });
      }
    }
  };

  const saveVersion = async (changes: string, type: 'html' | 'css') => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) return;

    const { data, error } = await supabase
      .from('project_history')
      .insert({
        project_id: projectId,
        user_id: user.id,
        email: user.email,
        changes,
        type,
      })
      .select()
      .single();

    if (!error && data) {
      setProjectHistory((prev) => [data, ...prev]);
    }
  };

  const restoreVersion = async (versionId: string) => {
    const version = projectHistory.find((v) => v.id === versionId);
    if (!version) return;

    // Emit version restore event
    channel?.send({
      type: 'broadcast',
      event: 'version_restore',
      payload: {
        version_id: versionId,
        changes: version.changes,
        type: version.type,
      },
    });

    // Update project content in database
    await supabase
      .from('projects')
      .update({
        [`${version.type}_content`]: version.changes,
      })
      .eq('id', projectId);
  };

  return (
    <CollaborationContext.Provider
      value={{
        presence,
        updatePresence,
        projectHistory,
        saveVersion,
        restoreVersion,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}
