'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Lead, LeadStatus, Communication } from '@/types';
import { getStatusColor, formatDate, formatDateTime, getInitials } from '@/lib/utils';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  Calendar,
  MessageSquare,
  CheckSquare,
  Bot,
  Edit,
  Plus
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi, tasksApi, leadsApi } from '@/lib/api';
import EditLeadModal from './EditLeadModal';
import CreateTaskModal from '../tasks/CreateTaskModal';

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadDetailsModal({ lead, isOpen, onClose }: LeadDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'communications' | 'tasks' | 'ai'>('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const queryClient = useQueryClient();

  const { data: communications } = useQuery({
    queryKey: ['communications', 'lead', lead?.id],
    queryFn: () => communicationsApi.getByLead(lead!.id),
    enabled: !!lead?.id && activeTab === 'communications',
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks', 'lead', lead?.id],
    queryFn: () => tasksApi.getAll({ leadId: lead!.id }).then(res => res.data),
    enabled: !!lead?.id && activeTab === 'tasks',
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => leadsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditModalOpen(false);
      onClose();
    },
  });

  const handleUpdateLead = async (id: string, data: any) => {
    await updateLeadMutation.mutateAsync({ id, data });
  };

  if (!lead) return null;

  const tabs = [
    { key: 'details', label: 'Details', icon: User },
    { key: 'communications', label: 'Communications', icon: MessageSquare },
    { key: 'tasks', label: 'Tasks', icon: CheckSquare },
    { key: 'ai', label: 'AI Insights', icon: Bot },
  ];

  return (
    <>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-blue-600">
                        {getInitials(lead.firstName, lead.lastName)}
                      </span>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                        {lead.firstName} {lead.lastName}
                      </Dialog.Title>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
                          {lead.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-gray-500">{lead.insuranceType}</span>
                        <span className="text-sm text-gray-500">Score: {lead.score.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      className="text-gray-400 hover:text-gray-500"
                      title="Edit Lead"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex">
                  <div className="w-64 border-r border-gray-200 p-6">
                    <nav className="space-y-1">
                      {tabs.map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key as any)}
                          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            activeTab === tab.key
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          <tab.icon className="mr-3 h-5 w-5" />
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  <div className="flex-1 p-6">
                    {activeTab === 'details' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                            <div className="space-y-3">
                              {lead.email && (
                                <div className="flex items-center text-sm">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="text-gray-900">{lead.email}</span>
                                </div>
                              )}
                              {lead.phone && (
                                <div className="flex items-center text-sm">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="text-gray-900">{lead.phone}</span>
                                </div>
                              )}
                              {(lead.city || lead.state || lead.zipCode) && (
                                <div className="flex items-center text-sm">
                                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="text-gray-900">
                                    {[lead.city, lead.state, lead.zipCode].filter(Boolean).join(', ')}
                                  </span>
                                </div>
                              )}
                              {lead.budget && (
                                <div className="flex items-center text-sm">
                                  <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                                  <span className="text-gray-900">${lead.budget.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h4>
                            <div className="space-y-3">
                              <div>
                                <span className="text-sm text-gray-500">Source:</span>
                                <span className="ml-2 text-sm text-gray-900">{lead.source}</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Urgency:</span>
                                <span className="ml-2 text-sm text-gray-900">{lead.urgency}/5</span>
                              </div>
                              <div>
                                <span className="text-sm text-gray-500">Created:</span>
                                <span className="ml-2 text-sm text-gray-900">{formatDateTime(lead.createdAt)}</span>
                              </div>
                              {lead.lastContactedAt && (
                                <div>
                                  <span className="text-sm text-gray-500">Last Contacted:</span>
                                  <span className="ml-2 text-sm text-gray-900">{formatDateTime(lead.lastContactedAt)}</span>
                                </div>
                              )}
                              {lead.expectedCloseDate && (
                                <div>
                                  <span className="text-sm text-gray-500">Expected Close:</span>
                                  <span className="ml-2 text-sm text-gray-900">{formatDate(lead.expectedCloseDate)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {lead.inquiryDetails && (
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Inquiry Details</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                              {lead.inquiryDetails}
                            </p>
                          </div>
                        )}

                        {lead.assignedUser && (
                          <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-2">Assigned To</h4>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {getInitials(lead.assignedUser.firstName, lead.assignedUser.lastName)}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {lead.assignedUser.firstName} {lead.assignedUser.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{lead.assignedUser.role}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'communications' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">Communications History</h4>
                        {communications?.data && communications.data.length > 0 ? (
                          <div className="space-y-4">
                            {communications.data.map((comm: Communication) => (
                              <div key={comm.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {comm.channel}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      comm.direction === 'INBOUND' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {comm.direction}
                                    </span>
                                  </div>
                                  <span className="text-sm text-gray-500">
                                    {formatDateTime(comm.sentAt)}
                                  </span>
                                </div>
                                {comm.subject && (
                                  <h5 className="font-medium text-gray-900 mb-2">{comm.subject}</h5>
                                )}
                                <p className="text-sm text-gray-700">{comm.content}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-center py-8">No communications yet</p>
                        )}
                      </div>
                    )}

                    {activeTab === 'tasks' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">Related Tasks</h4>
                          <button
                            onClick={() => setShowCreateTask(true)}
                            className="jira-button-primary flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Create Task
                          </button>
                        </div>
                        {tasks?.data && tasks.data.length > 0 ? (
                          <div className="space-y-3">
                            {tasks.data.map((task: any) => (
                              <div key={task.id} className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="font-medium text-gray-900">{task.title}</h5>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-700 mb-2">{task.description}</p>
                                )}
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <span>Priority: {task.priority}/5</span>
                                  {task.dueDate && (
                                    <span>Due: {formatDate(task.dueDate)}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">No tasks assigned</p>
                            <button
                              onClick={() => setShowCreateTask(true)}
                              className="jira-button-secondary flex items-center gap-2 mx-auto"
                            >
                              <Plus className="w-4 h-4" />
                              Create First Task
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'ai' && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">AI Insights</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Lead Score Analysis:</strong> This lead has a score of {lead.score.toFixed(1)}/10.
                          </p>
                          <p className="text-sm text-gray-700 mb-2">
                            <strong>Recommended Actions:</strong>
                          </p>
                          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                            {lead.score < 3 && <li>Follow up within 24 hours to increase engagement</li>}
                            {lead.score >= 3 && lead.score < 7 && <li>Schedule a product demonstration</li>}
                            {lead.score >= 7 && <li>Prepare and send a customized proposal</li>}
                            {!lead.phone && <li>Try to obtain phone number for better communication</li>}
                            {lead.urgency >= 4 && <li>Prioritize this lead - high urgency indicated</li>}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>

        <EditLeadModal
          lead={lead}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateLead}
          isLoading={updateLeadMutation.isPending}
        />
      </Dialog>
    </Transition>

    {showCreateTask && lead && (
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        selectedLead={lead || undefined}
        onSuccess={() => {
          setShowCreateTask(false);
          queryClient.invalidateQueries({ queryKey: ['tasks', 'lead', lead?.id] });
        }}
      />
    )}
  </>
  );
}