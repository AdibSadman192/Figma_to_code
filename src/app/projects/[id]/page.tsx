'use client';

import { useEffect, useState } from 'react';
import { useSupabase } from '@/app/providers';
import CodePreview from '@/components/CodePreview';
import StatusBadge from '@/components/StatusBadge';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navigation/Navbar';
import { Background } from '@/components/ui/background';

interface Project {
  id: string;
  name: string;
  figma_url: string;
  status: string;
  created_at: string;
}

interface GeneratedCode {
  id: string;
  file_path: string;
  code_content: string;
  status: string;
}

export default function ProjectDetails() {
  const { supabase } = useSupabase();
  const params = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [generatedCode, setGeneratedCode] = useState<GeneratedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        // Load project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', params.id)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);

        // Load generated code
        const { data: codeData, error: codeError } = await supabase
          .from('generated_code')
          .select('*')
          .eq('project_id', params.id);

        if (codeError) throw codeError;
        setGeneratedCode(codeData);
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }

    loadProject();
  }, [supabase, params.id]);

  if (loading) {
    return (
      <Background>
        <div className="min-h-screen">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/4 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </main>
        </div>
      </Background>
    );
  }

  if (error || !project) {
    return (
      <Background>
        <div className="min-h-screen">
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">Error</h3>
                  <div className="mt-2 text-sm text-destructive">
                    <p>{error || 'Project not found'}</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </Background>
    );
  }

  return (
    <Background>
      <div className="min-h-screen">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {project.name || 'Untitled Project'}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              <a
                href={project.figma_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/90"
              >
                View Figma Design
              </a>
            </div>
          </div>

          {generatedCode.length > 0 ? (
            <div className="space-y-6">
              {generatedCode.map((code) => (
                <div key={code.id} className="bg-card rounded-lg shadow-sm">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-foreground">
                        {code.file_path}
                      </h3>
                      <StatusBadge status={code.status} />
                    </div>
                  </div>
                  <div className="p-4">
                    <CodePreview code={code.code_content} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-semibold text-foreground">No code generated yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {project.status === 'pending'
                  ? 'Your code will appear here once generation starts.'
                  : project.status === 'processing'
                  ? 'Code generation is in progress...'
                  : 'No code was generated for this project.'}
              </p>
            </div>
          )}
        </main>
      </div>
    </Background>
  );
}
