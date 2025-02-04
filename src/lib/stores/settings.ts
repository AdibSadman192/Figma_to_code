import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CodeGenerationSettings {
  framework: 'vanilla' | 'tailwind' | 'bootstrap';
  cssModules: boolean;
  typescript: boolean;
  responsive: boolean;
  darkMode: boolean;
  accessibility: boolean;
  comments: boolean;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  formatOnSave: boolean;
}

export interface ProjectSettings {
  defaultFramework: CodeGenerationSettings['framework'];
  autoSave: boolean;
  autoPreview: boolean;
}

interface SettingsState {
  codeGeneration: CodeGenerationSettings;
  editor: EditorSettings;
  project: ProjectSettings;
  updateCodeGeneration: (settings: Partial<CodeGenerationSettings>) => void;
  updateEditor: (settings: Partial<EditorSettings>) => void;
  updateProject: (settings: Partial<ProjectSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: Omit<
  SettingsState,
  'updateCodeGeneration' | 'updateEditor' | 'updateProject' | 'resetToDefaults'
> = {
  codeGeneration: {
    framework: 'tailwind',
    cssModules: false,
    typescript: true,
    responsive: true,
    darkMode: true,
    accessibility: true,
    comments: true,
  },
  editor: {
    fontSize: 14,
    tabSize: 2,
    wordWrap: true,
    minimap: false,
    lineNumbers: true,
    formatOnSave: true,
  },
  project: {
    defaultFramework: 'tailwind',
    autoSave: true,
    autoPreview: true,
  },
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaultSettings,
      
      updateCodeGeneration: (settings) =>
        set((state) => ({
          codeGeneration: { ...state.codeGeneration, ...settings },
        })),
        
      updateEditor: (settings) =>
        set((state) => ({
          editor: { ...state.editor, ...settings },
        })),
        
      updateProject: (settings) =>
        set((state) => ({
          project: { ...state.project, ...settings },
        })),
        
      resetToDefaults: () => set(defaultSettings),
    }),
    {
      name: 'figma-to-code-settings',
    }
  )
);
