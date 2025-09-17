'use client';

import { useState } from 'react';
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
  BarChart3
} from 'lucide-react';

export default function AIPage() {
  const [message, setMessage] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'insights' | 'history'>('chat');

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

  const tabs = [
    { key: 'chat', label: 'AI Chat', icon: MessageCircle },
    { key: 'insights', label: 'AI Insights', icon: Brain },
    { key: 'history', label: 'History', icon: BarChart3 },
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
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}