'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/app/providers';
import Navbar from '@/components/Navigation/Navbar';
import { useSearchParams } from 'next/navigation';
import { Background } from '@/components/ui/background';

export default function Settings() {
  const { supabase } = useSupabase();
  const [figmaToken, setFigmaToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setError(message);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Not authenticated. Please sign in.');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('figma_access_token')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setError(`Error loading profile: ${profileError.message}`);
          return;
        }

        if (profile?.figma_access_token) {
          setFigmaToken(profile.figma_access_token);
        }
      } catch (err) {
        console.error('Profile load error:', err);
        setError('Failed to load profile');
      }
    }

    loadProfile();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please sign in.');
      }

      // First, check if a profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Profile check error:', checkError);
        throw new Error(`Failed to check profile: ${checkError.message}`);
      }

      let updateResult;
      if (!existingProfile) {
        // Insert new profile if it doesn't exist
        updateResult = await supabase
          .from('profiles')
          .insert([
            {
              id: session.user.id,
              figma_access_token: figmaToken,
            },
          ]);
      } else {
        // Update existing profile
        updateResult = await supabase
          .from('profiles')
          .update({ figma_access_token: figmaToken })
          .eq('id', session.user.id);
      }

      if (updateResult.error) {
        console.error('Profile update error:', updateResult.error);
        throw new Error(`Failed to save token: ${updateResult.error.message}`);
      }

      setSuccess('Figma access token saved successfully!');
    } catch (err) {
      console.error('Save token error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
              Settings
            </h1>

            <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-medium text-foreground mb-4">Figma Integration</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                <p>To use the Figma integration, you need to provide your Figma access token:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to your <a href="https://www.figma.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/90">Figma settings</a></li>
                  <li>Scroll down to "Access tokens"</li>
                  <li>Click "Generate new token"</li>
                  <li>Give it a name (e.g., "Figma to Code")</li>
                  <li>Copy the token and paste it below</li>
                </ol>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="figmaToken" className="block text-sm font-medium text-foreground mb-2">
                    Figma Access Token
                  </label>
                  <input
                    type="password"
                    id="figmaToken"
                    name="figmaToken"
                    value={figmaToken}
                    onChange={(e) => setFigmaToken(e.target.value)}
                    placeholder="figd_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    required
                    className="block w-full rounded-md border border-input bg-background px-4 py-2 text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>

                {error && (
                  <div className="rounded-md bg-destructive/10 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-destructive">Error</h3>
                        <div className="mt-2 text-sm text-destructive">
                          <p>{error}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/10 p-4">
                    <div className="flex">
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Success</h3>
                        <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
                          <p>{success}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Token'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </Background>
  );
}
