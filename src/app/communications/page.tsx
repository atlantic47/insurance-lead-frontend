'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CommunicationCard from '@/components/communications/CommunicationCard';
import CommunicationDetailsModal from '@/components/communications/CommunicationDetailsModal';
import NewCommunicationModal from '@/components/communications/NewCommunicationModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/lib/api';
import { Communication, CommunicationChannel } from '@/types';
import { 
  Filter, 
  Search, 
  Plus, 
  Mail, 
  MessageSquare, 
  Phone, 
  Smartphone, 
  Users, 
  Share2 
} from 'lucide-react';

export default function CommunicationsPage() {
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState<CommunicationChannel | 'ALL'>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'READ' | 'unread'>('ALL');

  const queryClient = useQueryClient();

  const { data: communicationsResponse, isLoading } = useQuery({
    queryKey: ['communications', { search: searchTerm, channel: channelFilter, direction: directionFilter, read: readFilter }],
    queryFn: () => communicationsApi.getAll({
      search: searchTerm,
      channel: channelFilter === 'ALL' ? undefined : channelFilter,
      direction: directionFilter === 'ALL' ? undefined : directionFilter,
      isRead: readFilter === 'ALL' ? undefined : (readFilter as string) === 'read',
      limit: 50,
      sortBy: 'sentAt',
      sortOrder: 'desc'
    }).then(res => res.data),
  });

  const createCommunicationMutation = useMutation({
    mutationFn: communicationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      setIsNewModalOpen(false);
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: communicationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });

  const handleCreateCommunication = async (data: any) => {
    await createCommunicationMutation.mutateAsync(data);
  };

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleCommunicationClick = (communication: Communication) => {
    setSelectedCommunication(communication);
    setIsDetailsModalOpen(true);
    if (!communication.isRead) {
      handleMarkAsRead(communication.id);
    }
  };

  const communications = communicationsResponse?.data || [];
  const unreadCount = communications.filter(c => !c.isRead).length;

  const getChannelStats = () => {
    const stats = communications.reduce((acc, comm) => {
      acc[comm.channel] = (acc[comm.channel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(stats).map(([channel, count]) => ({ channel, count }));
  };

  const channelStats = getChannelStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="jira-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Communications</h1>
            <p className="text-gray-600 mt-1">Manage multi-channel communications with leads</p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Communication
          </button>
        </div>
      </div>
      
      <div className="jira-page-content">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{communications.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Unread</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Phone className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Inbound</p>
                <p className="text-2xl font-bold text-gray-900">
                  {communications.filter(c => c.direction === 'INBOUND').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Share2 className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Outbound</p>
                <p className="text-2xl font-bold text-gray-900">
                  {communications.filter(c => c.direction === 'OUTBOUND').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search communications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Channels</option>
              {Object.values(CommunicationChannel).map((channel) => (
                <option key={channel} value={channel}>
                  {channel.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Directions</option>
              <option value="INBOUND">Inbound</option>
              <option value="OUTBOUND">Outbound</option>
            </select>

            <select
              value={readFilter}
              onChange={(e) => setReadFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Messages</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          {channelStats.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {channelStats.map(({ channel, count }) => (
                <span key={channel} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {channel}: {count}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {communications.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No communications found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || channelFilter !== 'ALL' || directionFilter !== 'ALL' || readFilter !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Start communicating with your leads to see activity here.'}
              </p>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Communication
              </button>
            </div>
          ) : (
            communications.map((communication) => (
              <CommunicationCard
                key={communication.id}
                communication={communication}
                onMarkAsRead={handleMarkAsRead}
                onClick={() => handleCommunicationClick(communication)}
              />
            ))
          )}
        </div>

        <NewCommunicationModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateCommunication}
          isLoading={createCommunicationMutation.isPending}
        />

        <CommunicationDetailsModal
          communication={selectedCommunication}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}