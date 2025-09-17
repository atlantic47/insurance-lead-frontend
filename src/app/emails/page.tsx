'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Mail, Send, Reply, Archive, Trash2, Search, Filter, Plus, MoreVertical, Paperclip, Star, Clock, User } from 'lucide-react';
import RichTextEditor from '@/components/email/RichTextEditor';

interface EmailMessage {
  id: string;
  subject: string;
  content: string;
  fromEmail: string;
  toEmail: string;
  direction: 'INBOUND' | 'OUTBOUND';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  threadId?: string;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    status: string;
  };
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'READ' | 'unread'>('ALL');

  // Compose email form
  const [composeForm, setComposeForm] = useState({
    toEmail: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    fetchEmails();
  }, [directionFilter, readFilter]);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      // Mock data for now
      const mockEmails: EmailMessage[] = [
        {
          id: '1',
          subject: 'Inquiry about Home Insurance',
          content: '<p>Hi,</p><p>I am interested in getting a quote for <strong>home insurance</strong>. My property is located in the downtown area and I need comprehensive coverage.</p><p>Could you please provide me with:</p><ul><li>Coverage options available</li><li>Premium estimates</li><li>Policy terms and conditions</li></ul><p>Thank you for your time.</p><p><em>Best regards,<br>Alice</em></p>',
          fromEmail: 'customer@example.com',
          toEmail: 'info@insurance.com',
          direction: 'INBOUND',
          isRead: false,
          createdAt: new Date().toISOString(),
          threadId: 'thread_1',
          lead: {
            id: '1',
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'customer@example.com',
            phone: '+1234567890',
            status: 'NEW',
          },
        },
        {
          id: '2',
          subject: 'Re: Inquiry about Home Insurance',
          content: '<p>Dear Alice,</p><p>Thank you for your inquiry! I would be <strong>happy to help</strong> you with a home insurance quote.</p><p>To provide you with the most accurate quote, could you please provide more details about your property:</p><ol><li>Property type (house, condo, townhouse)</li><li>Year built</li><li>Square footage</li><li>Current estimated value</li></ol><p>I look forward to helping you find the perfect coverage!</p><p>Best regards,<br><em>Insurance Team</em></p>',
          fromEmail: 'info@insurance.com',
          toEmail: 'customer@example.com',
          direction: 'OUTBOUND',
          isRead: true,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          threadId: 'thread_1',
          lead: {
            id: '1',
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'customer@example.com',
            phone: '+1234567890',
            status: 'CONTACTED',
          },
        },
        {
          id: '3',
          subject: 'Business Insurance Quote Request',
          content: '<p>Hello,</p><p>I run a <strong>small retail business</strong> and need liability insurance. Can you provide me with a quote?</p><blockquote>Our business has been operating for 3 years and we\'re looking for comprehensive coverage.</blockquote><p>Thank you!</p>',
          fromEmail: 'business@example.com',
          toEmail: 'info@insurance.com',
          direction: 'INBOUND',
          isRead: true,
          readAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          lead: {
            id: '2',
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'business@example.com',
            status: 'ENGAGED',
          },
        },
      ];
      
      setEmails(mockEmails);
      if (mockEmails.length > 0 && !selectedEmail) {
        setSelectedEmail(mockEmails[0]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead: true, readAt: new Date().toISOString() } : email
      ));
      // API call would go here
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  };

  const sendReply = async () => {
    const textContent = replyContent.replace(/<[^>]*>/g, '').trim();
    if (!textContent || !selectedEmail) return;

    try {
      const replyEmail: EmailMessage = {
        id: Date.now().toString(),
        subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
        content: replyContent,
        fromEmail: 'info@insurance.com',
        toEmail: selectedEmail.fromEmail,
        direction: 'OUTBOUND',
        isRead: true,
        createdAt: new Date().toISOString(),
        threadId: selectedEmail.threadId,
        lead: selectedEmail.lead,
      };

      setEmails(prev => [replyEmail, ...prev]);
      setReplyContent('');
      
      // API call would go here
      console.log('Sending reply:', replyEmail);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  const sendNewEmail = async () => {
    const textContent = composeForm.content.replace(/<[^>]*>/g, '').trim();
    if (!composeForm.toEmail || !composeForm.subject || !textContent) return;

    try {
      const newEmail: EmailMessage = {
        id: Date.now().toString(),
        subject: composeForm.subject,
        content: composeForm.content,
        fromEmail: 'info@insurance.com',
        toEmail: composeForm.toEmail,
        direction: 'OUTBOUND',
        isRead: true,
        createdAt: new Date().toISOString(),
      };

      setEmails(prev => [newEmail, ...prev]);
      setComposeForm({ toEmail: '', subject: '', content: '' });
      setShowCompose(false);
      
      // API call would go here
      console.log('Sending new email:', newEmail);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.fromEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDirection = directionFilter === 'ALL' || email.direction === directionFilter;
    const matchesRead = readFilter === 'ALL' || 
                       (readFilter === 'read' && email.isRead) ||
                       (readFilter === 'unread' && !email.isRead);
    
    return matchesSearch && matchesDirection && matchesRead;
  });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
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
      <>
        <div className="jira-page-header">
          <div className="flex items-center justify-between">
          <div>
              <h1 className="text-2xl font-bold text-neutral-900">Email Management</h1>
              <p className="text-neutral-600 mt-1">Manage customer emails and lead communications</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-80 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowCompose(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Compose
              </button>
            </div>
          </div>
        </div>
      
      <div className="jira-page-content">
        <div className="jira-content-card h-[calc(100vh-300px)] flex overflow-hidden">
          {/* Email List */}
          <div className="w-96 border-r border-neutral-200 flex flex-col">
            <div className="card-header">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-neutral-900">Inbox</h3>
                <div className="flex items-center space-x-2">
                  <span className="badge badge-primary">{filteredEmails.length}</span>
                  <button className="btn btn-ghost btn-sm">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="flex space-x-2">
                <select
                  value={directionFilter}
                  onChange={(e) => setDirectionFilter(e.target.value as any)}
                  className="flex-1"
                >
                  <option value="ALL">All Messages</option>
                  <option value="INBOUND">Received</option>
                  <option value="OUTBOUND">Sent</option>
                </select>
                
                <select
                  value={readFilter}
                  onChange={(e) => setReadFilter(e.target.value as any)}
                  className="flex-1"
                >
                  <option value="ALL">All</option>
                  <option value="read">Read</option>
                  <option value="unread">Unread</option>
                </select>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="divide-y divide-neutral-100">
                {filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      if (!email.isRead) {
                        markAsRead(email.id);
                      }
                    }}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:bg-neutral-50 ${
                      selectedEmail?.id === email.id 
                        ? 'bg-primary-50 border-r-2 border-primary-500' 
                        : ''
                    } ${!email.isRead ? 'bg-blue-25' : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative pt-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          email.direction === 'INBOUND' 
                            ? 'bg-success-100 text-success-600' 
                            : 'bg-primary-100 text-primary-600'
                        }`}>
                          <Mail className="w-4 h-4" />
                        </div>
                        {!email.isRead && (
                          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-primary-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              email.direction === 'INBOUND' 
                                ? 'bg-success-50 text-success-700' 
                                : 'bg-primary-50 text-primary-700'
                            }`}>
                              {email.direction === 'INBOUND' ? 'IN' : 'OUT'}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(email.createdAt)}
                          </span>
                        </div>
                        
                        <h4 className={`text-sm mb-1 truncate ${
                          !email.isRead ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'
                        }`}>
                          {email.subject}
                        </h4>
                        
                        <p className="text-xs text-neutral-600 mb-1 truncate">
                          {email.direction === 'INBOUND' ? `From: ${email.fromEmail}` : `To: ${email.toEmail}`}
                        </p>
                        
                        {email.lead && (
                          <div className="flex items-center space-x-1 mb-2">
                            <User className="w-3 h-3 text-neutral-400" />
                            <span className="text-xs text-neutral-500">
                              {email.lead.firstName} {email.lead.lastName}
                            </span>
                            <span className="badge badge-neutral text-xs">
                              {email.lead.status}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-xs text-neutral-500 truncate">
                          {email.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Email Content */}
          <div className="flex-1 flex flex-col">
            {selectedEmail ? (
              <>
                {/* Email Header */}
                <div className="card-header">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        selectedEmail.direction === 'INBOUND' 
                          ? 'bg-success-100 text-success-600' 
                          : 'bg-primary-100 text-primary-600'
                      }`}>
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-lg">
                          {selectedEmail.subject}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-neutral-600 mt-1">
                          <span>From: {selectedEmail.fromEmail}</span>
                          <span>To: {selectedEmail.toEmail}</span>
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(selectedEmail.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="btn btn-ghost btn-sm">
                        <Star className="w-4 h-4" />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <Reply className="w-4 h-4" />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <Archive className="w-4 h-4" />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="btn btn-ghost btn-sm">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {selectedEmail.lead && (
                    <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-primary-600" />
                        <span className="font-medium text-primary-900">Lead Information:</span>
                        <span className="text-primary-700">
                          {selectedEmail.lead.firstName} {selectedEmail.lead.lastName}
                        </span>
                        <span className="badge badge-primary">
                          {selectedEmail.lead.status}
                        </span>
                        {selectedEmail.lead.phone && (
                          <span className="text-sm text-primary-600">
                            {selectedEmail.lead.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  <div className="prose prose-neutral max-w-none">
                    <div 
                      className="text-neutral-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                    />
                  </div>
                </div>

                {/* Reply Section */}
                <div className="card-footer">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-neutral-700">
                        Reply to this email
                      </label>
                    </div>
                    
                    <RichTextEditor
                      value={replyContent}
                      onChange={setReplyContent}
                      placeholder="Type your reply..."
                      minHeight="150px"
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button className="btn btn-ghost btn-sm">
                          <Paperclip className="w-4 h-4 mr-2" />
                          Attach File
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="btn btn-secondary">
                          Save Draft
                        </button>
                        <button
                          onClick={sendReply}
                          disabled={!replyContent.replace(/<[^>]*>/g, '').trim()}
                          className="btn btn-primary"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Select an email</h3>
                  <p className="text-neutral-600">Choose an email from the list to read and respond.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 fade-in">
          <div className="card w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Compose New Email</h3>
                </div>
                <button
                  onClick={() => setShowCompose(false)}
                  className="btn btn-ghost btn-sm"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="card-body overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    To
                  </label>
                  <input
                    type="email"
                    value={composeForm.toEmail}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, toEmail: e.target.value }))}
                    placeholder="Enter recipient email address"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={composeForm.subject}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter email subject"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Message
                  </label>
                  <RichTextEditor
                    value={composeForm.content}
                    onChange={(content) => setComposeForm(prev => ({ ...prev, content }))}
                    placeholder="Type your message here..."
                    minHeight="300px"
                  />
                </div>
              </div>
            </div>
            
            <div className="card-footer">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="btn btn-ghost btn-sm">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach File
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button className="btn btn-ghost">
                    Save Draft
                  </button>
                  <button
                    onClick={sendNewEmail}
                    disabled={!composeForm.toEmail || !composeForm.subject || !composeForm.content.replace(/<[^>]*>/g, '').trim()}
                    className="btn btn-primary"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    </DashboardLayout>
  );
}