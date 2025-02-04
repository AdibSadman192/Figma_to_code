'use client';

import { Fragment } from 'react';
import { Dialog, Transition, Switch } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useSettings } from '@/lib/stores/settings';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const {
    codeGeneration,
    editor,
    project,
    updateCodeGeneration,
    updateEditor,
    updateProject,
    resetToDefaults,
  } = useSettings();

  return (
    <Transition.Root show={open} as={Fragment}>
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

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between py-4">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                          Settings
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative flex-1 px-4 sm:px-6">
                      <div className="space-y-6 py-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Code Generation</h3>
                          <div className="mt-4 space-y-4">
                            <SwitchSetting
                              label="Generate TypeScript"
                              description="Use TypeScript instead of JavaScript for generated code"
                              checked={codeGeneration.typescript}
                              onChange={(checked) => updateCodeGeneration({ typescript: checked })}
                            />
                            <SwitchSetting
                              label="Generate CSS Modules"
                              description="Use CSS Modules for styling instead of Tailwind CSS"
                              checked={codeGeneration.cssModules}
                              onChange={(checked) => updateCodeGeneration({ cssModules: checked })}
                            />
                            <SwitchSetting
                              label="Generate Tests"
                              description="Generate test files for components"
                              checked={codeGeneration.tests}
                              onChange={(checked) => updateCodeGeneration({ tests: checked })}
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Editor</h3>
                          <div className="mt-4 space-y-4">
                            <SwitchSetting
                              label="Auto Format"
                              description="Automatically format code on save"
                              checked={editor.autoFormat}
                              onChange={(checked) => updateEditor({ autoFormat: checked })}
                            />
                            <SwitchSetting
                              label="Line Numbers"
                              description="Show line numbers in editor"
                              checked={editor.lineNumbers}
                              onChange={(checked) => updateEditor({ lineNumbers: checked })}
                            />
                            <SwitchSetting
                              label="Word Wrap"
                              description="Enable word wrapping"
                              checked={editor.wordWrap}
                              onChange={(checked) => updateEditor({ wordWrap: checked })}
                            />
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium text-gray-900">Project</h3>
                          <div className="mt-4 space-y-4">
                            <SwitchSetting
                              label="Auto Save"
                              description="Automatically save changes"
                              checked={project.autoSave}
                              onChange={(checked) => updateProject({ autoSave: checked })}
                            />
                            <SwitchSetting
                              label="Live Preview"
                              description="Show live preview of changes"
                              checked={project.livePreview}
                              onChange={(checked) => updateProject({ livePreview: checked })}
                            />
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            type="button"
                            className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                            onClick={resetToDefaults}
                          >
                            Reset to Defaults
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

interface SwitchSettingProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function SwitchSetting({ label, description, checked, onChange }: SwitchSettingProps) {
  return (
    <Switch.Group as="div" className="flex items-center justify-between">
      <span className="flex flex-grow flex-col">
        <Switch.Label as="span" className="text-sm font-medium text-gray-900" passive>
          {label}
        </Switch.Label>
        <Switch.Description as="span" className="text-sm text-gray-500">
          {description}
        </Switch.Description>
      </span>
      <Switch
        checked={checked}
        onChange={onChange}
        className={`${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2`}
      >
        <span
          aria-hidden="true"
          className={`${
            checked ? 'translate-x-5' : 'translate-x-0'
          } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </Switch.Group>
  );
}
