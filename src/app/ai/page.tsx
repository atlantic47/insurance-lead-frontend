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
  const [trainingUrl, setTrainingUrl] = useState('');
  const [trainingInstructions, setTrainingInstructions] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [trainingData, setTrainingData] = useState<any[]>([]);
  const [savedUrls, setSavedUrls] = useState<string[]>([]);
  const [testHistory, setTestHistory] = useState<Array<{message: string, response: string, timestamp: Date}>>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

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
    onError: (error) => {
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
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">AI Training & Knowledge Base</h3>
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-600">Enhance AI Knowledge</span>
                  </div>
                </div>

                {/* How to Use Guide */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">📚 How to Train Your AI:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-800">
                    <div>
                      <p className="font-medium mb-1">For Files:</p>
                      <p>1. Click "Select Files" → Choose documents</p>
                      <p>2. Write training instructions below</p>
                      <p>3. Click "Upload & Train" button</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">For Websites:</p>
                      <p>1. Write training instructions below first</p>
                      <p>2. Enter URLs → Click "Process URL"</p>
                      <p>3. URLs are automatically processed with your instructions</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* File Upload Section */}
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Upload Training Files</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload documents, PDFs, or text files to train the AI
                      </p>
                      <div className="mt-6 space-y-4">
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.txt,.md"
                          onChange={(e) => setSelectedFiles(e.target.files)}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Select Files
                        </label>
                        
                        {selectedFiles && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                              {selectedFiles.length} file(s) selected:
                            </p>
                            <div className="space-y-1 max-h-20 overflow-y-auto">
                              {Array.from(selectedFiles).map((file, index) => (
                                <div key={index} className="text-xs text-gray-500 flex items-center bg-gray-50 px-2 py-1 rounded">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {file.name}
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 p-3 bg-blue-50 rounded-md">
                              <p className="text-xs text-blue-800">
                                📝 <strong>Next step:</strong> Write training instructions below, then click "Upload & Train" button
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* URL Management Section */}
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Globe className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Process URLs for Training</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Add URLs to extract content and train the AI (requires instructions below)
                      </p>
                      <div className="mt-6">
                        <div className="flex rounded-md shadow-sm">
                          <div className="relative flex items-stretch flex-grow focus-within:z-10">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Link className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="url"
                              value={trainingUrl}
                              onChange={(e) => setTrainingUrl(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveUrl()}
                              placeholder="https://example.com/page"
                              className="focus:ring-blue-500 focus:border-blue-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300"
                            />
                          </div>
                          <button
                            onClick={handleSaveUrl}
                            disabled={!trainingUrl.trim() || saveUrlMutation.isPending}
                            className="relative -ml-px inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                          >
                            {saveUrlMutation.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span>Process URL</span>
                          </button>
                        </div>
                        
                        {/* Processed URLs List */}
                        {savedUrls.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 mb-2">Processed URLs ({savedUrls.length}):</p>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {savedUrls.map((url, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                                  <span className="text-xs text-gray-600 truncate flex-1 mr-2">{url}</span>
                                  <button
                                    onClick={() => removeUrl(url)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Training Instructions */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-5 h-5 text-blue-600" />
                    <h4 className="text-lg font-medium text-gray-900">Training Instructions</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Tell the AI how to use your content. Be specific about what you want it to learn and how to respond.
                  </p>
                  <textarea
                    value={trainingInstructions}
                    onChange={(e) => setTrainingInstructions(e.target.value)}
                    rows={6}
                    placeholder="Example: 'Use this information to answer questions about our insurance policies and pricing. When customers ask about rates, refer them to the pricing page. Focus on auto and home insurance products.'"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Be specific about how the AI should interpret and use the content
                      </p>
                      {savedUrls.length > 0 && (
                        <p className="text-xs text-blue-600">
                          You can reference the {savedUrls.length} saved URL(s) in your instructions
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      {selectedFiles && (
                        <button
                          onClick={handleFileUpload}
                          disabled={!trainingInstructions.trim() || uploadFilesMutation.isPending}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                          {uploadFilesMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Upload & Train Files
                        </button>
                      )}
                      {(savedUrls.length > 0 || !selectedFiles) && (
                        <button
                          onClick={handleSubmitTraining}
                          disabled={!trainingInstructions.trim() || submitTrainingMutation.isPending}
                          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {submitTrainingMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <Brain className="w-4 h-4 mr-2" />
                          )}
                          Submit Training{savedUrls.length > 0 ? ` (${savedUrls.length} URLs)` : ''}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Test Chat - Prominent Section */}
                <div className="bg-white rounded-lg border-2 border-blue-200 shadow-lg">
                  <div className="p-4 border-b border-blue-200 bg-blue-50">
                    <h4 className="text-xl font-bold text-blue-900 flex items-center">
                      <MessageCircle className="w-6 h-6 mr-2 text-blue-600" />
                      🤖 Test Your AI
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Chat with your trained AI to see how it responds
                    </p>
                  </div>
                  
                  {/* Chat Messages Area */}
                  <div ref={chatMessagesRef} className="h-64 overflow-y-auto p-4 bg-gray-50">
                    {testHistory.length === 0 ? (
                      <div className="text-center text-gray-500 mt-8">
                        <Bot className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>Start a conversation with the AI</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {testHistory.map((chat, index) => (
                          <div key={index}>
                            {/* Your message */}
                            <div className="flex justify-end mb-2">
                              <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-xs">
                                {chat.message}
                              </div>
                            </div>
                            {/* AI response */}
                            <div className="flex justify-start">
                              <div className="bg-white border px-3 py-2 rounded-lg max-w-xs">
                                <div className="flex items-start gap-2">
                                  <Bot className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <div className="text-sm">{chat.response}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Loading indicator */}
                    {testAiMutation.isPending && (
                      <div className="space-y-3">
                        <div className="flex justify-end">
                          <div className="bg-blue-500 text-white px-3 py-2 rounded-lg max-w-xs">
                            {testMessage}
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-white border px-3 py-2 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                              <span className="text-sm text-gray-600">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input - Prominent */}
                  <div className="p-6 border-t-2 border-blue-200 bg-white">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleTestAi()}
                        placeholder="Type your message here... (e.g., 'Hello', 'What insurance do you offer?')"
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                        disabled={testAiMutation.isPending}
                      />
                      <button
                        onClick={handleTestAi}
                        disabled={!testMessage.trim() || testAiMutation.isPending}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
                      >
                        {testAiMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Thinking...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        💬 Press Enter to send • {testHistory.length} messages
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
                  
                  <div className="overflow-hidden">
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
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
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
                                  <div className="flex items-center space-x-2">
                                    <p className="text-sm font-medium text-gray-900 truncate">
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
                                  <p className="text-sm text-gray-500 mt-1 truncate">
                                    {item.instructions}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
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
                              
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    // Preview content functionality
                                    console.log('Preview:', item);
                                  }}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Are you sure you want to delete this training asset?')) {
                                      deleteAssetMutation.mutate(item.id);
                                    }
                                  }}
                                  disabled={deleteAssetMutation.isPending}
                                  className="text-red-600 hover:text-red-800 disabled:opacity-50"
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
              </div>
            )}

            {activeTab === 'widget' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Embeddable Widget</h3>
                    <p className="text-sm text-gray-600 mt-1">Copy and paste this script to add the chatbot to any website</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-blue-600">Website Integration</span>
                  </div>
                </div>

                {/* Widget Configuration */}
                <div className="jira-content-card">
                  <div className="p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Widget Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Widget Title
                        </label>
                        <input
                          type="text"
                          defaultValue="Insurance Assistant"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter widget title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Position
                        </label>
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                          <option value="bottom-right">Bottom Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-left">Top Left</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Theme Color
                        </label>
                        <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                          <option value="blue">Blue</option>
                          <option value="green">Green</option>
                          <option value="purple">Purple</option>
                          <option value="red">Red</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Greeting Message
                        </label>
                        <input
                          type="text"
                          defaultValue="Hi! How can I help you with insurance today?"
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Enter greeting message"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Embed Code */}
                <div className="jira-content-card">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-gray-900">Embed Code</h4>
                      <button
                        onClick={() => {
                          const code = document.getElementById('embed-code')?.textContent;
                          if (code) {
                            navigator.clipboard.writeText(code);
                            alert('Code copied to clipboard!');
                          }
                        }}
                        className="jira-button-primary"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Copy Code
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <code id="embed-code" className="text-sm text-gray-800 whitespace-pre-wrap">
{`<!-- Insurance Chatbot Widget -->
<script>
  window.CHATBOT_CONFIG = {
    apiUrl: 'http://localhost:3001',
    widgetId: 'default',
    title: 'Insurance Assistant',
    greeting: 'Hi! How can I help you with insurance today?',
    theme: 'blue',
    position: 'bottom-right'
  };
</script>
<script src="http://localhost:3001/api/ai/widget/script"></script>
<!-- End Insurance Chatbot Widget -->`}
                      </code>
                    </div>
                    
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">Installation Instructions:</h5>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>1. Copy the code above</li>
                        <li>2. Paste it before the closing &lt;/body&gt; tag on your website</li>
                        <li>3. The chatbot will appear on all pages where the code is installed</li>
                        <li>4. Customize the configuration object to match your preferences</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="jira-content-card">
                  <div className="p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Preview</h4>
                    <div className="bg-gray-100 rounded-lg p-8 relative" style={{ height: '300px' }}>
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-blue-600 text-white p-3 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                          <MessageCircle className="w-6 h-6" />
                        </div>
                      </div>
                      <p className="text-gray-600 text-center mt-20">
                        This is how the widget will appear on your website
                      </p>
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