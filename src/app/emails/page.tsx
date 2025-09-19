'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Mail, Send, Reply, Archive, Trash2, Search, Filter, Plus, MoreVertical, Paperclip, Star, Clock, User, Forward } from 'lucide-react';
import RichTextEditor from '@/components/email/RichTextEditor';
import EmailMultiSelect from '@/components/email/EmailMultiSelect';
import { emailApi } from '@/lib/api';

interface EmailMessage {
  id: string;
  messageId?: string;
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
  const [emailThread, setEmailThread] = useState<EmailMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [replyCC, setReplyCC] = useState<string[]>([]);
  const [replyBCC, setReplyBCC] = useState<string[]>([]);
  const [showCCBCC, setShowCCBCC] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);
  const [emailContacts, setEmailContacts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND'>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'READ' | 'unread'>('ALL');

  // Compose email form
  const [composeForm, setComposeForm] = useState({
    toEmail: '',
    subject: '',
    content: '',
    ccEmails: [] as string[],
    bccEmails: [] as string[],
  });
  const [showComposeCCBCC, setShowComposeCCBCC] = useState(false);

  // Forward email form
  const [forwardForm, setForwardForm] = useState({
    toEmail: '',
    ccEmails: [] as string[],
    bccEmails: [] as string[],
    content: '',
  });
  const [showForwardCCBCC, setShowForwardCCBCC] = useState(false);

  useEffect(() => {
    fetchEmails();
    fetchEmailContacts();
  }, [directionFilter, readFilter]);

  const fetchEmailContacts = async () => {
    try {
      const response = await emailApi.getContacts();
      setEmailContacts(response.data || []);
    } catch (error: any) {
      console.error('Error fetching email contacts:', error);
      if (error.response?.status === 401) {
        // User not authenticated - contacts will be empty
        setEmailContacts([]);
      } else {
        setEmailContacts([]);
      }
    }
  };

  const fetchEmailThread = async (threadId: string) => {
    if (!threadId) {
      setEmailThread([]);
      return;
    }

    try {
      setIsLoadingThread(true);
      const response = await emailApi.getThread(threadId);
      // Sort emails by creation date (oldest first for thread view)
      const sortedThread = (response.data || []).sort((a: EmailMessage, b: EmailMessage) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setEmailThread(sortedThread);
    } catch (error: any) {
      console.error('Error fetching email thread:', error);
      setEmailThread([]);
    } finally {
      setIsLoadingThread(false);
    }
  };

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      
      // Build query parameters based on filters
      const params: Record<string, unknown> = {
        page: 1,
        limit: 100, // Get more emails for better UX
      };
      
      if (directionFilter !== 'ALL') {
        params.direction = directionFilter;
      }
      
      if (readFilter !== 'ALL') {
        params.isRead = readFilter === 'READ';
      }

      // Fetch emails from API
      const response = await emailApi.getAll(params);
      const fetchedEmails = response.data.emails || [];
      
      setEmails(fetchedEmails);
      if (fetchedEmails.length > 0 && !selectedEmail) {
        setSelectedEmail(fetchedEmails[0]);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      // Show empty state instead of error
      setEmails([]);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (emailId: string) => {
    try {
      // Optimistically update UI
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead: true, readAt: new Date().toISOString() } : email
      ));
      
      // Update on server
      await emailApi.markAsRead(emailId);
    } catch (error) {
      console.error('Error marking email as read:', error);
      // Revert optimistic update
      setEmails(prev => prev.map(email => 
        email.id === emailId ? { ...email, isRead: false, readAt: undefined } : email
      ));
    }
  };

  const sendReply = async () => {
    const textContent = replyContent.replace(/<[^>]*>/g, '').trim();
    if (!textContent || !selectedEmail) return;

    try {
      const replyData = {
        toEmail: selectedEmail.fromEmail,
        subject: selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`,
        content: replyContent,
        inReplyTo: selectedEmail.messageId || selectedEmail.id, // Use messageId if available, fallback to id
        threadId: selectedEmail.threadId,
        leadId: selectedEmail.lead?.id,
        ccEmails: replyCC.length > 0 ? replyCC : undefined,
        bccEmails: replyBCC.length > 0 ? replyBCC : undefined,
      };

      console.log('Sending reply with data:', replyData);

      // Send reply via API
      const response = await emailApi.send(replyData);
      console.log('Reply sent successfully:', response);
      
      // Clear reply content and CC/BCC
      setReplyContent('');
      setReplyCC([]);
      setReplyBCC([]);
      setShowCCBCC(false);
      setShowReply(false);
      
      // Refresh emails to show the sent reply
      await fetchEmails();
      
    } catch (error: any) {
      console.error('Error sending reply:', error);
      if (error.response?.status === 401) {
        alert('Authentication required. Please log in first.');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert('You do not have permission to send emails.');
      } else {
        alert(`Failed to send reply: ${error.response?.data?.message || error.message || 'Unknown error'}`);
      }
    }
  };

  const sendNewEmail = async () => {
    const textContent = composeForm.content.replace(/<[^>]*>/g, '').trim();
    if (!composeForm.toEmail || !composeForm.subject || !textContent) return;

    try {
      const emailData = {
        toEmail: composeForm.toEmail,
        subject: composeForm.subject,
        content: composeForm.content,
        ccEmails: composeForm.ccEmails.length > 0 ? composeForm.ccEmails : undefined,
        bccEmails: composeForm.bccEmails.length > 0 ? composeForm.bccEmails : undefined,
      };

      // Send email via API
      await emailApi.send(emailData);
      
      // Reset form and close modal
      setComposeForm({ toEmail: '', subject: '', content: '', ccEmails: [], bccEmails: [] });
      setShowCompose(false);
      setShowComposeCCBCC(false);
      
      // Refresh emails to show the sent email
      await fetchEmails();
      
    } catch (error) {
      console.error('Error sending email:', error);
    }
  };

  const sendForward = async () => {
    const textContent = forwardForm.content.replace(/<[^>]*>/g, '').trim();
    if (!forwardForm.toEmail || !selectedEmail || !textContent) return;

    try {
      const forwardData = {
        toEmail: forwardForm.toEmail,
        subject: selectedEmail.subject.startsWith('Fwd:') ? selectedEmail.subject : `Fwd: ${selectedEmail.subject}`,
        content: forwardForm.content,
        leadId: selectedEmail.lead?.id,
        ccEmails: forwardForm.ccEmails.length > 0 ? forwardForm.ccEmails : undefined,
        bccEmails: forwardForm.bccEmails.length > 0 ? forwardForm.bccEmails : undefined,
      };

      // Send forward via API
      await emailApi.send(forwardData);
      
      // Reset form and close modal
      setForwardForm({ toEmail: '', ccEmails: [], bccEmails: [], content: '' });
      setShowForward(false);
      setShowForwardCCBCC(false);
      
      // Refresh emails to show the forwarded email
      await fetchEmails();
      
    } catch (error) {
      console.error('Error forwarding email:', error);
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.fromEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDirection = directionFilter === 'ALL' || email.direction === directionFilter;
    const matchesRead = readFilter === 'ALL' || 
                       (readFilter === 'READ' && email.isRead) ||
                       (readFilter === 'unread' && !email.isRead);
    
    return matchesSearch && matchesDirection && matchesRead;
  });

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  };

  const openReplyModal = (email?: EmailMessage) => {
    // Use the latest email in the thread for reply context
    const emailToReply = email || (emailThread.length > 0 ? emailThread[emailThread.length - 1] : selectedEmail);
    if (emailToReply) {
      setSelectedEmail(emailToReply);
      setReplyContent('');
      setReplyCC([]);
      setReplyBCC([]);
      setReplyAttachments([]);
      setShowCCBCC(false);
      setShowReply(true);
    }
  };

  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setReplyAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setReplyAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const openForwardModal = (email?: EmailMessage) => {
    // Use the latest email in the thread for forward context
    const emailToForward = email || (emailThread.length > 0 ? emailThread[emailThread.length - 1] : selectedEmail);
    if (emailToForward) {
      setSelectedEmail(emailToForward);
      const forwardContent = `
        <br><br>
        ---------- Forwarded message ----------<br>
        <strong>From:</strong> ${emailToForward.fromEmail}<br>
        <strong>To:</strong> ${emailToForward.toEmail}<br>
        <strong>Subject:</strong> ${emailToForward.subject}<br>
        <strong>Date:</strong> ${formatDate(emailToForward.createdAt)}<br><br>
        ${emailToForward.content}
      `;
      setForwardForm({
        toEmail: '',
        ccEmails: [],
        bccEmails: [],
        content: forwardContent,
      });
      setShowForwardCCBCC(false);
      setShowForward(true);
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
                  <option value="READ">Read</option>
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
                      if (email.threadId) {
                        fetchEmailThread(email.threadId);
                      } else {
                        setEmailThread([email]); // If no thread, just show this email
                      }
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
                          {stripHtml(email.content)}
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
                      <button 
                        onClick={() => openReplyModal()}
                        className="btn btn-ghost btn-sm"
                        title="Reply"
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openForwardModal()}
                        className="btn btn-ghost btn-sm"
                        title="Forward"
                      >
                        <Send className="w-4 h-4" />
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

                {/* Email Thread Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {isLoadingThread ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : emailThread.length > 0 ? (
                    <div className="space-y-6">
                      {emailThread.map((email, index) => (
                        <div 
                          key={email.id}
                          className={`border rounded-lg p-4 ${
                            email.id === selectedEmail?.id 
                              ? 'border-primary-300 bg-primary-25' 
                              : 'border-neutral-200 bg-white'
                          }`}
                        >
                          {/* Email Header */}
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-100">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                                email.direction === 'INBOUND' 
                                  ? 'bg-success-100 text-success-700' 
                                  : 'bg-primary-100 text-primary-700'
                              }`}>
                                {email.direction === 'INBOUND' ? 'IN' : 'OUT'}
                              </div>
                              <div>
                                <div className="font-medium text-sm text-neutral-900">
                                  {email.direction === 'INBOUND' ? `From: ${email.fromEmail}` : `To: ${email.toEmail}`}
                                </div>
                                <div className="text-xs text-neutral-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(email.createdAt)}
                                  {!email.isRead && email.direction === 'INBOUND' && (
                                    <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                                      Unread
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {index === emailThread.length - 1 && (
                                <>
                                  <button 
                                    onClick={() => openReplyModal(email)}
                                    className="btn btn-ghost btn-sm"
                                    title="Reply to this message"
                                  >
                                    <Reply className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => openForwardModal(email)}
                                    className="btn btn-ghost btn-sm"
                                    title="Forward this message"
                                  >
                                    <Send className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Email Content */}
                          <div className="prose prose-neutral max-w-none prose-sm">
                            <div 
                              className="text-neutral-700 leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: email.content }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedEmail ? (
                    <div className="prose prose-neutral max-w-none">
                      <div 
                        className="text-neutral-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.content }}
                      />
                    </div>
                  ) : null}
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
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in"
          onClick={() => setShowCompose(false)}
        >
          <div 
            className="card w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden bg-white shadow-2xl border border-neutral-200"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      To
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowComposeCCBCC(!showComposeCCBCC)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      CC/BCC
                    </button>
                  </div>
                  <input
                    type="email"
                    value={composeForm.toEmail}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, toEmail: e.target.value }))}
                    placeholder="Enter recipient email address"
                    className="w-full"
                  />
                </div>

                {/* CC/BCC Fields for Compose */}
                {showComposeCCBCC && (
                  <div className="space-y-3 p-3 bg-neutral-50 rounded-lg">
                    <EmailMultiSelect
                      label="CC"
                      selectedEmails={composeForm.ccEmails}
                      onSelectionChange={(emails) => setComposeForm(prev => ({ ...prev, ccEmails: emails }))}
                      placeholder="CC recipients..."
                      availableContacts={emailContacts}
                    />
                    <EmailMultiSelect
                      label="BCC"
                      selectedEmails={composeForm.bccEmails}
                      onSelectionChange={(emails) => setComposeForm(prev => ({ ...prev, bccEmails: emails }))}
                      placeholder="BCC recipients..."
                      availableContacts={emailContacts}
                    />
                  </div>
                )}
                
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
                
                <div className="relative z-20">
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
            
            <div className="card-footer flex-shrink-0">
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

      {/* Reply Modal */}
      {showReply && selectedEmail && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in"
          onClick={() => setShowReply(false)}
        >
          <div 
            className="card w-full max-w-4xl mx-4 max-h-[90vh] bg-white shadow-2xl border border-neutral-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-success-100 text-success-600 rounded-lg flex items-center justify-center">
                    <Reply className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Reply to Email</h3>
                </div>
                <button
                  onClick={() => setShowReply(false)}
                  className="btn btn-ghost btn-sm"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="card-body overflow-y-auto custom-scrollbar relative flex-1">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      To: {selectedEmail.fromEmail}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCCBCC(!showCCBCC)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      CC/BCC
                    </button>
                  </div>
                </div>

                {/* CC/BCC Fields for Reply */}
                {showCCBCC && (
                  <div className="space-y-3 p-3 bg-neutral-50 rounded-lg">
                    <EmailMultiSelect
                      label="CC"
                      selectedEmails={replyCC}
                      onSelectionChange={setReplyCC}
                      placeholder="CC recipients..."
                      availableContacts={emailContacts}
                    />
                    <EmailMultiSelect
                      label="BCC"
                      selectedEmails={replyBCC}
                      onSelectionChange={setReplyBCC}
                      placeholder="BCC recipients..."
                      availableContacts={emailContacts}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Subject: Re: {selectedEmail.subject.replace(/^Re:\s*/i, '')}
                  </label>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Message
                  </label>
                  <RichTextEditor
                    value={replyContent}
                    onChange={setReplyContent}
                    placeholder="Type your reply here..."
                    minHeight="200px"
                  />
                </div>

                {/* Attachments Preview */}
                {replyAttachments.length > 0 && (
                  <div className="p-3 bg-neutral-50 rounded-lg border">
                    <h4 className="text-sm font-medium text-neutral-700 mb-2">Attachments ({replyAttachments.length})</h4>
                    <div className="space-y-2">
                      {replyAttachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="w-4 h-4 text-neutral-500" />
                            <span className="text-sm text-neutral-700">{file.name}</span>
                            <span className="text-xs text-neutral-500">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Original Email Content */}
                <div className="border-l-4 border-neutral-300 pl-4 py-3 bg-neutral-50 rounded-r-lg">
                  <div className="text-sm text-neutral-500 mb-2 font-medium">
                    On {formatDate(selectedEmail.createdAt)}, {selectedEmail.fromEmail} wrote:
                  </div>
                  <div className="text-sm text-neutral-600 max-h-60 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.content }} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card-footer flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    multiple
                    onChange={handleAttachmentUpload}
                    className="hidden"
                    id="reply-file-input"
                  />
                  <label htmlFor="reply-file-input" className="btn btn-ghost btn-sm cursor-pointer">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach File
                  </label>
                  {replyAttachments.length > 0 && (
                    <span className="text-sm text-neutral-600">
                      {replyAttachments.length} file(s) attached
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowReply(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button className="btn btn-ghost">
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
        </div>
      )}

      {/* Forward Modal */}
      {showForward && selectedEmail && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 fade-in"
          onClick={() => setShowForward(false)}
        >
          <div 
            className="card w-full max-w-4xl mx-4 max-h-[90vh] bg-white shadow-2xl border border-neutral-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">Forward Email</h3>
                </div>
                <button
                  onClick={() => setShowForward(false)}
                  className="btn btn-ghost btn-sm"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="card-body overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      To
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForwardCCBCC(!showForwardCCBCC)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      CC/BCC
                    </button>
                  </div>
                  <input
                    type="email"
                    value={forwardForm.toEmail}
                    onChange={(e) => setForwardForm(prev => ({ ...prev, toEmail: e.target.value }))}
                    placeholder="Enter recipient email address"
                    className="w-full"
                  />
                </div>

                {/* CC/BCC Fields for Forward */}
                {showForwardCCBCC && (
                  <div className="space-y-3 p-3 bg-neutral-50 rounded-lg">
                    <EmailMultiSelect
                      label="CC"
                      selectedEmails={forwardForm.ccEmails}
                      onSelectionChange={(emails) => setForwardForm(prev => ({ ...prev, ccEmails: emails }))}
                      placeholder="CC recipients..."
                      availableContacts={emailContacts}
                    />
                    <EmailMultiSelect
                      label="BCC"
                      selectedEmails={forwardForm.bccEmails}
                      onSelectionChange={(emails) => setForwardForm(prev => ({ ...prev, bccEmails: emails }))}
                      placeholder="BCC recipients..."
                      availableContacts={emailContacts}
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Subject: Fwd: {selectedEmail.subject.replace(/^Fwd:\s*/i, '')}
                  </label>
                </div>
                
                <div className="relative">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Message
                  </label>
                  <RichTextEditor
                    value={forwardForm.content}
                    onChange={(content) => setForwardForm(prev => ({ ...prev, content }))}
                    placeholder="Add your message (optional)..."
                    minHeight="300px"
                  />
                </div>
              </div>
            </div>
            
            <div className="card-footer flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button className="btn btn-ghost btn-sm">
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach File
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowForward(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button className="btn btn-ghost">
                    Save Draft
                  </button>
                  <button
                    onClick={sendForward}
                    disabled={!forwardForm.toEmail}
                    className="btn btn-primary"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Forward Email
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