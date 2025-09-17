'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Task, TaskStatus } from '@/types';
import { getStatusColor, formatDateTime, getInitials, getPriorityColor } from '@/lib/utils';
import { 
  X, 
  User, 
  Calendar, 
  Flag, 
  Clock,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react';

interface TaskDetailsModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: TaskStatus) => void;
}

const TASK_STATUSES = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

export default function TaskDetailsModal({ 
  task, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  onStatusChange 
}: TaskDetailsModalProps) {
  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onStatusChange) {
      onStatusChange(e.target.value as TaskStatus);
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${getPriorityColor(task.priority)}`}>
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                        {task.title}
                      </Dialog.Title>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{task.type.replace('_', ' ')}</span>
                        {isOverdue && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onEdit && (
                      <button
                        onClick={onEdit}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Edit Task"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={onDelete}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                        title="Delete Task"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Task Information</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm text-gray-500">Status:</span>
                          <div className="mt-1">
                            {onStatusChange ? (
                              <select
                                value={task.status}
                                onChange={handleStatusChange}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {TASK_STATUSES.map((status) => (
                                  <option key={status} value={status}>
                                    {status.replace('_', ' ')}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <span className="text-sm text-gray-500">Priority:</span>
                          <div className="mt-1 flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}/5
                            </span>
                            <div className="flex space-x-1">
                              {[1, 2, 3, 4, 5].map((level) => (
                                <Flag
                                  key={level}
                                  className={`w-3 h-3 ${level <= task.priority ? 'text-orange-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-500">Created:</span>
                          <span className="ml-2 text-sm text-gray-900">{formatDateTime(task.createdAt)}</span>
                        </div>

                        {task.dueDate && (
                          <div>
                            <span className="text-sm text-gray-500">Due Date:</span>
                            <span className={`ml-2 text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                              {formatDateTime(task.dueDate)}
                            </span>
                          </div>
                        )}

                        {task.completedAt && (
                          <div>
                            <span className="text-sm text-gray-500">Completed:</span>
                            <span className="ml-2 text-sm text-green-600">{formatDateTime(task.completedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Assignment & Relations</h4>
                      <div className="space-y-3">
                        {task.assignedUser && (
                          <div>
                            <span className="text-sm text-gray-500">Assigned To:</span>
                            <div className="mt-1 flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {getInitials(task.assignedUser.firstName, task.assignedUser.lastName)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {task.assignedUser.firstName} {task.assignedUser.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{task.assignedUser.role}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {task.lead && (
                          <div>
                            <span className="text-sm text-gray-500">Related Lead:</span>
                            <div className="mt-1 flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
                                  {getInitials(task.lead.firstName, task.lead.lastName)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {task.lead.firstName} {task.lead.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{task.lead.email}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {task.description && (
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">Description</h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Progress indicators */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Progress</h4>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          task.status === TaskStatus.COMPLETED
                            ? 'bg-green-500'
                            : task.status === TaskStatus.IN_PROGRESS
                            ? 'bg-blue-500'
                            : task.status === TaskStatus.CANCELLED
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                        style={{
                          width: 
                            task.status === TaskStatus.COMPLETED
                              ? '100%'
                              : task.status === TaskStatus.IN_PROGRESS
                              ? '50%'
                              : task.status === TaskStatus.CANCELLED
                              ? '100%'
                              : '0%'
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Pending</span>
                      <span>In Progress</span>
                      <span>Completed</span>
                    </div>
                  </div>
                </div>

                {(onEdit || onStatusChange) && (
                  <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                    {task.status !== TaskStatus.COMPLETED && onStatusChange && (
                      <button
                        onClick={() => onStatusChange(TaskStatus.COMPLETED)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </button>
                    )}
                    {onEdit && (
                      <button
                        onClick={onEdit}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Task
                      </button>
                    )}
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}