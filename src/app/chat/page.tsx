'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WhatsAppSimulator from '@/components/chat/WhatsAppSimulator';
import { MessageCircle, Send, Bot, User, Video, Info, Paperclip, Smile, Search, MoreVertical, Phone, Shield, AlertTriangle, ArrowLeft, UserCheck, X } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'CUSTOMER' | 'AI_ASSISTANT' | 'HUMAN_AGENT';
  platform: 'WHATSAPP' | 'EMAIL' | 'SMS';
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  id: string;
  isEscalated: boolean;
  escalatedAt?: string;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    status: string;
  };
  chatMessages: ChatMessage[];
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeadInfo, setShowLeadInfo] = useState(false);
  const [leadInfo, setLeadInfo] = useState<any>(null);
  
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');

  useEffect(() => {
    fetchConversations();
    // Set up polling for real-time updates
    const interval = setInterval(() => fetchConversations(true), 5000);
    return () => clearInterval(interval);
  }, []);

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Update URL with conversation ID
    router.replace(`/chat?conversation=${conversation.id}`, { scroll: false });
  };

  const fetchConversations = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setIsLoading(true);
      }
      const response = await chatApi.getConversations({ 
        limit: 50,
        page: 1 
      });
      
      const conversationsData = response.data.data?.conversations || response.data.conversations || [];
      
      // Sort conversations by latest message time to maintain consistent order
      const sortedConversations = conversationsData.sort((a: Conversation, b: Conversation) => {
        const aTime = a.chatMessages[a.chatMessages.length - 1]?.createdAt || a.lead.id;
        const bTime = b.chatMessages[b.chatMessages.length - 1]?.createdAt || b.lead.id;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });
      
      setConversations(sortedConversations);
      
      // Update the selected conversation with fresh data if it exists in the new data
      if (selectedConversation && isPolling) {
        const updatedSelectedConversation = sortedConversations.find(
          (conv: Conversation) => conv.id === selectedConversation.id
        );
        if (updatedSelectedConversation) {
          setSelectedConversation(updatedSelectedConversation);
        }
        return; // Don't run auto-selection logic during polling
      }
      
      // If URL has conversation ID, select that conversation only if not already selected
      if (conversationId && sortedConversations.length > 0) {
        const targetConversation = sortedConversations.find((conv: Conversation) => conv.id === conversationId);
        if (targetConversation && selectedConversation?.id !== targetConversation.id) {
          setSelectedConversation(targetConversation);
          return;
        }
      }
      
      // Only auto-select first conversation on initial load (when no URL conversation ID and not polling)
      if (!selectedConversation && !conversationId && !isPolling && sortedConversations.length > 0) {
        const firstConversation = sortedConversations[0];
        setSelectedConversation(firstConversation);
        // Update URL to reflect the selected conversation
        router.replace(`/chat?conversation=${firstConversation.id}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to empty array on error
      setConversations([]);
    } finally {
      if (!isPolling) {
        setIsLoading(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    const messageToSend = newMessage;
    
    // Add optimistic update
    const optimisticMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      content: messageToSend,
      sender: 'HUMAN_AGENT',
      platform: 'WHATSAPP',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    // Update local state immediately
    setConversations(prev => prev.map(conv => 
      conv.id === selectedConversation.id 
        ? { ...conv, chatMessages: [...conv.chatMessages, optimisticMessage] }
        : conv
    ));

    setSelectedConversation(prev => prev ? {
      ...prev,
      chatMessages: [...prev.chatMessages, optimisticMessage]
    } : null);

    setNewMessage('');
    setIsSending(true);

    try {
      // Send message via API
      await chatApi.sendMessage({
        leadId: selectedConversation.lead.id,
        message: messageToSend,
        conversationId: selectedConversation.id,
      });
      
      // Refresh conversations to get the updated messages
      await fetchConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, chatMessages: conv.chatMessages.filter(msg => msg.id !== optimisticMessage.id) }
          : conv
      ));
      setSelectedConversation(prev => prev ? {
        ...prev,
        chatMessages: prev.chatMessages.filter(msg => msg.id !== optimisticMessage.id)
      } : null);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const escalateConversation = async (conversationId: string) => {
    try {
      // API call to escalate
      await chatApi.escalateConversation(conversationId, {
        reason: 'manual_takeover'
      });
      
      // Refresh conversations to show updated escalation status
      await fetchConversations();
      
      alert('Conversation escalated successfully. You can now send messages to the customer.');
    } catch (error) {
      console.error('Error escalating conversation:', error);
      alert('Failed to escalate conversation. Please try again.');
    }
  };

  const showLeadDetails = async (conversation: Conversation) => {
    try {
      // Fetch lead info from WhatsApp conversation endpoint
      const response = await fetch(`http://localhost:3001/whatsapp/conversation/${conversation.id}/lead`);
      const data = await response.json();
      
      if (data.lead) {
        setLeadInfo(data.lead);
        setShowLeadInfo(true);
      } else {
        alert('Lead information not available');
      }
    } catch (error) {
      console.error('Error fetching lead info:', error);
      alert('Failed to fetch lead information');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status: string) => {
    if (status === 'escalated') return 'text-orange-500';
    return 'text-green-500';
  };

  const getStatusText = (isEscalated: boolean) => {
    return isEscalated ? 'Human Agent' : 'AI Active';
  };

  const StatusIcon = ({ status }: { status?: string }) => {
    if (status === 'delivered') {
      return (
        <div className="flex">
          <div className="w-3 h-3 text-green-500">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
          </div>
          <div className="w-3 h-3 text-green-500 -ml-1">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
          </div>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen bg-white items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
          <p className="text-gray-600">Manage customer conversations and leads from WhatsApp</p>
        </div>
        
        <div className="flex gap-8">
          {/* Main Chat Interface */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl border border-gray-100 h-[calc(100vh-200px)] overflow-hidden">
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-96 bg-gradient-to-b from-slate-50 to-white border-r border-gray-100 flex flex-col">
                {/* Header */}
                <div className="px-8 py-8 border-b border-gray-100/80">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">WhatsApp Business</h1>
                      <p className="text-sm text-gray-500 mt-0.5">Professional messaging platform</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-3 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-gray-700 placeholder-gray-400 shadow-sm"
                    />
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center justify-between mt-6 px-1">
                    <span className="text-sm font-medium text-gray-600">Active Conversations</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-green-600">{conversations.length}</span>
                    </div>
                  </div>
                </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto">
                {conversations
                  .filter((conversation) => {
                    if (!searchTerm) return true;
                    const searchLower = searchTerm.toLowerCase();
                    const fullName = `${conversation.lead.firstName} ${conversation.lead.lastName}`.toLowerCase();
                    const phone = conversation.lead.phone?.toLowerCase() || '';
                    const lastMessage = conversation.chatMessages[conversation.chatMessages.length - 1]?.content?.toLowerCase() || '';
                    
                    return fullName.includes(searchLower) || 
                           phone.includes(searchLower) || 
                           lastMessage.includes(searchLower);
                  })
                  .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center px-6 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-green-50 border-green-500' 
                        : 'border-transparent'
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-700">
                          {conversation.lead.firstName.charAt(0)}{conversation.lead.lastName.charAt(0)}
                        </span>
                      </div>
                      {!conversation.isEscalated && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.lead.firstName} {conversation.lead.lastName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.chatMessages[conversation.chatMessages.length - 1]?.createdAt || new Date().toISOString())}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.chatMessages.length > 0 
                            ? conversation.chatMessages[conversation.chatMessages.length - 1].content 
                            : 'No messages yet'}
                        </p>
                        <div className="flex items-center ml-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            conversation.isEscalated 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {conversation.isEscalated ? 'escalated' : 'active'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">{conversation.lead.phone}</div>
                    </div>
                  </div>
                ))}
                
                {conversations.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No conversations found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            {selectedConversation ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-green-700">
                          {selectedConversation.lead.firstName.charAt(0)}{selectedConversation.lead.lastName.charAt(0)}
                        </span>
                      </div>
                      {!selectedConversation.isEscalated && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h2 className="text-lg font-medium text-gray-900">
                        {selectedConversation.lead.firstName} {selectedConversation.lead.lastName}
                      </h2>
                      <p className={`text-sm ${getStatusColor(selectedConversation.isEscalated ? 'escalated' : 'active')}`}>
                        {getStatusText(selectedConversation.isEscalated)}
                      </p>
                      <p className="text-xs text-gray-500">{selectedConversation.lead.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {!selectedConversation.isEscalated && (
                      <button
                        onClick={() => escalateConversation(selectedConversation.id)}
                        className="px-3 py-1 text-sm bg-orange-100 text-orange-800 rounded-full hover:bg-orange-200 transition-colors"
                      >
                        Take Over from AI
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Video className="h-5 w-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Phone className="h-5 w-5 text-gray-600" />
                    </button>
                    <button 
                      onClick={() => showLeadDetails(selectedConversation)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                      title="View Lead Information"
                    >
                      <Info className="h-5 w-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {selectedConversation.chatMessages.map((message) => (
                    <div key={message.id} className={`flex ${message.sender !== 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${message.sender !== 'CUSTOMER' ? 'order-1' : ''}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.sender === 'CUSTOMER'
                              ? 'bg-gray-100 text-gray-900'
                              : message.sender === 'AI_ASSISTANT'
                              ? 'bg-blue-500 text-white'
                              : 'bg-green-500 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.sender === 'AI_ASSISTANT' && (
                            <p className="text-xs opacity-75 mt-1">🤖 AI Assistant</p>
                          )}
                        </div>
                        <div className={`flex items-center mt-1 text-xs text-gray-500 ${
                          message.sender !== 'CUSTOMER' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span>{formatTime(message.createdAt)}</span>
                          {message.sender !== 'CUSTOMER' && (
                            <div className="ml-2">
                              <StatusIcon status="delivered" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200">
                  {selectedConversation.isEscalated ? (
                    <div className="flex items-center space-x-3">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Paperclip className="h-5 w-5 text-gray-600" />
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                          <Smile className="h-5 w-5 text-gray-600" />
                        </button>
                        <button 
                          onClick={sendMessage}
                          disabled={!newMessage.trim() || isSending}
                          className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-full font-medium transition-colors"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        🤖 This conversation is handled by AI Assistant. Click "Take Over from AI" to join the conversation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <MessageCircle className="w-24 h-24 mx-auto mb-6 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">WhatsApp Business Integration</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a conversation to view messages and respond to customer inquiries. 
                    AI assistant handles initial responses and escalates when needed.
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>
          
          {/* WhatsApp Simulator for Testing */}
          <div className="w-96">
            <WhatsAppSimulator onMessageSent={fetchConversations} />
          </div>
        </div>
        
        {/* Lead Information Modal */}
        {showLeadInfo && leadInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <UserCheck className="w-6 h-6 text-blue-600 mr-2" />
                  Lead Information
                </h2>
                <button
                  onClick={() => setShowLeadInfo(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">First Name</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.firstName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Name</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.lastName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Lead Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Lead Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <p className="mt-1">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          leadInfo.status === 'NEW' ? 'bg-blue-100 text-blue-800' :
                          leadInfo.status === 'QUALIFIED' ? 'bg-green-100 text-green-800' :
                          leadInfo.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {leadInfo.status || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Source</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.source || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Insurance Type</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.insuranceType || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Lead Score</label>
                      <p className="mt-1 text-sm text-gray-900">{leadInfo.score || 0}/100</p>
                    </div>
                  </div>
                </div>

                {/* Inquiry Details */}
                {leadInfo.inquiryDetails && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Inquiry Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{leadInfo.inquiryDetails}</p>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Timeline</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Created</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {leadInfo.createdAt ? new Date(leadInfo.createdAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {leadInfo.updatedAt ? new Date(leadInfo.updatedAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    {leadInfo.lastContactedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Last Contacted</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(leadInfo.lastContactedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowLeadInfo(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}