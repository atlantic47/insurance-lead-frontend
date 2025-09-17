'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Communication, CommunicationChannel } from '@/types';
import { formatDateTime, getInitials } from '@/lib/utils';
import { 
  X, 
  Mail, 
  MessageSquare, 
  Phone, 
  Smartphone, 
  Users, 
  Share2,
  Reply,
  Forward
} from 'lucide-react';

interface CommunicationDetailsModalProps {
  communication: Communication | null;
  isOpen: boolean;
  onClose: () => void;
  onReply?: () => void;
  onForward?: () => void;
}

const getChannelIcon = (channel: CommunicationChannel, size = 20) => {
  const props = { size };
  switch (channel) {
    case CommunicationChannel.EMAIL:
      return <Mail {...props} />;
    case CommunicationChannel.WHATSAPP:
      return <MessageSquare {...props} />;
    case CommunicationChannel.PHONE:
      return <Phone {...props} />;
    case CommunicationChannel.SMS:
      return <Smartphone {...props} />;
    case CommunicationChannel.IN_APP:
      return <Users {...props} />;
    case CommunicationChannel.SOCIAL_MEDIA:
      return <Share2 {...props} />;
    default:
      return <MessageSquare {...props} />;
  }
};

const getChannelColor = (channel: CommunicationChannel) => {
  switch (channel) {
    case CommunicationChannel.EMAIL:
      return 'bg-blue-100 text-blue-800';
    case CommunicationChannel.WHATSAPP:
      return 'bg-green-100 text-green-800';
    case CommunicationChannel.PHONE:
      return 'bg-purple-100 text-purple-800';
    case CommunicationChannel.SMS:
      return 'bg-yellow-100 text-yellow-800';
    case CommunicationChannel.IN_APP:
      return 'bg-indigo-100 text-indigo-800';
    case CommunicationChannel.SOCIAL_MEDIA:
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function CommunicationDetailsModal({ 
  communication, 
  isOpen, 
  onClose, 
  onReply, 
  onForward 
}: CommunicationDetailsModalProps) {
  if (!communication) return null;

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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${getChannelColor(communication.channel)}`}>
                      {getChannelIcon(communication.channel, 24)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getChannelColor(communication.channel)}`}>
                          {communication.channel}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          communication.direction === 'INBOUND' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {communication.direction}
                        </span>
                        {!communication.isRead && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            UNREAD
                          </span>
                        )}
                      </div>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        {communication.subject || `${communication.channel} Communication`}
                      </Dialog.Title>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {onReply && communication.channel === CommunicationChannel.EMAIL && (
                      <button
                        onClick={onReply}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Reply"
                      >
                        <Reply className="w-5 h-5" />
                      </button>
                    )}
                    {onForward && communication.channel === CommunicationChannel.EMAIL && (
                      <button
                        onClick={onForward}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                        title="Forward"
                      >
                        <Forward className="w-5 h-5" />
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {communication.lead && (
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {getInitials(communication.lead.firstName, communication.lead.lastName)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {communication.lead.firstName} {communication.lead.lastName}
                            </p>
                            <p className="text-sm text-gray-500">{communication.lead.email}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{formatDateTime(communication.sentAt)}</p>
                      {communication.user && (
                        <p className="text-sm text-gray-500">
                          {communication.direction === 'OUTBOUND' ? 'Sent by' : 'Handled by'} {communication.user.firstName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-900">
                        {communication.content}
                      </div>
                    </div>
                  </div>

                  {communication.metadata && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Metadata</h4>
                      <div className="bg-gray-50 rounded p-3">
                        <pre className="text-xs text-gray-600 overflow-x-auto">
                          {JSON.stringify(communication.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>

                {(onReply || onForward) && communication.channel === CommunicationChannel.EMAIL && (
                  <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                    {onReply && (
                      <button
                        onClick={onReply}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                      </button>
                    )}
                    {onForward && (
                      <button
                        onClick={onForward}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Forward className="w-4 h-4 mr-2" />
                        Forward
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