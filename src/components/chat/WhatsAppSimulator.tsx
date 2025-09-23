'use client';

import { useState } from 'react';
import { chatApi } from '@/lib/api';
import { MessageCircle, Send, Phone } from 'lucide-react';

interface WhatsAppSimulatorProps {
  onMessageSent?: () => void;
}

export default function WhatsAppSimulator({ onMessageSent }: WhatsAppSimulatorProps) {
  const [phoneNumber, setPhoneNumber] = useState('+1234567890');
  const [senderName, setSenderName] = useState('John Doe');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const simulateIncomingMessage = async () => {
    if (!message.trim() || !phoneNumber.trim() || isSending) return;

    setIsSending(true);
    try {
      await chatApi.webhookWhatsApp({
        phoneNumber,
        message,
        senderName,
      });
      
      setMessage('');
      onMessageSent?.();
      
      alert('WhatsApp message simulated successfully!');
    } catch (error) {
      console.error('Error simulating WhatsApp message:', error);
      alert('Failed to simulate WhatsApp message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="jira-content-card p-6">
      <div className="flex items-center space-x-3 mb-4">
        <MessageCircle className="w-6 h-6 text-green-600" />
        <h3 className="text-lg font-semibold text-gray-900">WhatsApp Message Simulator</h3>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1234567890"
              className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ 
                paddingLeft: '48px'
              }}
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none z-10" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sender Name
          </label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && simulateIncomingMessage()}
            placeholder="Hi, I need help with car insurance..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>
        
        <button
          onClick={simulateIncomingMessage}
          disabled={!message.trim() || !phoneNumber.trim() || isSending}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Simulate WhatsApp Message</span>
            </>
          )}
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>How it works:</strong> This simulator sends a message to the WhatsApp webhook endpoint, 
          which will create a new lead if needed and trigger the AI assistant to respond.
        </p>
      </div>
    </div>
  );
}