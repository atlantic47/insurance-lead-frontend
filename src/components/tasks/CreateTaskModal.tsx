'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Search } from 'lucide-react';
import { TaskType, Lead, User } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { leadsApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.nativeEnum(TaskType),
  priority: z.number().min(1).max(5),
  dueDate: z.string().optional(),
  leadId: z.string().optional(),
  assignedUserId: z.string().min(1, 'Assigned user is required'),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTaskForm) => Promise<void>;
  isLoading: boolean;
  selectedLead?: Lead;
}

export default function CreateTaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading,
  selectedLead 
}: CreateTaskModalProps) {
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadSearch, setShowLeadSearch] = useState(!selectedLead);
  const { user: currentUser } = useAuthStore();

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads', { search: leadSearch }],
    queryFn: () => leadsApi.getAll({ 
      search: leadSearch,
      limit: 20
    }).then(res => res.data),
    enabled: showLeadSearch && leadSearch.length > 2,
  });

  const { data: usersResponse } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll({ limit: 50 }).then(res => res.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      leadId: selectedLead?.id || '',
      assignedUserId: currentUser?.id || '',
      priority: 3,
      type: TaskType.FOLLOW_UP,
    },
  });

  const selectedType = watch('type');

  const handleFormSubmit = async (data: CreateTaskForm) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setValue('leadId', lead.id);
    setShowLeadSearch(false);
    setLeadSearch(`${lead.firstName} ${lead.lastName}`);
  };

  const getTaskTypeDescription = (type: TaskType) => {
    switch (type) {
      case TaskType.FOLLOW_UP:
        return 'Follow up with a lead or client';
      case TaskType.CALL:
        return 'Schedule or make a phone call';
      case TaskType.EMAIL:
        return 'Send or respond to an email';
      case TaskType.MEETING:
        return 'Schedule or attend a meeting';
      case TaskType.PROPOSAL:
        return 'Prepare or send a proposal';
      case TaskType.OTHER:
        return 'Other task or activity';
      default:
        return '';
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Create New Task
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      {...register('title')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter task title..."
                    />
                    {errors.title && (
                      <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type *
                      </label>
                      <select
                        {...register('type')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.values(TaskType).map((type) => (
                          <option key={type} value={type}>
                            {type.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      {selectedType && (
                        <p className="text-xs text-gray-500 mt-1">
                          {getTaskTypeDescription(selectedType)}
                        </p>
                      )}
                      {errors.type && (
                        <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority *
                      </label>
                      <select
                        {...register('priority', { valueAsNumber: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>1 - Very Low</option>
                        <option value={2}>2 - Low</option>
                        <option value={3}>3 - Medium</option>
                        <option value={4}>4 - High</option>
                        <option value={5}>5 - Very High</option>
                      </select>
                      {errors.priority && (
                        <p className="text-red-600 text-sm mt-1">{errors.priority.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign To *
                    </label>
                    <select
                      {...register('assignedUserId')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select user...</option>
                      {usersResponse?.data.map((user: User) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.role})
                        </option>
                      ))}
                    </select>
                    {errors.assignedUserId && (
                      <p className="text-red-600 text-sm mt-1">{errors.assignedUserId.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Related Lead (Optional)
                    </label>
                    {selectedLead && !showLeadSearch ? (
                      <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md bg-gray-50">
                        <span className="text-sm text-gray-900">
                          {selectedLead.firstName} {selectedLead.lastName} - {selectedLead.email}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLeadSearch(true)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                          <input
                            type="text"
                            placeholder="Search for a lead (optional)..."
                            value={leadSearch}
                            onChange={(e) => setLeadSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        {leadSearch.length > 2 && leadsResponse?.data && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {leadsResponse.data.map((lead: Lead) => (
                              <button
                                key={lead.id}
                                type="button"
                                onClick={() => handleLeadSelect(lead)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:outline-none focus:bg-gray-50"
                              >
                                <div className="font-medium text-gray-900">
                                  {lead.firstName} {lead.lastName}
                                </div>
                                <div className="text-sm text-gray-500">{lead.email}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <input type="hidden" {...register('leadId')} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      {...register('dueDate')}
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.dueDate && (
                      <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe the task in detail..."
                    />
                    {errors.description && (
                      <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Creating...
                        </>
                      ) : (
                        'Create Task'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}