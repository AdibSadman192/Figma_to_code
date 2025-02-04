'use client';

import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useTheme } from 'next-themes';

interface CodeEditorProps {
  language: 'html' | 'css';
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      monacoEditorRef.current = monaco.editor.create(editorRef.current, {
        value,
        language,
        theme: theme === 'dark' ? 'vs-dark' : 'vs-light',
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        readOnly,
        automaticLayout: true,
        fontSize: 14,
        lineNumbers: 'on',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
        },
        lineHeight: 21,
      });

      if (onChange) {
        monacoEditorRef.current.onDidChangeModelContent(() => {
          onChange(monacoEditorRef.current?.getValue() || '');
        });
      }
    }

    return () => {
      monacoEditorRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (monacoEditorRef.current) {
      if (monacoEditorRef.current.getValue() !== value) {
        monacoEditorRef.current.setValue(value);
      }
    }
  }, [value]);

  useEffect(() => {
    if (monacoEditorRef.current) {
      monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs-light');
    }
  }, [theme]);

  return (
    <div className="h-[500px] border border-gray-200 rounded-lg overflow-hidden">
      <div ref={editorRef} className="h-full w-full" />
    </div>
  );
}
