'use client';

import { useState } from 'react';
import { useSupabase } from '@/app/providers';
import { FigmaService } from '@/lib/services/figma';
import Navbar from '@/components/Navigation/Navbar';
import { useRouter } from 'next/navigation';
import { Background } from '@/components/ui/background';

export default function Dashboard() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const [figmaUrl, setFigmaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Check if Figma token exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('figma_access_token')
        .single();

      if (!profile?.figma_access_token) {
        router.push('/settings?message=Please add your Figma access token first');
        return;
      }

      const figmaService = new FigmaService(supabase);
      const result = await figmaService.processFile(figmaUrl);
      setSuccess(`Successfully imported "${result.name}". Redirecting to project...`);
      setTimeout(() => {
        router.push('/projects');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-8">
              Import Figma Design
            </h1>

            <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-lg font-medium text-foreground mb-4">Instructions</h2>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Open your Figma design</li>
                <li>Click "Share" and set link access to "Anyone with the link"</li>
                <li>Copy either:
                  <ul className="list-disc list-inside ml-4 mt-2">
                    <li>The file URL (e.g., https://www.figma.com/file/xxxxx)</li>
                    <li>The design URL (e.g., https://www.figma.com/design/xxxxx)</li>
                  </ul>
                </li>
                <li>Paste the URL below and click "Import Design"</li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="figmaUrl" className="block text-sm font-medium text-foreground mb-2">
                  Figma URL
                </label>
                <input
                  type="url"
                  id="figmaUrl"
                  name="figmaUrl"
                  value={figmaUrl}
                  onChange={(e) => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/... or https://www.figma.com/design/..."
                  required
                  pattern="https://www\.figma\.com/(file|design)/[a-zA-Z0-9_-]+(/.*)?$"
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
                {loading ? 'Importing...' : 'Import Design'}
              </button>
            </form>
          </div>
        </main>
      </div>
    </Background>
  );
}
