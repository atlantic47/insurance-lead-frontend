'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import EmailComposeModal from '@/components/email/EmailComposeModal';
import { emailApi } from '@/lib/api';
import {
  Mail,
  Inbox,
  Send,
  Search,
  Plus,
  Reply,
  ReplyAll,
  Forward,
  MoreVertical,
  Clock,
  User,
  Users,
  Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface EmailMessage {
  id: string;
  subject: string;
  content: string;
  fromEmail: string;
  toEmail: string;
  ccEmails?: string[];
  bccEmails?: string[];
  direction: 'INBOUND' | 'OUTBOUND';
  isRead: boolean;
  createdAt: string;
  messageId: string;
  threadId: string;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface EmailThread {
  threadId: string;
  subject: string;
  messageCount: number;
  unreadCount: number;
  latestMessageAt: string;
  lead: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  messages: EmailMessage[];
}

export default function EmailPage() {
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyData, setReplyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const threadId = searchParams.get('thread');

  useEffect(() => {
    fetchEmailThreads();
  }, [searchTerm, showUnreadOnly]);

  useEffect(() => {
    if (threadId && threads.length > 0) {
      const thread = threads.find(t => t.threadId === threadId);
      if (thread) {
        setSelectedThread(thread);
      }
    }
  }, [threadId, threads]);

  const fetchEmailThreads = async () => {
    try {
      setIsLoading(true);
      const response = await emailApi.getThreads({
        limit: 50,
        isRead: showUnreadOnly ? false : undefined,
      });
      setThreads(response.data.threads || []);

      // Select first thread if none selected
      if (!selectedThread && response.data.threads?.length > 0) {
        const firstThread = response.data.threads[0];
        setSelectedThread(firstThread);
        router.replace(`/email?thread=${firstThread.threadId}`, { scroll: false });
      }
    } catch (error) {
      console.error('Error fetching email threads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectThread = async (thread: EmailThread) => {
    setSelectedThread(thread);
    router.replace(`/email?thread=${thread.threadId}`, { scroll: false });

    // Mark unread messages as read
    const unreadMessages = thread.messages.filter(msg => !msg.isRead && msg.direction === 'INBOUND');
    for (const message of unreadMessages) {
      try {
        await emailApi.markAsRead(message.id);
      } catch (error) {
        console.error('Error marking email as read:', error);
      }
    }

    // Refresh threads to update read status
    if (unreadMessages.length > 0) {
      fetchEmailThreads();
    }
  };

  const handleReply = (message: EmailMessage) => {
    setReplyData({
      messageId: message.messageId,
      threadId: message.threadId,
      subject: message.subject,
      fromEmail: message.fromEmail,
      leadId: message.lead?.id,
      toEmail: message.fromEmail,
    });
    setIsComposeOpen(true);
  };

  const handleCompose = () => {
    setReplyData(null);
    setIsComposeOpen(true);
  };

  const handleFetchEmails = async () => {
    setIsFetching(true);
    try {
      const response = await emailApi.fetchEmails();
      if (response.data.success) {
        alert('Email fetch completed successfully!');
        await fetchEmailThreads(); // Refresh the threads
      } else {
        alert(`Email fetch failed: ${response.data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
      alert('Failed to fetch emails. Please check your connection and try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleEmailSent = async () => {
    await fetchEmailThreads();
    setIsComposeOpen(false);
    setReplyData(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredThreads = threads.filter(thread => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      thread.subject.toLowerCase().includes(searchLower) ||
      thread.lead.firstName.toLowerCase().includes(searchLower) ||
      thread.lead.lastName.toLowerCase().includes(searchLower) ||
      thread.lead.email.toLowerCase().includes(searchLower)
    );
  });

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
            <h1 className="text-2xl font-semibold text-gray-900">Email</h1>
            <p className="text-gray-600 mt-1">Manage email conversations with leads</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleFetchEmails}
              disabled={isFetching}
              variant="outline"
              size="default"
            >
              {isFetching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              ) : (
                <Inbox className="w-4 h-4 mr-2" />
              )}
              {isFetching ? 'Fetching...' : 'Fetch Emails'}
            </Button>
            <Button
              onClick={handleCompose}
              size="default"
            >
              <Plus className="w-4 h-4 mr-2" />
              Compose Email
            </Button>
          </div>
        </div>
      </div>

      <div className="jira-page-content">
        <Card className="h-[700px] flex overflow-hidden border-0 shadow-sm">
          {/* Email Threads List */}
          <div className="w-80 border-r flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Conversations</h3>
                <Badge variant="default">{filteredThreads.length}</Badge>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={showUnreadOnly}
                    onChange={(e) => setShowUnreadOnly(e.target.checked)}
                    className="mr-2 rounded"
                  />
                  Show unread only
                </label>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1">
              <div className="divide-y">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.threadId}
                    onClick={() => selectThread(thread)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedThread?.threadId === thread.threadId
                        ? 'bg-muted border-r-2 border-primary'
                        : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm">
                          {thread.lead.firstName.charAt(0)}{thread.lead.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium truncate ${thread.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {thread.lead.firstName} {thread.lead.lastName}
                          </h4>
                          {thread.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {thread.unreadCount}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-1 truncate">
                          {thread.subject}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatTime(thread.latestMessageAt)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-muted-foreground">
                              {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                            </span>
                            <Mail className="w-3 h-3 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Email Thread View */}
          <div className="flex-1 flex flex-col">
            {selectedThread ? (
              <>
                {/* Thread Header */}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {selectedThread.subject}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {selectedThread.lead.firstName} {selectedThread.lead.lastName}
                        </span>
                        <span>{selectedThread.lead.email}</span>
                        <span>{selectedThread.messageCount} messages</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handleReply(selectedThread.messages[selectedThread.messages.length - 1])}
                        variant="outline"
                        size="sm"
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <Separator />

                {/* Messages */}
                <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6">
                    {selectedThread.messages.map((message) => (
                      <Card key={message.id} className="shadow-sm">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className={
                                  message.direction === 'INBOUND' ? 'bg-blue-500' : 'bg-green-500'
                                }>
                                  {message.direction === 'INBOUND'
                                    ? selectedThread.lead.firstName.charAt(0)
                                    : 'Me'
                                  }
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {message.direction === 'INBOUND'
                                      ? `${selectedThread.lead.firstName} ${selectedThread.lead.lastName}`
                                      : 'You'
                                    }
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    to {message.toEmail}
                                  </span>
                                </div>
                                {(message.ccEmails && message.ccEmails.length > 0) && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    CC: {JSON.parse(message.ccEmails as any).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-muted-foreground">
                                {formatTime(message.createdAt)}
                              </span>
                              {message.direction === 'INBOUND' && (
                                <Button
                                  onClick={() => handleReply(message)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <Reply className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>

                        <Separator />

                        <CardContent className="pt-4">
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: message.content }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select an email thread</h3>
                  <p className="text-muted-foreground">Choose a conversation from the list to view messages.</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        <EmailComposeModal
          isOpen={isComposeOpen}
          onClose={() => {
            setIsComposeOpen(false);
            setReplyData(null);
          }}
          onSend={handleEmailSent}
          replyTo={replyData}
        />
      </div>
    </DashboardLayout>
  );
}
