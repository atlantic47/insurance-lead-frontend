'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { MessageCircle, Send, Bot, User, Video, Info, Paperclip, Smile, Search, Phone, UserCheck, X, Globe, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'CUSTOMER' | 'AI_ASSISTANT' | 'HUMAN_AGENT';
  platform: 'WEBSITE' | 'WHATSAPP' | 'EMAIL' | 'SMS';
  createdAt: string;
  isRead: boolean;
  metadata?: any;
}

interface Conversation {
  id: string;
  isEscalated: boolean;
  escalatedAt?: string;
  createdAt: string;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    status: string;
  };
  metadata?: {
    widgetId?: string;
    url?: string;
    domain?: string;
    messageCount?: number;
    lastMessageAt?: string;
  };
  chatMessages: ChatMessage[];
}

export default function AIConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLeadInfo, setShowLeadInfo] = useState(false);

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
    router.replace(`/ai-conversations?conversation=${conversation.id}`, { scroll: false });
  };

  const fetchConversations = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setIsLoading(true);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/ai/widget/conversations?limit=50&page=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch conversations');

      const data = await response.json();
      const conversationsData = data.data?.conversations || [];

      // Sort conversations by latest message time
      const sortedConversations = conversationsData.sort((a: Conversation, b: Conversation) => {
        const aTime = a.metadata?.lastMessageAt || a.createdAt;
        const bTime = b.metadata?.lastMessageAt || b.createdAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConversations(sortedConversations);

      // Update the selected conversation with fresh data if it exists
      if (selectedConversation && isPolling) {
        const updatedSelected = sortedConversations.find(
          (conv: Conversation) => conv.id === selectedConversation.id
        );
        if (updatedSelected) {
          setSelectedConversation(updatedSelected);
        }
        return;
      }

      // If URL has conversation ID, select that conversation
      if (conversationId && sortedConversations.length > 0) {
        const targetConversation = sortedConversations.find((conv: Conversation) => conv.id === conversationId);
        if (targetConversation && selectedConversation?.id !== targetConversation.id) {
          setSelectedConversation(targetConversation);
          return;
        }
      }

      // Auto-select first conversation on initial load
      if (!selectedConversation && !conversationId && !isPolling && sortedConversations.length > 0) {
        const firstConversation = sortedConversations[0];
        setSelectedConversation(firstConversation);
        router.replace(`/ai-conversations?conversation=${firstConversation.id}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
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
      platform: 'WEBSITE',
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
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/ai/widget/conversations/${selectedConversation.id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageToSend }),
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

  const takeoverConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/ai/widget/conversations/${conversationId}/takeover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'manual_takeover' }),
      });

      // Refresh conversations to show updated escalation status
      await fetchConversations();

      alert('Conversation taken over successfully. You can now send messages to the customer.');
    } catch (error) {
      console.error('Error taking over conversation:', error);
      alert('Failed to take over conversation. Please try again.');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen bg-white items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                AI Website Conversations
              </h1>
              <p className="text-gray-600 mt-1">Manage conversations from your website chat widget</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">AI Powered</span>
            </div>
          </div>
        </div>

        <div className="flex gap-0 bg-white rounded-2xl shadow-xl border border-gray-100 h-[calc(100vh-200px)] overflow-hidden">
          {/* Main Chat Interface */}
          <div className="flex-1">
            <div className="flex h-full">
              {/* Sidebar */}
              <div className="w-96 bg-gradient-to-b from-slate-50 to-white border-r border-gray-100 flex flex-col">
                {/* Header */}
                <div className="px-8 py-8 border-b border-gray-100/80">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Website Chats</h1>
                      <p className="text-sm text-gray-500 mt-0.5">AI-powered chat widget</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-4 pr-12 py-3.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-3 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-600 shadow-sm"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                  </div>
                  <div className="flex items-center justify-between mt-6 px-1">
                    <span className="text-sm font-medium text-gray-600">Active Conversations</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-semibold text-blue-600">{conversations.length}</span>
                    </div>
                  </div>
                </div>

              {/* Contacts List */}
              <div className="flex-1 overflow-y-auto">
                {conversations
                  .filter((conversation) => {
                    if (!searchTerm) return true;
                    const searchLower = searchTerm.toLowerCase();
                    const fullName = `${conversation.lead?.firstName || ''} ${conversation.lead?.lastName || ''}`.toLowerCase();
                    const email = conversation.lead?.email?.toLowerCase() || '';
                    const domain = conversation.metadata?.domain?.toLowerCase() || '';
                    const lastMessage = conversation.chatMessages[conversation.chatMessages.length - 1]?.content?.toLowerCase() || '';

                    return fullName.includes(searchLower) ||
                           email.includes(searchLower) ||
                           domain.includes(searchLower) ||
                           lastMessage.includes(searchLower);
                  })
                  .map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`flex items-center px-6 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'border-transparent'
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                        {conversation.lead ? (
                          <span className="text-sm font-medium text-blue-700">
                            {conversation.lead.firstName.charAt(0)}{conversation.lead.lastName.charAt(0)}
                          </span>
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      {!conversation.isEscalated && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conversation.lead
                            ? `${conversation.lead.firstName} ${conversation.lead.lastName}`
                            : 'Website Visitor'}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.metadata?.lastMessageAt || conversation.createdAt)}
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
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {conversation.isEscalated ? 'agent' : 'AI'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <Globe className="w-3 h-3" />
                        {conversation.metadata?.domain || 'Unknown website'}
                      </div>
                    </div>
                  </div>
                ))}

                {conversations.length === 0 && (
                  <div className="p-6 text-center text-gray-500">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No conversations found</p>
                    <p className="text-xs mt-2">Conversations from your website widget will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            {selectedConversation ? (
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {selectedConversation.lead ? (
                          <span className="text-sm font-medium text-blue-700">
                            {selectedConversation.lead.firstName.charAt(0)}{selectedConversation.lead.lastName.charAt(0)}
                          </span>
                        ) : (
                          <User className="w-6 h-6 text-blue-600" />
                        )}
                      </div>
                      {!selectedConversation.isEscalated && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="ml-3">
                      <h2 className="text-lg font-medium text-gray-900">
                        {selectedConversation.lead
                          ? `${selectedConversation.lead.firstName} ${selectedConversation.lead.lastName}`
                          : 'Website Visitor'}
                      </h2>
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${selectedConversation.isEscalated ? 'text-orange-600' : 'text-blue-600'}`}>
                          {selectedConversation.isEscalated ? '👤 Human Agent' : '🤖 AI Active'}
                        </p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {selectedConversation.metadata?.domain || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    {!selectedConversation.isEscalated && (
                      <button
                        onClick={() => takeoverConversation(selectedConversation.id)}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-sm font-medium flex items-center gap-2"
                      >
                        <UserCheck className="w-4 h-4" />
                        Take Over from AI
                      </button>
                    )}
                    {selectedConversation.lead && (
                      <button
                        onClick={() => setShowLeadInfo(true)}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                        title="View Lead Information"
                      >
                        <Info className="h-5 w-5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {selectedConversation.chatMessages.map((message) => {
                    // Check if this is a system/handover message
                    const isSystemMessage = message.metadata?.system || message.metadata?.handover;

                    if (isSystemMessage) {
                      return (
                        <div key={message.id} className="flex justify-center">
                          <div className="max-w-md">
                            <div className="px-4 py-2 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-center">
                              <p className="text-sm">{message.content}</p>
                            </div>
                            <div className="flex items-center justify-center mt-1 text-xs text-gray-500">
                              <span>{formatTime(message.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={message.id} className={`flex ${message.sender !== 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md ${message.sender !== 'CUSTOMER' ? 'order-1' : ''}`}>
                          <div
                            className={`px-4 py-2 rounded-2xl ${
                              message.sender === 'CUSTOMER'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : message.sender === 'AI_ASSISTANT'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            {message.sender === 'AI_ASSISTANT' && !isSystemMessage && (
                              <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                                <Bot className="w-3 h-3" /> AI Assistant
                              </p>
                            )}
                            {message.sender === 'HUMAN_AGENT' && message.metadata?.agentName && (
                              <p className="text-xs opacity-75 mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" /> {message.metadata.agentName}
                              </p>
                            )}
                          </div>
                          <div className={`flex items-center mt-1 text-xs text-gray-500 ${
                            message.sender !== 'CUSTOMER' ? 'justify-end' : 'justify-start'
                          }`}>
                            <span>{formatTime(message.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200 bg-white">
                  {selectedConversation.isEscalated ? (
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type a message..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:from-gray-400 disabled:to-gray-400 text-white px-6 py-3 rounded-full font-medium transition-all shadow-sm disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bot className="w-10 h-10 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            🤖 This conversation is handled by AI Assistant
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Click "Take Over from AI" to join the conversation as a human agent
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* No Chat Selected */
              <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                    <Bot className="w-12 h-12 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">AI Website Chat Integration</h3>
                  <p className="text-gray-500 max-w-md">
                    Select a conversation to view messages and respond to customer inquiries.
                    AI assistant handles initial responses and escalates when needed.
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Customer Details Panel */}
          {selectedConversation && (
            <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
              {/* Customer Profile */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  {selectedConversation.lead ? (
                    <span className="text-2xl font-medium text-blue-700">
                      {selectedConversation.lead.firstName.charAt(0)}{selectedConversation.lead.lastName.charAt(0)}
                    </span>
                  ) : (
                    <User className="w-10 h-10 text-blue-600" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedConversation.lead
                    ? `${selectedConversation.lead.firstName} ${selectedConversation.lead.lastName}`
                    : 'Website Visitor'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedConversation.lead?.status || 'New Lead'}
                </p>
              </div>

              {/* Contact Information */}
              {selectedConversation.lead && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                  <div className="space-y-2">
                    {selectedConversation.lead.phone && (
                      <div className="flex items-center text-sm">
                        <Phone className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{selectedConversation.lead.phone}</span>
                      </div>
                    )}
                    {selectedConversation.lead.email && (
                      <div className="flex items-center text-sm">
                        <span className="text-gray-400 mr-2">@</span>
                        <span className="text-gray-600">{selectedConversation.lead.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Website Information */}
              {selectedConversation.metadata && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Website Info</h3>
                  <div className="space-y-2 text-sm">
                    {selectedConversation.metadata.domain && (
                      <div className="flex items-center text-gray-600">
                        <Globe className="w-4 h-4 text-gray-400 mr-2" />
                        {selectedConversation.metadata.domain}
                      </div>
                    )}
                    {selectedConversation.metadata.url && (
                      <div className="flex items-start text-gray-600">
                        <span className="text-gray-400 mr-2 mt-0.5">🔗</span>
                        <span className="text-xs break-all">{selectedConversation.metadata.url}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Conversation Actions */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversation Actions</h3>
                <div className="space-y-2">
                  {!selectedConversation.isEscalated && (
                    <button
                      onClick={() => takeoverConversation(selectedConversation.id)}
                      className="w-full px-4 py-2 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Take Over from AI
                    </button>
                  )}
                  {selectedConversation.lead && (
                    <button
                      onClick={() => router.push(`/contacts/${selectedConversation.lead.id}`)}
                      className="w-full px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center gap-2"
                    >
                      <Info className="w-4 h-4" />
                      View Full Lead Details
                    </button>
                  )}
                </div>
              </div>

              {/* Conversation Status */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Mode</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedConversation.isEscalated
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {selectedConversation.isEscalated ? 'Human Agent' : 'AI Active'}
                    </span>
                  </div>
                  {selectedConversation.isEscalated && selectedConversation.escalatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Escalated At</span>
                      <span className="text-xs text-gray-500">
                        {new Date(selectedConversation.escalatedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Started</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(selectedConversation.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Messages</span>
                    <span className="text-xs text-gray-500">
                      {selectedConversation.chatMessages.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assigned Agent */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Assigned Agent</h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user?.name || 'You'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedConversation && (
            <div className="w-96 bg-white border-l border-gray-200 p-6 flex items-center justify-center">
              <div className="text-center">
                <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Select a conversation to view customer details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
