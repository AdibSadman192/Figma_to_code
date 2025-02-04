'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useCollaboration } from '@/lib/collaboration/CollaborationProvider';
import { format } from 'date-fns';

interface VersionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VersionHistory({ isOpen, onClose }: VersionHistoryProps) {
  const { projectHistory, restoreVersion } = useCollaboration();
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = async () => {
    if (!selectedVersion) return;
    
    setIsRestoring(true);
    try {
      await restoreVersion(selectedVersion);
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
    } finally {
      setIsRestoring(false);
    }
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
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
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ClockIcon
                      className="h-6 w-6 text-indigo-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-base font-semibold leading-6 text-gray-900"
                    >
                      Version History
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Select a version to restore your project to a previous
                        state. This action can be undone by selecting a more recent
                        version.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 max-h-96 overflow-y-auto">
                  <ul role="list" className="divide-y divide-gray-100">
                    {projectHistory.map((version) => (
                      <li
                        key={version.id}
                        className={`flex items-center justify-between gap-x-6 py-5 px-4 hover:bg-gray-50 cursor-pointer ${
                          selectedVersion === version.id
                            ? 'bg-indigo-50'
                            : ''
                        }`}
                        onClick={() => setSelectedVersion(version.id)}
                      >
                        <div className="min-w-0">
                          <div className="flex items-start gap-x-3">
                            <p className="text-sm font-semibold leading-6 text-gray-900">
                              {version.email}
                            </p>
                            <p className="rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset text-indigo-700 bg-indigo-50 ring-indigo-600/20">
                              {version.type.toUpperCase()}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                            <p className="whitespace-nowrap">
                              {format(
                                new Date(version.timestamp),
                                'MMM d, yyyy h:mm a'
                              )}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className={`inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto ${
                      !selectedVersion || isRestoring
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }`}
                    onClick={handleRestore}
                    disabled={!selectedVersion || isRestoring}
                  >
                    {isRestoring ? 'Restoring...' : 'Restore Version'}
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
