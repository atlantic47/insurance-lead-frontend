'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Code, Eye, Monitor, Smartphone, Tablet, X, Save, Sparkles } from 'lucide-react';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('react-monaco-editor'), { ssr: false });

interface HtmlTemplateEditorProps {
  initialHtml?: string;
  initialName?: string;
  initialSubject?: string;
  initialDescription?: string;
  onSave: (data: { name: string; subject: string; description: string; htmlContent: string; content: string }) => void;
  onClose: () => void;
}

export default function HtmlTemplateEditor({
  initialHtml = '',
  initialName = '',
  initialSubject = '',
  initialDescription = '',
  onSave,
  onClose,
}: HtmlTemplateEditorProps) {
  const [htmlContent, setHtmlContent] = useState(initialHtml);
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState(initialDescription);
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'split'>('split');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showVariables, setShowVariables] = useState(false);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const variables = [
    { name: 'firstName', description: 'Lead first name' },
    { name: 'lastName', description: 'Lead last name' },
    { name: 'email', description: 'Lead email address' },
    { name: 'phone', description: 'Lead phone number' },
    { name: 'companyName', description: 'Your company name' },
    { name: 'policyNumber', description: 'Policy number' },
    { name: 'expirationDate', description: 'Policy expiration date' },
    { name: 'renewalAmount', description: 'Renewal amount' },
  ];

  const insertVariable = (varName: string) => {
    const variable = `{${varName}}`;
    setHtmlContent(prev => prev + variable);
  };

  const handleSave = () => {
    // Extract plain text from HTML for content field
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    onSave({
      name,
      subject,
      description,
      htmlContent,
      content: plainText.substring(0, 500),
    });
  };

  const sampleData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    companyName: 'Acme Insurance',
    policyNumber: 'POL-2025-001',
    expirationDate: '2025-12-31',
    renewalAmount: '$299.99',
  };

  const renderPreview = () => {
    let preview = htmlContent;
    Object.entries(sampleData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return preview;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Template Name"
                className="bg-gray-700 text-white px-3 py-1.5 rounded text-lg font-semibold border-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="bg-transparent text-gray-400 px-3 py-1 text-sm border-none focus:ring-0 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('code')}
                className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                  viewMode === 'code' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Code className="w-4 h-4" />
                <span className="text-sm">Code</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                  viewMode === 'split' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4" />
                <span className="text-sm">Split</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1.5 rounded flex items-center space-x-2 transition-colors ${
                  viewMode === 'preview' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">Preview</span>
              </button>
            </div>

            {/* Device Toggle (Preview Mode) */}
            {viewMode !== 'code' && (
              <div className="flex bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    previewDevice === 'desktop' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    previewDevice === 'tablet' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    previewDevice === 'mobile' ? 'bg-gray-600 text-white' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!name || !htmlContent}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Template</span>
            </button>
          </div>
        </div>

        {/* Subject Line */}
        <div className="mt-3">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email Subject Line"
            className="w-full bg-gray-700 text-white px-4 py-2 rounded border-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Variables */}
        <div className={`bg-gray-800 border-r border-gray-700 transition-all duration-300 ${showVariables ? 'w-64' : 'w-12'}`}>
          <div className="h-full flex flex-col">
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="p-3 hover:bg-gray-700 transition-colors border-b border-gray-700"
            >
              <Sparkles className="w-5 h-5 text-gray-400" />
            </button>

            {showVariables && (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Variables</h3>
                <div className="space-y-2">
                  {variables.map((variable) => (
                    <button
                      key={variable.name}
                      onClick={() => insertVariable(variable.name)}
                      className="w-full text-left p-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors group"
                    >
                      <code className="text-xs text-blue-400">{`{${variable.name}}`}</code>
                      <p className="text-xs text-gray-400 mt-1">{variable.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} flex flex-col bg-gray-900`}>
            <div className="flex-1">
              <MonacoEditor
                language="html"
                theme="vs-dark"
                value={htmlContent}
                onChange={(value) => setHtmlContent(value || '')}
                options={{
                  minimap: { enabled: true },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          </div>
        )}

        {/* Preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'flex-1'} bg-gray-100 flex flex-col`}>
            <div className="bg-gray-200 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
              <span className="text-sm text-gray-600 font-medium">
                Preview ({previewDevice})
              </span>
              <span className="text-xs text-gray-500">
                Using sample data for variables
              </span>
            </div>
            <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
              <div
                style={{
                  width: deviceWidths[previewDevice],
                  maxWidth: '100%',
                }}
                className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
              >
                <iframe
                  srcDoc={renderPreview()}
                  className="w-full h-[800px] border-none"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
