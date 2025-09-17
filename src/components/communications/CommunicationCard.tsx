'use client';

import { Communication, CommunicationChannel } from '@/types';
import { formatDateTime, getInitials, truncateText } from '@/lib/utils';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Smartphone, 
  Users, 
  Share2,
  Eye,
  EyeOff
} from 'lucide-react';

interface CommunicationCardProps {
  communication: Communication;
  onMarkAsRead: (id: string) => void;
  onClick: () => void;
}

const getChannelIcon = (channel: CommunicationChannel) => {
  switch (channel) {
    case CommunicationChannel.EMAIL:
      return <Mail className="w-4 h-4" />;
    case CommunicationChannel.WHATSAPP:
      return <MessageSquare className="w-4 h-4" />;
    case CommunicationChannel.PHONE:
      return <Phone className="w-4 h-4" />;
    case CommunicationChannel.SMS:
      return <Smartphone className="w-4 h-4" />;
    case CommunicationChannel.IN_APP:
      return <Users className="w-4 h-4" />;
    case CommunicationChannel.SOCIAL_MEDIA:
      return <Share2 className="w-4 h-4" />;
    default:
      return <MessageSquare className="w-4 h-4" />;
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

export default function CommunicationCard({ communication, onMarkAsRead, onClick }: CommunicationCardProps) {
  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!communication.isRead) {
      onMarkAsRead(communication.id);
    }
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer ${
        !communication.isRead ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${getChannelColor(communication.channel)}`}>
            {getChannelIcon(communication.channel)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
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
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {communication.lead?.firstName} {communication.lead?.lastName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleMarkAsRead}
            className="p-1 text-gray-400 hover:text-gray-600"
            title={communication.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {communication.isRead ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
          <span className="text-sm text-gray-500">
            {formatDateTime(communication.sentAt)}
          </span>
        </div>
      </div>

      {communication.subject && (
        <h3 className={`font-medium mb-2 ${!communication.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
          {communication.subject}
        </h3>
      )}

      <p className="text-sm text-gray-600 mb-3">
        {truncateText(communication.content, 150)}
      </p>

      {communication.user && (
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center mr-2">
            <span className="text-xs font-medium">
              {getInitials(communication.user.firstName, communication.user.lastName)}
            </span>
          </div>
          <span>
            {communication.direction === 'OUTBOUND' ? 'Sent by' : 'Handled by'} {communication.user.firstName}
          </span>
        </div>
      )}
    </div>
  );
}