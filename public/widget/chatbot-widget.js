(function() {
  'use strict';

  // Widget configuration
  const WIDGET_CONFIG = {
    apiBaseUrl: window.CHATBOT_CONFIG?.apiUrl || 'http://localhost:3001',
    widgetId: window.CHATBOT_CONFIG?.widgetId || 'default',
    position: window.CHATBOT_CONFIG?.position || 'bottom-right',
    theme: window.CHATBOT_CONFIG?.theme || 'blue',
    greeting: window.CHATBOT_CONFIG?.greeting || 'Hi! How can I help you today?',
    title: window.CHATBOT_CONFIG?.title || 'Insurance Assistant',
    logo: window.CHATBOT_CONFIG?.logo || null
  };

  // Widget state
  let isOpen = false;
  let conversationId = null;
  let messages = [];

  // Create widget HTML
  function createWidget() {
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'insurance-chatbot-widget';
    widgetContainer.innerHTML = `
      <style>
        #insurance-chatbot-widget {
          position: fixed;
          ${WIDGET_CONFIG.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
          ${WIDGET_CONFIG.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .chatbot-trigger {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: ${WIDGET_CONFIG.theme === 'blue' ? '#0052cc' : '#22c55e'};
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .chatbot-trigger:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .chatbot-trigger svg {
          width: 24px;
          height: 24px;
          fill: white;
        }

        .chatbot-window {
          position: absolute;
          ${WIDGET_CONFIG.position.includes('right') ? 'right: 0;' : 'left: 0;'}
          ${WIDGET_CONFIG.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
          width: 350px;
          height: 450px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid #e2e8f0;
          display: none;
          flex-direction: column;
          overflow: hidden;
        }

        .chatbot-window.open {
          display: flex;
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .chatbot-header {
          background: ${WIDGET_CONFIG.theme === 'blue' ? '#0052cc' : '#22c55e'};
          color: white;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .chatbot-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .chatbot-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          font-size: 18px;
        }

        .chatbot-close:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .chatbot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          max-width: 85%;
          padding: 8px 12px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.4;
        }

        .message.user {
          background: #f1f5f9;
          color: #1e293b;
          align-self: flex-end;
          border-bottom-right-radius: 4px;
        }

        .message.bot {
          background: ${WIDGET_CONFIG.theme === 'blue' ? '#0052cc' : '#22c55e'};
          color: white;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .message.typing {
          background: #f1f5f9;
          color: #64748b;
          align-self: flex-start;
          border-bottom-left-radius: 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .typing-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #94a3b8;
          animation: typing 1.4s infinite;
        }

        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-10px);
          }
        }

        .chatbot-input {
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          gap: 8px;
        }

        .chatbot-input input {
          flex: 1;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          outline: none;
        }

        .chatbot-input input:focus {
          border-color: ${WIDGET_CONFIG.theme === 'blue' ? '#0052cc' : '#22c55e'};
        }

        .chatbot-send {
          background: ${WIDGET_CONFIG.theme === 'blue' ? '#0052cc' : '#22c55e'};
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .chatbot-send:hover {
          transform: scale(1.05);
        }

        .chatbot-send svg {
          width: 16px;
          height: 16px;
          fill: white;
        }

        .chatbot-send:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .powered-by {
          text-align: center;
          padding: 8px;
          font-size: 11px;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
        }

        .powered-by a {
          color: ${WIDGET_CONFIG.theme === 'blue' ? '#0052cc' : '#22c55e'};
          text-decoration: none;
        }
      </style>

      <button class="chatbot-trigger" onclick="toggleChatbot()">
        <svg viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </button>

      <div class="chatbot-window" id="chatbot-window">
        <div class="chatbot-header">
          <h3>${WIDGET_CONFIG.title}</h3>
          <button class="chatbot-close" onclick="toggleChatbot()">×</button>
        </div>
        <div class="chatbot-messages" id="chatbot-messages">
          <div class="message bot">
            ${WIDGET_CONFIG.greeting}
          </div>
        </div>
        <div class="chatbot-input">
          <input 
            type="text" 
            id="chatbot-input" 
            placeholder="Type your message..."
            onkeypress="handleKeyPress(event)"
          />
          <button class="chatbot-send" onclick="sendMessage()" id="send-button">
            <svg viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div class="powered-by">
          Powered by <a href="#" target="_blank">Insurance Assistant</a>
        </div>
      </div>
    `;

    document.body.appendChild(widgetContainer);
    initializeConversation();
  }

  // Initialize conversation
  function initializeConversation() {
    // Try to restore existing conversation from localStorage
    const storageKey = 'chatbot_conversation_' + WIDGET_CONFIG.widgetId;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      try {
        const data = JSON.parse(stored);
        conversationId = data.conversationId;
        messages = data.messages || [];
        userInfo = data.userInfo || { name: null, email: null, phone: null };

        // Restore messages to UI
        const messagesContainer = document.getElementById('chatbot-messages');
        if (messagesContainer && messages.length > 0) {
          messagesContainer.innerHTML = '';
          messages.forEach((msg) => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.role}`;
            messageDiv.textContent = msg.content;
            messagesContainer.appendChild(messageDiv);
          });
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        console.log('📝 Restored conversation:', conversationId);
      } catch (e) {
        console.error('Failed to restore conversation:', e);
        startNewConversation();
      }
    } else {
      startNewConversation();
    }
  }

  function startNewConversation() {
    conversationId = 'widget_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    messages = [{
      role: 'bot',
      content: WIDGET_CONFIG.greeting,
      timestamp: new Date()
    }];
    userInfo = { name: null, email: null, phone: null };
    saveConversation();
    console.log('🆕 Started new conversation:', conversationId);
  }

  function saveConversation() {
    const storageKey = 'chatbot_conversation_' + WIDGET_CONFIG.widgetId;
    const data = {
      conversationId: conversationId,
      messages: messages,
      userInfo: userInfo,
      lastUpdate: new Date().toISOString()
    };
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  // Toggle chatbot window
  window.toggleChatbot = function() {
    const window = document.getElementById('chatbot-window');
    isOpen = !isOpen;
    
    if (isOpen) {
      window.classList.add('open');
      document.getElementById('chatbot-input').focus();
    } else {
      window.classList.remove('open');
    }
  };

  // Handle key press
  window.handleKeyPress = function(event) {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  // Send message
  window.sendMessage = async function() {
    const input = document.getElementById('chatbot-input');
    const messageText = input.value.trim();
    
    if (!messageText) return;

    // Add user message
    addMessage('user', messageText);
    input.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
      // Send to API
      const response = await fetch(`${WIDGET_CONFIG.apiBaseUrl}/widget-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversationId: conversationId,
          widgetId: WIDGET_CONFIG.widgetId,
          url: window.location.href,
          domain: window.location.hostname
        })
      });

      const data = await response.json();

      // Remove typing indicator
      removeTypingIndicator();

      // Add bot response
      addMessage('bot', data.response || data.message || 'Sorry, I encountered an error. Please try again.');

      // Handle escalation if needed
      if (data.shouldEscalate) {
        setTimeout(() => {
          addMessage('bot', 'I\'ve notified our team. An agent will contact you shortly. Is there anything else I can help you with?');
        }, 1000);
      }

    } catch (error) {
      console.error('Chatbot error:', error);
      removeTypingIndicator();
      addMessage('bot', 'Sorry, I\'m having trouble connecting. Please try again later.');
    }
  };

  // Add message to chat
  function addMessage(role, content) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.textContent = content;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    messages.push({
      role: role,
      content: content,
      timestamp: new Date()
    });

    // Save conversation to localStorage after each message
    saveConversation();
  }

  // Show typing indicator
  function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message typing';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // Disable send button
    document.getElementById('send-button').disabled = true;
  }

  // Remove typing indicator
  function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }

    // Enable send button
    document.getElementById('send-button').disabled = false;
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  // Expose widget API
  window.InsuranceChatbot = {
    open: function() {
      if (!isOpen) toggleChatbot();
    },
    close: function() {
      if (isOpen) toggleChatbot();
    },
    sendMessage: function(message) {
      if (message) {
        document.getElementById('chatbot-input').value = message;
        sendMessage();
      }
    },
    getConversation: function() {
      return messages;
    }
  };

})();