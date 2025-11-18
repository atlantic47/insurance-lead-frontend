'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WhatsAppSimulator from '@/components/chat/WhatsAppSimulator';
import { MessageCircle, Send, Bot, User, Video, Info, Paperclip, Smile, Search, MoreVertical, Phone, Shield, AlertTriangle, ArrowLeft, UserCheck, X, FileText } from 'lucide-react';
import { chatApi, whatsappApi } from '@/lib/api';
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

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: string;
  body: string;
  headerText?: string;
  footer?: string;
  bodyExamples?: string[];
  headerExamples?: string[];
}

interface ConversationLabel {
  id: string;
  name: string;
  color: string;
  description?: string;
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

  // Template states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<{ [key: string]: string }>({});
  const [isSendingTemplate, setIsSendingTemplate] = useState(false);

  // Label states
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [allLabels, setAllLabels] = useState<ConversationLabel[]>([]);
  const [conversationLabels, setConversationLabels] = useState<ConversationLabel[]>([]);
  const [isLoadingLabels, setIsLoadingLabels] = useState(false);

  // Ref for auto-scrolling to latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get('conversation');

  useEffect(() => {
    fetchConversations();
    // Set up polling for real-time updates (every 2 seconds for faster updates)
    const interval = setInterval(() => fetchConversations(true), 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom when messages change or conversation is selected
  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.chatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Update URL with conversation ID
    router.replace(`/chat?conversation=${conversation.id}`, { scroll: false });
    // Load conversation labels
    fetchConversationLabels(conversation.id);
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

      const conversationsData = (response.data.data as any)?.conversations || (response.data as any).conversations || [];
      
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

  const fetchTemplates = async () => {
    try {
      const response = await whatsappApi.getTemplates({ status: 'APPROVED' });
      const templatesData = response.data?.data?.templates || response.data?.templates || [];
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const openTemplateModal = async () => {
    setShowTemplateModal(true);
    if (templates.length === 0) {
      await fetchTemplates();
    }
  };

  const extractVariablesFromTemplate = (template: WhatsAppTemplate): string[] => {
    const variables: string[] = [];

    // Extract from body
    const bodyMatches = template.body.match(/\{\{(\d+)\}\}/g);
    if (bodyMatches) {
      bodyMatches.forEach(match => {
        const num = match.match(/\d+/)?.[0];
        if (num) variables.push(`body_${num}`);
      });
    }

    // Extract from header if exists
    if (template.headerText) {
      const headerMatches = template.headerText.match(/\{\{(\d+)\}\}/g);
      if (headerMatches) {
        headerMatches.forEach(match => {
          const num = match.match(/\d+/)?.[0];
          if (num) variables.push(`header_${num}`);
        });
      }
    }

    return variables;
  };

  const selectTemplate = (template: WhatsAppTemplate) => {
    setSelectedTemplate(template);

    // Extract variables and initialize state
    const vars = extractVariablesFromTemplate(template);
    const initialVars: { [key: string]: string } = {};
    vars.forEach(v => initialVars[v] = '');
    setTemplateVariables(initialVars);
  };

  const sendTemplate = async () => {
    if (!selectedTemplate || !selectedConversation) return;

    setIsSendingTemplate(true);
    try {
      // Build template params
      const bodyParams: string[] = [];
      const headerParams: string[] = [];

      Object.keys(templateVariables).forEach(key => {
        if (key.startsWith('body_')) {
          const index = parseInt(key.split('_')[1]) - 1;
          bodyParams[index] = templateVariables[key];
        } else if (key.startsWith('header_')) {
          const index = parseInt(key.split('_')[1]) - 1;
          headerParams[index] = templateVariables[key];
        }
      });

      const templateParams: any = {
        languageCode: selectedTemplate.language || 'en',
      };

      if (bodyParams.length > 0) {
        templateParams.body = bodyParams;
      }
      if (headerParams.length > 0) {
        templateParams.header = headerParams;
      }

      await whatsappApi.sendTemplateToConversation(selectedConversation.id, {
        templateName: selectedTemplate.name,
        templateParams: Object.keys(templateParams).length > 1 ? templateParams : undefined,
      });

      // Close modal and refresh conversations
      setShowTemplateModal(false);
      setSelectedTemplate(null);
      setTemplateVariables({});
      await fetchConversations();

      alert('Template sent successfully!');
    } catch (error) {
      console.error('Error sending template:', error);
      alert('Failed to send template. Please try again.');
    } finally {
      setIsSendingTemplate(false);
    }
  };

  const fetchAllLabels = async () => {
    try {
      const response = await whatsappApi.getAllLabels();
      // The service returns the labels directly (no nested data)
      const labelsData = Array.isArray(response.data) ? response.data : (response.data?.data || response.data || []);
      setAllLabels(labelsData);
    } catch (error) {
      console.error('Error fetching labels:', error);
    }
  };

  const fetchConversationLabels = async (conversationId: string) => {
    try {
      setIsLoadingLabels(true);
      const response = await whatsappApi.getConversationLabels(conversationId);
      // The service returns an array of assignments with nested label objects
      const assignments = response.data?.data || response.data || [];
      // Extract just the label objects from the assignments
      const labelsData = assignments.map((assignment: any) => assignment.label || assignment);
      setConversationLabels(labelsData);
    } catch (error) {
      console.error('Error fetching conversation labels:', error);
      setConversationLabels([]);
    } finally {
      setIsLoadingLabels(false);
    }
  };

  const openLabelModal = async () => {
    if (!selectedConversation) return;
    setShowLabelModal(true);
    if (allLabels.length === 0) {
      await fetchAllLabels();
    }
    await fetchConversationLabels(selectedConversation.id);
  };

  const addLabel = async (labelId: string) => {
    if (!selectedConversation) return;

    try {
      const response = await whatsappApi.addLabelToConversation(selectedConversation.id, labelId);
      console.log('Label added:', response);
      await fetchConversationLabels(selectedConversation.id);
    } catch (error: any) {
      console.error('Error adding label:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add label. Please try again.';
      alert(errorMessage);
    }
  };

  const removeLabel = async (labelId: string) => {
    if (!selectedConversation) return;

    try {
      await whatsappApi.removeLabelFromConversation(selectedConversation.id, labelId);
      await fetchConversationLabels(selectedConversation.id);
    } catch (error: any) {
      console.error('Error removing label:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove label. Please try again.';
      alert(errorMessage);
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
        
        <div className="flex gap-0 bg-white rounded-2xl shadow-xl border border-gray-100 h-[calc(100vh-200px)] overflow-hidden">
          {/* Main Chat Interface */}
          <div className="flex-1">
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
                      className="w-full pl-4 pr-12 py-3.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-3 focus:ring-green-500/20 focus:border-green-500 transition-all duration-200 text-gray-900 placeholder:text-gray-600 shadow-sm"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
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
                  {/* Auto-scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="px-6 py-4 border-t border-gray-200">
                  {selectedConversation.isEscalated ? (
                    <div className="flex items-center space-x-3">
                      <button className="p-2 hover:bg-gray-100 rounded-lg">
                        <Paperclip className="h-5 w-5 text-gray-600" />
                      </button>
                      <button
                        onClick={openTemplateModal}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Send WhatsApp Template"
                      >
                        <FileText className="h-5 w-5 text-gray-600" />
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
          
          {/* Customer Details Panel */}
          {selectedConversation && (
            <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
              {/* Customer Profile */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-medium text-green-700">
                    {selectedConversation.lead.firstName.charAt(0)}{selectedConversation.lead.lastName.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedConversation.lead.firstName} {selectedConversation.lead.lastName}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{selectedConversation.lead.status}</p>
              </div>

              {/* Contact Information */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">{selectedConversation.lead.phone}</span>
                  </div>
                  {selectedConversation.lead.email && (
                    <div className="flex items-center text-sm">
                      <span className="text-gray-400 mr-2">@</span>
                      <span className="text-gray-600">{selectedConversation.lead.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Conversation Actions */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversation Actions</h3>
                <div className="space-y-2">
                  {!selectedConversation.isEscalated && (
                    <button
                      onClick={() => escalateConversation(selectedConversation.id)}
                      className="w-full px-4 py-2 text-sm bg-orange-100 text-orange-800 rounded-lg hover:bg-orange-200 transition-colors flex items-center justify-center"
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Take Over from AI
                    </button>
                  )}
                  <button
                    onClick={() => showLeadDetails(selectedConversation)}
                    className="w-full px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    View Full Lead Details
                  </button>
                </div>
              </div>

              {/* Assigned Agent */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Assigned Agent</h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'Not Assigned'}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
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
                        : 'bg-green-100 text-green-800'
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
                </div>
              </div>

              {/* Priority */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Priority</h3>
                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Medium</option>
                  <option>Low</option>
                  <option>High</option>
                  <option>Urgent</option>
                </select>
              </div>

              {/* Conversation Labels */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Conversation Labels</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {selectedConversation.lead.status.toLowerCase()}
                  </span>
                  {conversationLabels.map((label) => (
                    <span
                      key={label.id}
                      className="px-2 py-1 text-xs rounded-full flex items-center gap-1"
                      style={{
                        backgroundColor: `${label.color}20`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                      <button
                        onClick={() => removeLabel(label.id)}
                        className="hover:opacity-70"
                        title="Remove label"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={openLabelModal}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200"
                  >
                    + Add Label
                  </button>
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
        
        {/* Template Selection Modal */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="w-6 h-6 text-green-600 mr-2" />
                  Send WhatsApp Template
                </h2>
                <button
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedTemplate(null);
                    setTemplateVariables({});
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {!selectedTemplate ? (
                  // Template List
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Select a template to send to the customer
                    </p>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {templates.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          No approved templates found
                        </p>
                      ) : (
                        templates.map((template) => (
                          <div
                            key={template.id}
                            onClick={() => selectTemplate(template)}
                            className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:bg-green-50 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-medium text-gray-900">{template.name}</h3>
                              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                {template.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{template.body}</p>
                            {template.footer && (
                              <p className="text-xs text-gray-500 italic">{template.footer}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  // Template Variables Form
                  <div>
                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setTemplateVariables({});
                      }}
                      className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Back to templates
                    </button>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h3 className="font-medium text-gray-900 mb-2">{selectedTemplate.name}</h3>
                      {selectedTemplate.headerText && (
                        <p className="text-sm text-gray-700 mb-2 font-medium">{selectedTemplate.headerText}</p>
                      )}
                      <p className="text-sm text-gray-700 mb-2">{selectedTemplate.body}</p>
                      {selectedTemplate.footer && (
                        <p className="text-xs text-gray-500 italic">{selectedTemplate.footer}</p>
                      )}
                    </div>

                    {Object.keys(templateVariables).length > 0 ? (
                      <div className="space-y-3 mb-4">
                        <p className="text-sm font-medium text-gray-700">Fill in the template variables:</p>
                        {Object.keys(templateVariables).map((varKey) => (
                          <div key={varKey}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {varKey.replace('_', ' ').toUpperCase()}
                            </label>
                            <input
                              type="text"
                              value={templateVariables[varKey]}
                              onChange={(e) =>
                                setTemplateVariables({ ...templateVariables, [varKey]: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                              placeholder={`Enter ${varKey.replace('_', ' ')}`}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mb-4">
                        This template has no variables. Click send to deliver it.
                      </p>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowTemplateModal(false);
                          setSelectedTemplate(null);
                          setTemplateVariables({});
                        }}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={sendTemplate}
                        disabled={isSendingTemplate || Object.values(templateVariables).some(v => !v.trim())}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                      >
                        {isSendingTemplate ? 'Sending...' : 'Send Template'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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

        {/* Label Selection Modal */}
        {showLabelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Manage Labels</h2>
                <button
                  onClick={() => setShowLabelModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {isLoadingLabels ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-4">
                      Select labels to add to this conversation
                    </p>

                    {allLabels.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        No labels available. Create labels first.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {allLabels.map((label) => {
                          const isAssigned = conversationLabels.some(cl => cl.id === label.id);
                          return (
                            <div
                              key={label.id}
                              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: label.color }}
                                />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{label.name}</p>
                                  {label.description && (
                                    <p className="text-xs text-gray-500">{label.description}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => isAssigned ? removeLabel(label.id) : addLabel(label.id)}
                                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                                  isAssigned
                                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                              >
                                {isAssigned ? 'Remove' : 'Add'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowLabelModal(false)}
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