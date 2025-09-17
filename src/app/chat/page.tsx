'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WhatsAppSimulator from '@/components/chat/WhatsAppSimulator';
import { MessageCircle, Send, Bot, User, Clock, CheckCheck, Search, MoreVertical, Phone, Shield, AlertTriangle } from 'lucide-react';
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
  
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');

  useEffect(() => {
    fetchConversations();
    // Set up polling for real-time updates
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Update URL with conversation ID
    router.replace(`/chat?conversation=${conversation.id}`, { scroll: false });
  };

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await chatApi.getConversations({ 
        limit: 50,
        page: 1 
      });
      
      const conversationsData = response.data.data?.conversations || response.data.conversations || [];
      setConversations(conversationsData);
      
      // If URL has conversation ID, select that conversation
      if (conversationId && conversationsData.length > 0) {
        const targetConversation = conversationsData.find((conv: Conversation) => conv.id === conversationId);
        if (targetConversation) {
          setSelectedConversation(targetConversation);
          return;
        }
      }
      
      // If no conversation is selected and we have conversations, select the first one
      if (!selectedConversation && conversationsData.length > 0) {
        const firstConversation = conversationsData[0];
        setSelectedConversation(firstConversation);
        // Update URL to reflect the selected conversation
        router.replace(`/chat?conversation=${firstConversation.id}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Fallback to empty array on error
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || isSending) return;

    setIsSending(true);
    try {
      // Send message via API
      await chatApi.sendMessage({
        leadId: selectedConversation.lead.id,
        message: newMessage,
        conversationId: selectedConversation.id,
      });

      // Clear input
      setNewMessage('');
      
      // Refresh conversations to get the updated messages
      await fetchConversations();
      
      // Refresh the selected conversation
      if (selectedConversation.lead.id) {
        const updatedConversation = await chatApi.getConversation(selectedConversation.lead.id);
        setSelectedConversation(updatedConversation.data);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error notification to user
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
      
      // Update selected conversation if it's the one being escalated
      if (selectedConversation?.id === conversationId) {
        const updatedConversation = await chatApi.getConversation(selectedConversation.lead.id);
        setSelectedConversation(updatedConversation.data);
      }
      
      // Show success message
      alert('Conversation escalated successfully. You can now send messages to the customer.');
    } catch (error) {
      console.error('Error escalating conversation:', error);
      alert('Failed to escalate conversation. Please try again.');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'CUSTOMER':
        return <User className="w-4 h-4" />;
      case 'AI_ASSISTANT':
        return <Bot className="w-4 h-4" />;
      case 'HUMAN_AGENT':
        return <User className="w-4 h-4 text-blue-600" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

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
            <h1 className="text-2xl font-semibold text-gray-900">WhatsApp Conversations</h1>
            <p className="text-gray-600 mt-1">Manage customer conversations and AI escalations</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-80 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="jira-page-content">

        <div className="jira-content-card h-[600px] flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-neutral-200 flex flex-col">
            <div className="card-header flex items-center justify-between py-4">
              <h3 className="font-semibold text-neutral-900">Active Conversations</h3>
              <span className="badge badge-primary">{conversations.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-neutral-100">
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
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-neutral-50 ${
                      selectedConversation?.id === conversation.id 
                        ? 'bg-primary-50 border-r-2 border-primary-500' 
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {conversation.lead.firstName.charAt(0)}{conversation.lead.lastName.charAt(0)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success-500 border-2 border-white rounded-full"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-neutral-900 truncate">
                            {conversation.lead.firstName} {conversation.lead.lastName}
                          </h4>
                          {conversation.isEscalated && (
                            <span className="badge badge-warning ml-2">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Escalated
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-neutral-600 mb-1 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {conversation.lead.phone}
                        </p>
                        
                        {conversation.chatMessages.length > 0 && (
                          <p className="text-sm text-neutral-500 truncate">
                            {conversation.chatMessages[conversation.chatMessages.length - 1].content}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-neutral-400">
                            {formatTime(conversation.chatMessages[conversation.chatMessages.length - 1]?.createdAt || new Date().toISOString())}
                          </span>
                          <div className="flex items-center space-x-1">
                            {!conversation.isEscalated && (
                              <span className="inline-flex items-center text-xs text-success-600">
                                <Bot className="w-3 h-3 mr-1" />
                                AI Active
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-medium">
                          {selectedConversation.lead.firstName.charAt(0)}{selectedConversation.lead.lastName.charAt(0)}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-success-500 border-2 border-white rounded-full"></div>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-neutral-900">
                          {selectedConversation.lead.firstName} {selectedConversation.lead.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600">
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {selectedConversation.lead.phone}
                          </span>
                          {selectedConversation.lead.email && (
                            <span>{selectedConversation.lead.email}</span>
                          )}
                          <span className="badge badge-neutral">
                            {selectedConversation.lead.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {selectedConversation.isEscalated ? (
                        <div className="flex items-center space-x-2">
                          <span className="badge badge-warning">
                            <Shield className="w-3 h-3 mr-1" />
                            Human Agent Active
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={() => escalateConversation(selectedConversation.id)}
                          className="btn btn-secondary btn-sm"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Take Over from AI
                        </button>
                      )}
                      
                      <button className="btn btn-ghost btn-sm">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
                  {selectedConversation.chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 fade-in ${
                        message.sender === 'CUSTOMER' ? '' : 'justify-end'
                      }`}
                    >
                      {message.sender === 'CUSTOMER' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-neutral-600" />
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                          message.sender === 'CUSTOMER'
                            ? 'bg-white border border-neutral-200 text-neutral-900'
                            : message.sender === 'AI_ASSISTANT'
                            ? 'bg-gradient-to-r from-success-50 to-success-100 border border-success-200 text-success-900'
                            : 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                        }`}
                      >
                        {message.sender === 'AI_ASSISTANT' && (
                          <div className="flex items-center space-x-2 mb-2 text-xs text-success-700">
                            <Bot className="w-3 h-3" />
                            <span>AI Assistant</span>
                          </div>
                        )}
                        
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs ${
                            message.sender === 'HUMAN_AGENT' ? 'text-white/75' : 'text-neutral-500'
                          }`}>
                            {formatTime(message.createdAt)}
                          </span>
                          {message.sender !== 'CUSTOMER' && (
                            <CheckCheck className={`w-3 h-3 ${
                              message.sender === 'HUMAN_AGENT' ? 'text-white/75' : 'text-neutral-500'
                            }`} />
                          )}
                        </div>
                      </div>
                      
                      {message.sender !== 'CUSTOMER' && (
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            message.sender === 'AI_ASSISTANT' 
                              ? 'bg-success-100 text-success-600' 
                              : 'bg-primary-500 text-white'
                          }`}>
                            {getSenderIcon(message.sender)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                {selectedConversation.isEscalated && (
                  <div className="card-footer">
                    <div className="flex items-center space-x-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Type your message..."
                          className="w-full pr-12 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className="btn btn-primary"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Select a conversation</h3>
                  <p className="text-neutral-600">Choose a conversation from the list to start managing the chat.</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* WhatsApp Simulator for Testing */}
        <div className="mt-6">
          <WhatsAppSimulator onMessageSent={fetchConversations} />
        </div>
      </div>
    </DashboardLayout>
  );
}