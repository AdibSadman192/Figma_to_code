'use client';

import { useState, useCallback } from 'react';
import CodeEditor from './CodeEditor';
import { Tab } from '@headlessui/react';
import { EyeIcon, CodeBracketIcon, SwatchIcon, ArrowPathIcon, DevicePhoneIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface EnhancedCodePreviewProps {
  html: string;
  css: string;
  assets: Array<{ name: string; url: string }>;
  onSave?: (html: string, css: string) => Promise<void>;
}

export default function EnhancedCodePreview({
  html: initialHtml,
  css: initialCss,
  assets,
  onSave,
}: EnhancedCodePreviewProps) {
  const [html, setHtml] = useState(initialHtml);
  const [css, setCss] = useState(initialCss);
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      await onSave(html, css);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setHtml(initialHtml);
    setCss(initialCss);
    setError(null);
  };

  const renderPreview = useCallback(() => {
    const containerClass = previewMode === 'mobile' ? 'max-w-sm mx-auto' : '';
    
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${containerClass}`}>
        <style>{css}</style>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }, [html, css, previewMode]);

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <Tab.Group>
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-4">
            <Tab.List className="flex space-x-4">
              <Tab
                className={({ selected }) =>
                  `px-3 py-2 text-sm font-medium border-b-2 ${
                    selected
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-5 w-5" />
                  <span>Preview</span>
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-3 py-2 text-sm font-medium border-b-2 ${
                    selected
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <div className="flex items-center space-x-2">
                  <CodeBracketIcon className="h-5 w-5" />
                  <span>HTML</span>
                </div>
              </Tab>
              <Tab
                className={({ selected }) =>
                  `px-3 py-2 text-sm font-medium border-b-2 ${
                    selected
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <div className="flex items-center space-x-2">
                  <SwatchIcon className="h-5 w-5" />
                  <span>CSS</span>
                </div>
              </Tab>
            </Tab.List>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPreviewMode(mode => mode === 'desktop' ? 'mobile' : 'desktop')}
                className="p-1 text-gray-500 hover:text-gray-700"
                title={`Switch to ${previewMode === 'desktop' ? 'mobile' : 'desktop'} view`}
              >
                {previewMode === 'desktop' ? (
                  <DevicePhoneIcon className="h-5 w-5" />
                ) : (
                  <ComputerDesktopIcon className="h-5 w-5" />
                )}
              </button>
              
              <button
                onClick={handleReset}
                className="p-1 text-gray-500 hover:text-gray-700"
                title="Reset changes"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
              
              {onSave && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isSaving ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <Tab.Panels>
          <Tab.Panel className="p-4">
            {renderPreview()}
          </Tab.Panel>
          
          <Tab.Panel className="p-4">
            <CodeEditor
              language="html"
              value={html}
              onChange={setHtml}
              readOnly={!onSave}
            />
          </Tab.Panel>
          
          <Tab.Panel className="p-4">
            <CodeEditor
              language="css"
              value={css}
              onChange={setCss}
              readOnly={!onSave}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {assets.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Assets</h3>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <li
                key={asset.name}
                className="relative group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="aspect-w-1 aspect-h-1">
                  {asset.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={asset.url}
                      alt={asset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <CodeBracketIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-500 truncate">{asset.name}</p>
                  <a
                    href={asset.url}
                    download
                    className="mt-1 text-xs text-indigo-600 hover:text-indigo-500"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
