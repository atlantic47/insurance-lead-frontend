'use client';

import { useState, useRef, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiApi, leadsApi } from '@/lib/api';
import { AIConversation, Lead } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { 
  Bot, 
  Send, 
  Loader2, 
  MessageCircle,
  TrendingUp,
  Search,
  Sparkles,
  Brain,
  BarChart3,
  Upload,
  Globe,
  Settings,
  FileText,
  Link,
  Trash2,
  Check,
  X,
  Download
} from 'lucide-react';

export default function AIPage() {
  const [message, setMessage] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'history' | 'training' | 'assets' | 'widget'>('chat');

  // Training state
  const [trainingMode, setTrainingMode] = useState<'url' | 'document' | 'instructions' | null>(null);
  const [trainingUrl, setTrainingUrl] = useState('');
  const [trainingInstructions, setTrainingInstructions] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [testHistory, setTestHistory] = useState<Array<{message: string, response: string, timestamp: Date}>>([]);

  // Edit asset state
  const [editingAsset, setEditingAsset] = useState<any | null>(null);
  const [viewingAsset, setViewingAsset] = useState<any | null>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Widget customization state
  const [widgetConfig, setWidgetConfig] = useState({
    title: 'Chat Support',
    subtitle: 'We usually reply within minutes',
    buttonText: 'Chat with us',
    greeting: 'Hi! How can I help you today?',
    primaryColor: '#3B82F6',
    position: 'bottom-right',
    buttonStyle: 'pill',
    showQuickReplies: true,
    quickReplies: ['Get a quote', 'File a claim', 'Talk to agent']
  });

  const queryClient = useQueryClient();

  // Fetch widget config with tenant-specific token
  const { data: widgetConfigFromServer, isLoading: isLoadingWidgetToken } = useQuery({
    queryKey: ['widget-config'],
    queryFn: () => aiApi.getWidgetConfig().then(res => res.data),
  });

  const { data: conversationsResponse, isLoading: conversationsLoading } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiApi.getConversations({ limit: 50 }).then(res => res.data),
  });

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-for-ai'],
    queryFn: () => leadsApi.getAll({ limit: 20 }).then(res => res.data),
  });

  const chatMutation = useMutation({
    mutationFn: ({ message, leadId }: { message: string; leadId?: string }) =>
      aiApi.chat(message, leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      setMessage('');
    },
  });

  const sentimentMutation = useMutation({
    mutationFn: aiApi.analyzeSentiment,
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    chatMutation.mutate({
      message: message.trim(),
      leadId: selectedLead?.id,
    });
  };

  const handleAnalyzeSentiment = (text: string) => {
    sentimentMutation.mutate(text);
  };

  const conversations = conversationsResponse?.data || [];
  const leads = leadsResponse?.data || [];

  const getAIStats = () => {
    const total = conversations.length;
    const chatbot = conversations.filter(c => c.type === 'CHATBOT').length;
    const sentiment = conversations.filter(c => c.type === 'SENTIMENT_ANALYSIS').length;
    const autoResponse = conversations.filter(c => c.type === 'AUTO_RESPONSE').length;
    
    const averageConfidence = conversations.length > 0 
      ? conversations.reduce((sum, c) => sum + (c.confidence || 0), 0) / conversations.length
      : 0;

    return { total, chatbot, sentiment, autoResponse, averageConfidence };
  };

  const aiStats = getAIStats();

  // Training mutations
  const uploadFilesMutation = useMutation({
    mutationFn: (data: { files: FileList; instructions: string }) =>
      aiApi.uploadTrainingFiles(data.files, data.instructions),
    onSuccess: () => {
      setSelectedFiles(null);
      setTrainingInstructions('');
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
    },
  });

  const saveUrlMutation = useMutation({
    mutationFn: (data: { url: string; instructions: string }) => aiApi.saveUrl(data.url, data.instructions),
    onSuccess: () => {
      setSavedUrls(prev => [...prev, trainingUrl]);
      setTrainingUrl('');
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
    },
  });

  const submitTrainingMutation = useMutation({
    mutationFn: (data: { instructions: string; urls: string[] }) =>
      aiApi.submitTraining(data.instructions, data.urls),
    onSuccess: () => {
      setTrainingInstructions('');
      setSavedUrls([]);
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
    },
  });

  const testAiMutation = useMutation({
    mutationFn: (message: string) => aiApi.testAi(message),
    onSuccess: (response) => {
      console.log('✅ AI test API call successful');
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      // The API response is wrapped in response.data
      const data = response.data;
      const aiResponse = data?.response || data?.message || 'No response received';
      
      console.log('Extracted AI response:', aiResponse);
      
      setTestHistory(prev => [...prev, {
        message: testMessage,
        response: aiResponse,
        timestamp: new Date()
      }]);
      setTestMessage('');
    },
    onError: (error: any) => {
      console.error('❌ AI test API call failed:', error);
      console.error('Error details:', error.response?.data || error.message);
      setTestHistory(prev => [...prev, {
        message: testMessage,
        response: `Error: ${error.response?.data?.message || error.message || 'Could not get AI response. Please check if the backend is running.'}`,
        timestamp: new Date()
      }]);
      setTestMessage('');
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [testHistory]);

  const deleteAssetMutation = useMutation({
    mutationFn: (id: string) => aiApi.deleteTrainingData(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
    },
  });

  const updateAssetMutation = useMutation({
    mutationFn: ({ id, instructions }: { id: string; instructions: string }) =>
      aiApi.updateTrainingData(id, { instructions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-data'] });
      setEditingAsset(null);
    },
  });

  const { data: trainingDataResponse } = useQuery({
    queryKey: ['training-data'],
    queryFn: () => aiApi.getTrainingData().then(res => res.data),
  });

  const handleFileUpload = () => {
    if (!selectedFiles || !trainingInstructions.trim()) return;
    
    uploadFilesMutation.mutate({
      files: selectedFiles,
      instructions: trainingInstructions.trim(),
    });
  };

  const handleSaveUrl = () => {
    if (!trainingUrl.trim()) return;
    
    if (!trainingInstructions.trim()) {
      alert('Please enter training instructions before saving URLs');
      return;
    }
    
    try {
      new URL(trainingUrl.trim()); // Validate URL format
      saveUrlMutation.mutate({
        url: trainingUrl.trim(),
        instructions: trainingInstructions.trim()
      });
    } catch (error) {
      alert('Please enter a valid URL');
    }
  };

  const handleSubmitTraining = () => {
    if (!trainingInstructions.trim()) return;
    
    submitTrainingMutation.mutate({
      instructions: trainingInstructions.trim(),
      urls: savedUrls,
    });
  };

  const handleTestAi = () => {
    if (!testMessage.trim()) return;
    testAiMutation.mutate(testMessage.trim());
  };

  const removeUrl = (urlToRemove: string) => {
    setSavedUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  const tabs = [
    { key: 'chat', label: 'AI Chat', icon: MessageCircle },
    { key: 'insights', label: 'AI Insights', icon: Brain },
    { key: 'history', label: 'History', icon: BarChart3 },
    { key: 'training', label: 'AI Training', icon: Settings },
    { key: 'assets', label: 'Training Assets', icon: FileText },
    { key: 'widget', label: 'Widget Setup', icon: Globe },
  ];

  return (
    <DashboardLayout>
      <div className="jira-page-content">
        <div className="jira-page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">AI Assistant</h1>
              <p className="text-gray-600 mt-1">Leverage AI for lead insights and automation</p>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="text-sm text-gray-600">AI Powered</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Bot className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Interactions</p>
                <p className="text-2xl font-bold text-gray-900">{aiStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="jira-stat-card">
            <div className="flex items-center">
              <MessageCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Chat Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{aiStats.chatbot}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Sentiment Analysis</p>
                <p className="text-2xl font-bold text-gray-900">{aiStats.sentiment}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(aiStats.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="jira-content-card">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'chat' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <select
                    value={selectedLead?.id || ''}
                    onChange={(e) => {
                      const lead = leads.find(l => l.id === e.target.value);
                      setSelectedLead(lead || null);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">General AI Chat</option>
                    {leads.map((lead) => (
                      <option key={lead.id} value={lead.id}>
                        {lead.firstName} {lead.lastName} - {lead.email}
                      </option>
                    ))}
                  </select>
                  {selectedLead && (
                    <span className="text-sm text-gray-500">
                      Context: Lead analysis for {selectedLead.firstName} {selectedLead.lastName}
                    </span>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-6 min-h-[400px] max-h-[400px] overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                        <p className="text-gray-600">Ask me anything about your leads, sales insights, or get recommendations.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {conversations.slice(-10).map((conversation: AIConversation) => (
                        <div key={conversation.id} className="space-y-2">
                          <div className="flex justify-end">
                            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                              {conversation.input}
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <div className="bg-white border px-4 py-2 rounded-lg max-w-xs">
                              <div className="flex items-start space-x-2">
                                <Bot className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-sm">{conversation.output}</p>
                                  {conversation.confidence && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Confidence: {(conversation.confidence * 100).toFixed(1)}%
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      {chatMutation.isPending && (
                        <div className="flex justify-start">
                          <div className="bg-white border px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Bot className="w-4 h-4 text-blue-600" />
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm text-gray-600">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask AI about your leads, get insights, or request recommendations..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={chatMutation.isPending}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || chatMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {chatMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'insights' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">AI-Powered Insights</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h4 className="font-medium text-blue-900 mb-3">Lead Scoring Insights</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li>• High-value leads typically respond within 2 hours</li>
                      <li>• Email engagement rates are 40% higher on Tuesdays</li>
                      <li>• Leads from social media convert 25% better</li>
                      <li>• Follow-up calls increase conversion by 60%</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="font-medium text-green-900 mb-3">Conversion Predictions</h4>
                    <ul className="space-y-2 text-sm text-green-800">
                      <li>• 73% likelihood of Q4 target achievement</li>
                      <li>• Premium products show 15% growth trend</li>
                      <li>• Customer retention rate improving by 8%</li>
                      <li>• Best conversion time: 2-4 PM weekdays</li>
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-6">
                    <h4 className="font-medium text-purple-900 mb-3">Sentiment Analysis</h4>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li>• Overall customer sentiment: 85% positive</li>
                      <li>• Common concerns: pricing and coverage</li>
                      <li>• Satisfaction highest with life insurance</li>
                      <li>• Response time impacts sentiment by 30%</li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-6">
                    <h4 className="font-medium text-orange-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2 text-sm text-orange-800">
                      <li>• Focus on health insurance expansion</li>
                      <li>• Implement chatbot for initial inquiries</li>
                      <li>• Schedule follow-ups within 24 hours</li>
                      <li>• Create targeted campaigns for young families</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">AI Interaction History</h3>
                
                {conversationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No AI interactions yet. Start a conversation to see history here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {conversations.map((conversation: AIConversation) => (
                      <div key={conversation.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              conversation.type === 'CHATBOT' ? 'bg-blue-100 text-blue-800' :
                              conversation.type === 'SENTIMENT_ANALYSIS' ? 'bg-purple-100 text-purple-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {conversation.type.replace('_', ' ')}
                            </span>
                            {conversation.confidence && (
                              <span className="text-xs text-gray-500">
                                {(conversation.confidence * 100).toFixed(1)}% confidence
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDateTime(conversation.createdAt)}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium text-gray-700">Input:</p>
                            <p className="text-sm text-gray-600">{conversation.input}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700">Output:</p>
                            <p className="text-sm text-gray-600">{conversation.output}</p>
                          </div>
                          {conversation.lead && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Related Lead:</p>
                              <p className="text-sm text-blue-600">
                                {conversation.lead.firstName} {conversation.lead.lastName}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'training' && (
              <div className="space-y-6">
                {/* Clean Header */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">AI Knowledge Base</h3>
                      <p className="text-sm text-gray-500 mt-1">Train your AI with custom knowledge sources</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Sources</div>
                        <div className="text-2xl font-bold text-gray-900">{trainingDataResponse?.data?.length || 0}</div>
                      </div>
                      <div className="h-12 w-px bg-gray-200"></div>
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Processed</div>
                        <div className="text-2xl font-bold text-green-600">
                          {trainingDataResponse?.data?.filter((item: any) => item.status === 'processed').length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection Cards - Clean Minimal Design */}
                {!trainingMode && (
                  <div className="bg-white rounded-lg border border-gray-200 p-8">
                    <h4 className="text-base font-medium text-gray-900 mb-6">Add Knowledge Source</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* URL Card */}
                      <button
                        onClick={() => setTrainingMode('url')}
                        className="group text-left p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                            <Globe className="w-6 h-6 text-blue-600 group-hover:text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900 mb-1">Website URL</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Extract content from web pages
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Document Card */}
                      <button
                        onClick={() => setTrainingMode('document')}
                        className="group text-left p-6 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                            <Upload className="w-6 h-6 text-purple-600 group-hover:text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900 mb-1">Upload Document</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              PDF, Word, Excel, or text files
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Instructions Card */}
                      <button
                        onClick={() => setTrainingMode('instructions')}
                        className="group text-left p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition-colors">
                            <Brain className="w-6 h-6 text-green-600 group-hover:text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-semibold text-gray-900 mb-1">Text Instructions</h5>
                            <p className="text-xs text-gray-500 leading-relaxed">
                              Type or paste content directly
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* URL Mode */}
                {trainingMode === 'url' && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    {/* Header */}
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Globe className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Website URL</h4>
                      </div>
                      <button
                        onClick={() => setTrainingMode(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                      {/* URL Input */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">URL</label>
                        <div className="relative">
                          <input
                            type="url"
                            value={trainingUrl}
                            onChange={(e) => setTrainingUrl(e.target.value)}
                            placeholder="https://example.com/about-us"
                            className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Link className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>

                      {/* Instructions for URL */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          value={trainingInstructions}
                          onChange={(e) => setTrainingInstructions(e.target.value)}
                          rows={5}
                          placeholder="Example: Use this page to answer questions about our company history and mission..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setTrainingMode(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveUrl}
                          disabled={!trainingUrl.trim() || !trainingInstructions.trim() || saveUrlMutation.isPending}
                          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {saveUrlMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              Add to Knowledge Base
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Mode */}
                {trainingMode === 'document' && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    {/* Header */}
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Upload className="w-4 h-4 text-purple-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Upload Document</h4>
                      </div>
                      <button
                        onClick={() => setTrainingMode(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                      {/* File Upload */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Files</label>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.md,.xls,.xlsx,.csv"
                          onChange={(e) => setSelectedFiles(e.target.files)}
                          className="hidden"
                          id="file-upload-new"
                        />
                        <label
                          htmlFor="file-upload-new"
                          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Click to browse files</p>
                          <p className="text-xs text-gray-400 mt-1">Supports PDF, Word, Excel, CSV, Text</p>
                        </label>

                        {selectedFiles && selectedFiles.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-medium text-gray-700">
                              {selectedFiles.length} file(s) selected
                            </p>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto">
                              {Array.from(selectedFiles).map((file, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                                  <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                  <span className="text-xs text-gray-700 flex-1 truncate">{file.name}</span>
                                  <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Instructions for Documents */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          value={trainingInstructions}
                          onChange={(e) => setTrainingInstructions(e.target.value)}
                          rows={5}
                          placeholder="Example: These documents contain our product pricing and policy details. Use them to answer customer questions..."
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setTrainingMode(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleFileUpload}
                          disabled={!selectedFiles || selectedFiles.length === 0 || !trainingInstructions.trim() || uploadFilesMutation.isPending}
                          className="px-6 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {uploadFilesMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Add to Knowledge Base
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Instructions Mode */}
                {trainingMode === 'instructions' && (
                  <div className="bg-white rounded-lg border border-gray-200">
                    {/* Header */}
                    <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <Brain className="w-4 h-4 text-green-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Text Instructions</h4>
                      </div>
                      <button
                        onClick={() => setTrainingMode(null)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-5">
                      {/* Instructions Textarea */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                          Training Content
                        </label>
                        <textarea
                          value={trainingInstructions}
                          onChange={(e) => setTrainingInstructions(e.target.value)}
                          rows={12}
                          placeholder="Type or paste your training content here...

Example:
- Company information and values
- Product descriptions and pricing
- Frequently Asked Questions
- Policies and procedures
- Brand voice guidelines"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm font-mono"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">
                            {trainingInstructions.length} characters
                          </p>
                          <p className="text-xs text-gray-400">
                            More detail = Better responses
                          </p>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setTrainingMode(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSubmitTraining}
                          disabled={!trainingInstructions.trim() || submitTrainingMutation.isPending}
                          className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {submitTrainingMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Add to Knowledge Base
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Test Chat - Clean Section */}
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="px-6 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <h4 className="text-sm font-semibold text-gray-900">Test AI Responses</h4>
                      </div>
                      {testHistory.length > 0 && (
                        <div className="px-2.5 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                          {testHistory.length} messages
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Messages Area */}
                  <div ref={chatMessagesRef} className="h-80 overflow-y-auto p-6 bg-gray-50">
                    {testHistory.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                          <Bot className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Test your AI assistant</p>
                        <p className="text-xs text-gray-400 mt-1">Ask a question to see how it responds</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {testHistory.map((chat, index) => (
                          <div key={index} className="space-y-2">
                            {/* Your message */}
                            <div className="flex justify-end">
                              <div className="bg-blue-600 text-white px-4 py-2.5 rounded-lg max-w-md text-sm">
                                {chat.message}
                              </div>
                            </div>
                            {/* AI response */}
                            <div className="flex justify-start">
                              <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg max-w-md">
                                <div className="flex items-start gap-2">
                                  <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Bot className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <div className="text-sm text-gray-700 leading-relaxed">{chat.response}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Loading indicator */}
                    {testAiMutation.isPending && (
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-end">
                          <div className="bg-blue-600 text-white px-4 py-2.5 rounded-lg max-w-md text-sm">
                            {testMessage}
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white border border-gray-200 px-4 py-2.5 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                              <span className="text-sm text-gray-600">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-6 border-t border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTestAi()}
                        placeholder="Ask a question..."
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={testAiMutation.isPending}
                      />
                      <button
                        onClick={handleTestAi}
                        disabled={!testMessage.trim() || testAiMutation.isPending}
                        className="px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {testAiMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        Press Enter to send
                      </p>
                      {testHistory.length > 0 && (
                        <button
                          onClick={() => setTestHistory([])}
                          className="text-sm text-red-600 hover:text-red-800 underline"
                        >
                          Clear chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Knowledge Base Overview */}
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Knowledge Base</h4>
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {trainingDataResponse?.data?.length > 0 ? (
                        trainingDataResponse.data.map((item: any, index: number) => (
                          <li key={index} className="px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                {item.type === 'file' ? (
                                  <FileText className="w-5 h-5 text-blue-500 mr-3" />
                                ) : (
                                  <Globe className="w-5 h-5 text-green-500 mr-3" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {item.name || item.url}
                                  </p>
                                  <p className="text-sm text-gray-500">{item.instructions}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  item.status === 'processed' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.status === 'processed' ? (
                                    <>
                                      <Check className="w-3 h-3 mr-1" />
                                      Processed
                                    </>
                                  ) : (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      Processing
                                    </>
                                  )}
                                </span>
                                <button className="text-red-600 hover:text-red-800">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </li>
                        ))
                      ) : (
                        <li className="px-6 py-4 text-center text-gray-500">
                          No training data yet. Upload files or scan URLs to start building the knowledge base.
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Training Assets</h3>
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-600">Manage Knowledge Base</span>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-blue-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Assets</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {trainingDataResponse?.data?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Check className="w-8 h-8 text-green-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-green-600">Processed</p>
                        <p className="text-2xl font-bold text-green-900">
                          {trainingDataResponse?.data?.filter((item: any) => item.status === 'processed').length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Loader2 className="w-8 h-8 text-yellow-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-yellow-600">Processing</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {trainingDataResponse?.data?.filter((item: any) => item.status === 'processing').length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <X className="w-8 h-8 text-red-600 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-red-600">Errors</p>
                        <p className="text-2xl font-bold text-red-900">
                          {trainingDataResponse?.data?.filter((item: any) => item.status === 'error').length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assets List */}
                <div className="bg-white shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-md font-medium text-gray-900">All Training Assets</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Files, URLs, and instructions used to train your AI
                    </p>
                  </div>

                  {/* Scrollable container for assets */}
                  <div className="overflow-y-auto max-h-[600px]">
                    {!trainingDataResponse?.data || trainingDataResponse.data.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Training Assets</h3>
                        <p className="text-gray-600 mb-4">You haven't uploaded any files or training data yet.</p>
                        <button
                          onClick={() => setActiveTab('training')}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Start Training AI
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {trainingDataResponse.data.map((item: any, index: number) => (
                          <div key={index} className="px-6 py-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start space-x-4 flex-1 min-w-0">
                                <div className="flex-shrink-0">
                                  {item.type === 'file' ? (
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <FileText className="w-5 h-5 text-blue-600" />
                                    </div>
                                  ) : item.type === 'url' ? (
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                      <Globe className="w-5 h-5 text-green-600" />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                      <Brain className="w-5 h-5 text-purple-600" />
                                    </div>
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.name}
                                    </p>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      item.status === 'processed'
                                        ? 'bg-green-100 text-green-800'
                                        : item.status === 'processing'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {item.status === 'processed' ? (
                                        <>
                                          <Check className="w-3 h-3 mr-1" />
                                          Processed
                                        </>
                                      ) : item.status === 'processing' ? (
                                        <>
                                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                          Processing
                                        </>
                                      ) : (
                                        <>
                                          <X className="w-3 h-3 mr-1" />
                                          Error
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1 break-words">
                                    {item.instructions}
                                  </p>
                                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                                    <span>Type: {item.type}</span>
                                    <span>•</span>
                                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                                    {item.metadata?.urlCount && (
                                      <>
                                        <span>•</span>
                                        <span>{item.metadata.urlCount} URLs</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => setViewingAsset(item)}
                                  className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => setEditingAsset(item)}
                                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this training asset?')) {
                                      deleteAssetMutation.mutate(item.id);
                                    }
                                  }}
                                  disabled={deleteAssetMutation.isPending}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                >
                                  {deleteAssetMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* View Asset Modal */}
                {viewingAsset && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                      {/* Modal Header */}
                      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {viewingAsset.type === 'file' ? (
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                          ) : viewingAsset.type === 'url' ? (
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Globe className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Brain className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{viewingAsset.name}</h3>
                            <p className="text-xs text-gray-500">Type: {viewingAsset.type}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setViewingAsset(null)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            viewingAsset.status === 'processed'
                              ? 'bg-green-100 text-green-800'
                              : viewingAsset.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {viewingAsset.status === 'processed' ? (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Processed
                              </>
                            ) : viewingAsset.status === 'processing' ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                Processing
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Error
                              </>
                            )}
                          </span>
                        </div>

                        {viewingAsset.url && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Source URL</label>
                            <a
                              href={viewingAsset.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {viewingAsset.url}
                            </a>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingAsset.instructions}</p>
                          </div>
                        </div>

                        {viewingAsset.content && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Extracted Content</label>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-96 overflow-y-auto">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingAsset.content}</p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                            <p className="text-sm text-gray-900">
                              {new Date(viewingAsset.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Updated</label>
                            <p className="text-sm text-gray-900">
                              {new Date(viewingAsset.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {viewingAsset.metadata && Object.keys(viewingAsset.metadata).length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <pre className="text-xs text-gray-700 overflow-x-auto">
                                {JSON.stringify(viewingAsset.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Modal Footer */}
                      <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                        <button
                          onClick={() => setViewingAsset(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          onClick={() => {
                            setEditingAsset(viewingAsset);
                            setViewingAsset(null);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Instructions
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Asset Modal */}
                {editingAsset && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                      {/* Modal Header */}
                      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {editingAsset.type === 'file' ? (
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                          ) : editingAsset.type === 'url' ? (
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <Globe className="w-5 h-5 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <Brain className="w-5 h-5 text-purple-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Edit Training Instructions</h3>
                            <p className="text-xs text-gray-500">{editingAsset.name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingAsset(null)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Modal Content */}
                      <div className="flex-1 overflow-y-auto p-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Training Instructions
                          </label>
                          <textarea
                            value={editingAsset.instructions}
                            onChange={(e) =>
                              setEditingAsset({ ...editingAsset, instructions: e.target.value })
                            }
                            rows={12}
                            placeholder="Enter instructions for how the AI should use this knowledge..."
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                          />
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              {editingAsset.instructions?.length || 0} characters
                            </p>
                            <p className="text-xs text-gray-400">
                              More detail = Better responses
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Modal Footer */}
                      <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                        <button
                          onClick={() => setEditingAsset(null)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            if (editingAsset.instructions?.trim()) {
                              updateAssetMutation.mutate({
                                id: editingAsset.id,
                                instructions: editingAsset.instructions.trim(),
                              });
                            }
                          }}
                          disabled={
                            !editingAsset.instructions?.trim() || updateAssetMutation.isPending
                          }
                          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {updateAssetMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Save Changes
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'widget' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Embeddable Chat Widget</h3>
                    <p className="text-sm text-gray-600 mt-1">Customize and embed a beautiful chat widget on your website</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-600">Website Integration</span>
                  </div>
                </div>

                {/* Widget Configuration */}
                <div className="jira-content-card">
                  <div className="p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-6">Widget Customization</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Widget Title
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.title}
                          onChange={(e) => setWidgetConfig({...widgetConfig, title: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Chat Support"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.subtitle}
                          onChange={(e) => setWidgetConfig({...widgetConfig, subtitle: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="We usually reply within minutes"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.buttonText}
                          onChange={(e) => setWidgetConfig({...widgetConfig, buttonText: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Chat with us"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Greeting Message
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.greeting}
                          onChange={(e) => setWidgetConfig({...widgetConfig, greeting: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Hi! How can I help you today?"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Primary Color
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={widgetConfig.primaryColor}
                            onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                            className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={widgetConfig.primaryColor}
                            onChange={(e) => setWidgetConfig({...widgetConfig, primaryColor: e.target.value})}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position
                        </label>
                        <select
                          value={widgetConfig.position}
                          onChange={(e) => setWidgetConfig({...widgetConfig, position: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Button Style
                        </label>
                        <select
                          value={widgetConfig.buttonStyle}
                          onChange={(e) => setWidgetConfig({...widgetConfig, buttonStyle: e.target.value})}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="pill">Pill (with text)</option>
                          <option value="circle">Circle (icon only)</option>
                        </select>
                      </div>

                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={widgetConfig.showQuickReplies}
                            onChange={(e) => setWidgetConfig({...widgetConfig, showQuickReplies: e.target.checked})}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Show Quick Reply Buttons</span>
                        </label>
                      </div>
                    </div>

                    {widgetConfig.showQuickReplies && (
                      <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quick Reply Options (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={widgetConfig.quickReplies.join(', ')}
                          onChange={(e) => setWidgetConfig({
                            ...widgetConfig,
                            quickReplies: e.target.value.split(',').map(q => q.trim()).filter(q => q)
                          })}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Get a quote, File a claim, Talk to agent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Embed Code */}
                <div className="jira-content-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">Embed Code</h4>
                      <button
                        onClick={() => {
                          if (!widgetConfigFromServer?.widgetToken) {
                            alert('⏳ Please wait while we generate your widget token...');
                            return;
                          }
                          const embedCode = `<!-- AI Chat Widget -->
<script>
  window.CHATBOT_CONFIG = {
    apiUrl: '${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : 'http://localhost:3001'}',
    widgetId: 'default',
    widgetToken: '${widgetConfigFromServer.widgetToken}',
    title: '${widgetConfig.title}',
    subtitle: '${widgetConfig.subtitle}',
    buttonText: '${widgetConfig.buttonText}',
    greeting: '${widgetConfig.greeting}',
    primaryColor: '${widgetConfig.primaryColor}',
    position: '${widgetConfig.position}',
    buttonStyle: '${widgetConfig.buttonStyle}',
    showQuickReplies: ${widgetConfig.showQuickReplies},
    quickReplies: ${JSON.stringify(widgetConfig.quickReplies)}
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : 'http://localhost:3001'}/widget/chatbot-widget.js"></script>
<!-- End AI Chat Widget -->`;
                          navigator.clipboard.writeText(embedCode);
                          alert('✅ Code copied to clipboard!');
                        }}
                        disabled={isLoadingWidgetToken || !widgetConfigFromServer?.widgetToken}
                        className={`inline-flex items-center px-4 py-2 ${isLoadingWidgetToken || !widgetConfigFromServer?.widgetToken ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'} text-white rounded-lg transition-all shadow-sm font-medium`}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {isLoadingWidgetToken ? 'Generating Token...' : 'Copy Embed Code'}
                      </button>
                    </div>

                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-x-auto">
                      {isLoadingWidgetToken ? (
                        <div className="text-yellow-400 font-mono text-sm flex items-center">
                          <span className="animate-pulse">⏳ Generating your unique widget token...</span>
                        </div>
                      ) : (
                        <pre className="text-sm text-green-400 font-mono">
{`<!-- AI Chat Widget -->
<script>
  window.CHATBOT_CONFIG = {
    apiUrl: '${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : 'http://localhost:3001'}',
    widgetId: 'default',
    widgetToken: '${widgetConfigFromServer?.widgetToken || 'ERROR: Token not generated'}',
    title: '${widgetConfig.title}',
    subtitle: '${widgetConfig.subtitle}',
    buttonText: '${widgetConfig.buttonText}',
    greeting: '${widgetConfig.greeting}',
    primaryColor: '${widgetConfig.primaryColor}',
    position: '${widgetConfig.position}',
    buttonStyle: '${widgetConfig.buttonStyle}',
    showQuickReplies: ${widgetConfig.showQuickReplies},
    quickReplies: ${JSON.stringify(widgetConfig.quickReplies)}
  };
</script>
<script src="${typeof window !== 'undefined' ? window.location.origin.replace(':3000', ':3001') : 'http://localhost:3001'}/widget/chatbot-widget.js"></script>
<!-- End AI Chat Widget -->`}
                        </pre>
                      )}
                    </div>

                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <h5 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Installation Instructions
                      </h5>
                      <ol className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="font-semibold min-w-[20px]">1.</span>
                          <span>Click "Copy Embed Code" button above</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-semibold min-w-[20px]">2.</span>
                          <span>Paste the code before the closing <code className="bg-blue-100 px-1 rounded">&lt;/body&gt;</code> tag on your website</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-semibold min-w-[20px]">3.</span>
                          <span>The chat widget will appear on all pages where the code is installed</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="font-semibold min-w-[20px]">4.</span>
                          <span>Customize the appearance using the configuration options above</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="jira-content-card">
                  <div className="p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Live Preview</h4>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 relative border-2 border-dashed border-gray-300" style={{ height: '400px' }}>
                      <div className="text-center mt-32">
                        <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">This is how the widget will appear on your website</p>
                        <p className="text-sm text-gray-500 mt-2">Positioned at {widgetConfig.position.replace('-', ' ')}</p>
                      </div>

                      {/* Widget Preview Button */}
                      <div
                        className="absolute"
                        style={{
                          [widgetConfig.position.includes('right') ? 'right' : 'left']: '20px',
                          [widgetConfig.position.includes('bottom') ? 'bottom' : 'top']: '20px',
                        }}
                      >
                        <button
                          className="shadow-xl transition-transform hover:scale-105"
                          style={{
                            background: widgetConfig.primaryColor,
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '10px',
                            ...(widgetConfig.buttonStyle === 'pill' ? {
                              padding: '14px 24px',
                              borderRadius: '30px',
                            } : {
                              width: '60px',
                              height: '60px',
                              borderRadius: '50%',
                              justifyContent: 'center',
                            })
                          }}
                        >
                          <MessageCircle className="w-6 h-6" />
                          {widgetConfig.buttonStyle === 'pill' && <span>{widgetConfig.buttonText}</span>}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ background: widgetConfig.primaryColor }}></div>
                        <span>Primary Color: {widgetConfig.primaryColor}</span>
                      </div>
                      <span>•</span>
                      <span>Style: {widgetConfig.buttonStyle === 'pill' ? 'Pill with text' : 'Circle icon only'}</span>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="jira-content-card">
                  <div className="p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Widget Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <MessageCircle className="w-8 h-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-green-600">Widget Conversations</p>
                            <p className="text-2xl font-bold text-green-900">
                              {conversations.filter(c => c.type === 'WIDGET_CHAT').length}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <Globe className="w-8 h-8 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-purple-600">Active Websites</p>
                            <p className="text-2xl font-bold text-purple-900">1</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-orange-50 rounded-lg p-4">
                        <div className="flex items-center">
                          <TrendingUp className="w-8 h-8 text-orange-600 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-orange-600">Engagement Rate</p>
                            <p className="text-2xl font-bold text-orange-900">85%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}