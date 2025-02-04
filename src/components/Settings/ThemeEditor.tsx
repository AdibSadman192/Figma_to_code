'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition, Listbox } from '@headlessui/react';
import {
  XMarkIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/24/outline';
import { useThemeBuilder, Theme, defaultTheme } from '@/lib/theme/ThemeBuilder';

interface ThemeEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ThemeEditor({ isOpen, onClose }: ThemeEditorProps) {
  const {
    themes,
    currentTheme,
    addTheme,
    updateTheme,
    deleteTheme,
    setCurrentTheme,
    exportTheme,
    importTheme,
  } = useThemeBuilder();

  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [editingTheme, setEditingTheme] = useState<Theme>(
    themes[currentTheme] || defaultTheme
  );
  const [importError, setImportError] = useState<string | null>(null);

  const handleCreateTheme = () => {
    const name = `Custom Theme ${Object.keys(themes).length + 1}`;
    const newTheme: Theme = {
      ...defaultTheme,
      name,
    };
    addTheme(newTheme);
    setSelectedTheme(name);
    setEditingTheme(newTheme);
  };

  const handleSaveTheme = () => {
    updateTheme(selectedTheme, editingTheme);
    setCurrentTheme(selectedTheme);
  };

  const handleDeleteTheme = () => {
    if (selectedTheme === 'Default') return;
    deleteTheme(selectedTheme);
    setSelectedTheme('Default');
    setEditingTheme(themes['Default']);
  };

  const handleExport = () => {
    const themeJson = exportTheme(selectedTheme);
    const blob = new Blob([themeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTheme.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setImportError(null);
        const themeJson = e.target?.result as string;
        importTheme(themeJson);
      } catch (error) {
        setImportError('Failed to import theme. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Theme Editor
                    </Dialog.Title>

                    <div className="mt-4">
                      <Listbox value={selectedTheme} onChange={setSelectedTheme}>
                        <div className="relative mt-1">
                          <Listbox.Button className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left border border-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm">
                            <span className="block truncate">{selectedTheme}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                              <ChevronUpDownIcon
                                className="h-5 w-5 text-gray-400"
                                aria-hidden="true"
                              />
                            </span>
                          </Listbox.Button>
                          <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                          >
                            <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                              {Object.keys(themes).map((themeName) => (
                                <Listbox.Option
                                  key={themeName}
                                  className={({ active }) =>
                                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                      active
                                        ? 'bg-indigo-100 text-indigo-900'
                                        : 'text-gray-900'
                                    }`
                                  }
                                  value={themeName}
                                >
                                  {({ selected }) => (
                                    <>
                                      <span
                                        className={`block truncate ${
                                          selected ? 'font-medium' : 'font-normal'
                                        }`}
                                      >
                                        {themeName}
                                      </span>
                                      {selected ? (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                          <CheckIcon
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                          />
                                        </span>
                                      ) : null}
                                    </>
                                  )}
                                </Listbox.Option>
                              ))}
                            </Listbox.Options>
                          </Transition>
                        </div>
                      </Listbox>

                      <div className="mt-4 space-y-4">
                        {/* Color Scheme Editor */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Colors
                          </h4>
                          <div className="mt-2 grid grid-cols-2 gap-4">
                            {Object.entries(editingTheme.colors).map(
                              ([key, value]) => (
                                <div key={key}>
                                  <label
                                    htmlFor={`color-${key}`}
                                    className="block text-sm font-medium text-gray-700"
                                  >
                                    {key}
                                  </label>
                                  <div className="mt-1 flex rounded-md shadow-sm">
                                    <input
                                      type="color"
                                      name={`color-${key}`}
                                      id={`color-${key}`}
                                      value={value}
                                      onChange={(e) =>
                                        setEditingTheme({
                                          ...editingTheme,
                                          colors: {
                                            ...editingTheme.colors,
                                            [key]: e.target.value,
                                          },
                                        })
                                      }
                                      className="h-8 w-8 rounded-l-md border-gray-300"
                                    />
                                    <input
                                      type="text"
                                      value={value}
                                      onChange={(e) =>
                                        setEditingTheme({
                                          ...editingTheme,
                                          colors: {
                                            ...editingTheme.colors,
                                            [key]: e.target.value,
                                          },
                                        })
                                      }
                                      className="block w-full flex-1 rounded-r-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between">
                          <div>
                            <button
                              type="button"
                              onClick={handleCreateTheme}
                              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            >
                              Create New Theme
                            </button>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={handleExport}
                              className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            >
                              Export
                            </button>
                            <label className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 cursor-pointer">
                              Import
                              <input
                                type="file"
                                accept=".json"
                                onChange={handleImport}
                                className="hidden"
                              />
                            </label>
                            {selectedTheme !== 'Default' && (
                              <button
                                type="button"
                                onClick={handleDeleteTheme}
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>

                        {importError && (
                          <div className="mt-2 text-sm text-red-600">
                            {importError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto"
                    onClick={handleSaveTheme}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
