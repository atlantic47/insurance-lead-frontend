'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Send, Users, UserPlus } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { emailApi } from '@/lib/api';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend?: (data: EmailComposeData) => Promise<void>;
  replyTo?: {
    messageId: string;
    threadId: string;
    subject: string;
    fromEmail: string;
    leadId: string;
    toEmail: string;
  };
  leadId?: string;
}

interface EmailComposeData {
  toEmail: string;
  subject: string;
  content: string;
  ccEmails: string[];
  bccEmails: string[];
  inReplyTo?: string;
  threadId?: string;
  leadId?: string;
}

export default function EmailComposeModal({
  isOpen,
  onClose,
  onSend,
  replyTo,
  leadId
}: EmailComposeModalProps) {
  const [formData, setFormData] = useState<EmailComposeData>({
    toEmail: '',
    subject: '',
    content: '',
    ccEmails: [],
    bccEmails: [],
  });
  
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [ccInput, setCcInput] = useState('');
  const [bccInput, setBccInput] = useState('');

  useEffect(() => {
    if (isOpen && replyTo) {
      // Pre-fill form for reply
      setFormData({
        toEmail: replyTo.fromEmail,
        subject: replyTo.subject.startsWith('Re: ') ? replyTo.subject : `Re: ${replyTo.subject}`,
        content: '',
        ccEmails: [],
        bccEmails: [],
        inReplyTo: replyTo.messageId,
        threadId: replyTo.threadId,
        leadId: replyTo.leadId,
      });
    } else if (isOpen) {
      // Reset form for new email
      setFormData({
        toEmail: '',
        subject: '',
        content: '',
        ccEmails: [],
        bccEmails: [],
        leadId: leadId,
      });
    }
  }, [isOpen, replyTo, leadId]);

  useEffect(() => {
    if (!isOpen) {
      setShowCC(false);
      setShowBCC(false);
      setCcInput('');
      setBccInput('');
    }
  }, [isOpen]);

  const handleAddCC = () => {
    if (ccInput.trim() && !formData.ccEmails.includes(ccInput.trim())) {
      setFormData(prev => ({
        ...prev,
        ccEmails: [...prev.ccEmails, ccInput.trim()]
      }));
      setCcInput('');
    }
  };

  const handleAddBCC = () => {
    if (bccInput.trim() && !formData.bccEmails.includes(bccInput.trim())) {
      setFormData(prev => ({
        ...prev,
        bccEmails: [...prev.bccEmails, bccInput.trim()]
      }));
      setBccInput('');
    }
  };

  const removeCC = (email: string) => {
    setFormData(prev => ({
      ...prev,
      ccEmails: prev.ccEmails.filter(cc => cc !== email)
    }));
  };

  const removeBCC = (email: string) => {
    setFormData(prev => ({
      ...prev,
      bccEmails: prev.bccEmails.filter(bcc => bcc !== email)
    }));
  };

  const handleSend = async () => {
    if (!formData.toEmail || !formData.subject || !formData.content) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSending(true);
    try {
      if (onSend) {
        await onSend(formData);
      } else {
        await emailApi.send(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              {replyTo ? 'Reply to Email' : 'Compose Email'}
            </h2>
            {replyTo && (
              <p className="text-sm text-neutral-600 mt-1">
                In reply to: {replyTo.subject}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {/* To Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                To *
              </label>
              <input
                type="email"
                value={formData.toEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, toEmail: e.target.value }))}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* CC/BCC Toggle Buttons */}
            <div className="flex items-center space-x-4">
              {!showCC && (
                <button
                  onClick={() => setShowCC(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Users className="w-4 h-4 mr-1" />
                  Add CC
                </button>
              )}
              {!showBCC && (
                <button
                  onClick={() => setShowBCC(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Add BCC
                </button>
              )}
            </div>

            {/* CC Field */}
            {showCC && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    CC
                  </label>
                  <button
                    onClick={() => setShowCC(false)}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="email"
                    value={ccInput}
                    onChange={(e) => setCcInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCC())}
                    placeholder="cc@example.com"
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddCC}
                    disabled={!ccInput.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.ccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.ccEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {email}
                        <button
                          onClick={() => removeCC(email)}
                          className="ml-1 hover:text-blue-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* BCC Field */}
            {showBCC && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-neutral-700">
                    BCC
                  </label>
                  <button
                    onClick={() => setShowBCC(false)}
                    className="text-sm text-neutral-500 hover:text-neutral-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="email"
                    value={bccInput}
                    onChange={(e) => setBccInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBCC())}
                    placeholder="bcc@example.com"
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddBCC}
                    disabled={!bccInput.trim()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {formData.bccEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.bccEmails.map((email) => (
                      <span
                        key={email}
                        className="inline-flex items-center px-2 py-1 bg-neutral-100 text-neutral-800 rounded-full text-sm"
                      >
                        {email}
                        <button
                          onClick={() => removeBCC(email)}
                          className="ml-1 hover:text-neutral-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subject Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Message Content */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message *
              </label>
              <RichTextEditor
                value={formData.content}
                onChange={(content) => setFormData(prev => ({ ...prev, content }))}
                placeholder="Type your email message here..."
                minHeight="300px"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
          <div className="text-sm text-neutral-600">
            {formData.ccEmails.length > 0 && (
              <span className="mr-4">CC: {formData.ccEmails.length} recipient{formData.ccEmails.length !== 1 ? 's' : ''}</span>
            )}
            {formData.bccEmails.length > 0 && (
              <span>BCC: {formData.bccEmails.length} recipient{formData.bccEmails.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || !formData.toEmail || !formData.subject || !formData.content}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {isSending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}