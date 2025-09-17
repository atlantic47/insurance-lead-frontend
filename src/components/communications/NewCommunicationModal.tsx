'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Search } from 'lucide-react';
import { CommunicationChannel, Lead } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';

const newCommunicationSchema = z.object({
  leadId: z.string().min(1, 'Lead is required'),
  channel: z.nativeEnum(CommunicationChannel),
  direction: z.enum(['INBOUND', 'OUTBOUND']),
  subject: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
});

type NewCommunicationForm = z.infer<typeof newCommunicationSchema>;

interface NewCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewCommunicationForm) => Promise<void>;
  isLoading: boolean;
  selectedLead?: Lead;
}

export default function NewCommunicationModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading,
  selectedLead 
}: NewCommunicationModalProps) {
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadSearch, setShowLeadSearch] = useState(!selectedLead);

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads', { search: leadSearch }],
    queryFn: () => leadsApi.getAll({ 
      search: leadSearch,
      limit: 20
    }).then(res => res.data),
    enabled: showLeadSearch && leadSearch.length > 2,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<NewCommunicationForm>({
    resolver: zodResolver(newCommunicationSchema),
    defaultValues: {
      leadId: selectedLead?.id || '',
      direction: 'OUTBOUND',
      channel: CommunicationChannel.EMAIL,
    },
  });

  const selectedChannel = watch('channel');

  const handleFormSubmit = async (data: NewCommunicationForm) => {
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error creating communication:', error);
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setValue('leadId', lead.id);
    setShowLeadSearch(false);
    setLeadSearch(`${lead.firstName} ${lead.lastName}`);
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
                    New Communication
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
                      Lead *
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
                            placeholder="Search for a lead..."
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
                    {errors.leadId && (
                      <p className="text-red-600 text-sm mt-1">{errors.leadId.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Channel *
                      </label>
                      <select
                        {...register('channel')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {Object.values(CommunicationChannel).map((channel) => (
                          <option key={channel} value={channel}>
                            {channel.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      {errors.channel && (
                        <p className="text-red-600 text-sm mt-1">{errors.channel.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Direction *
                      </label>
                      <select
                        {...register('direction')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="OUTBOUND">Outbound</option>
                        <option value="INBOUND">Inbound</option>
                      </select>
                      {errors.direction && (
                        <p className="text-red-600 text-sm mt-1">{errors.direction.message}</p>
                      )}
                    </div>
                  </div>

                  {selectedChannel === CommunicationChannel.EMAIL && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Subject
                      </label>
                      <input
                        {...register('subject')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Email subject line..."
                      />
                      {errors.subject && (
                        <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content *
                    </label>
                    <textarea
                      {...register('content')}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        selectedChannel === CommunicationChannel.EMAIL
                          ? 'Email content...'
                          : selectedChannel === CommunicationChannel.SMS
                          ? 'SMS message...'
                          : selectedChannel === CommunicationChannel.WHATSAPP
                          ? 'WhatsApp message...'
                          : 'Communication content...'
                      }
                    />
                    {errors.content && (
                      <p className="text-red-600 text-sm mt-1">{errors.content.message}</p>
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
                          Sending...
                        </>
                      ) : (
                        'Send Communication'
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