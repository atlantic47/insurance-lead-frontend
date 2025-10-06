'use client';

import { useState } from 'react';
import {
  X, Save, Eye, Code, Smartphone, Monitor, Tablet,
  Type, Image as ImageIcon, Layout, Square, Columns, Mail,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Link as LinkIcon, Palette, Settings, Undo, Redo, Download
} from 'lucide-react';

interface EmailTemplateEditorProps {
  initialHtml?: string;
  initialName?: string;
  initialSubject?: string;
  initialDescription?: string;
  onSave: (data: { name: string; subject: string; description: string; htmlContent: string; content: string }) => void;
  onClose: () => void;
}

export default function EmailTemplateEditor({
  initialHtml = '',
  initialName = '',
  initialSubject = '',
  initialDescription = '',
  onSave,
  onClose,
}: EmailTemplateEditorProps) {
  const [htmlContent, setHtmlContent] = useState(initialHtml);
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState(initialDescription);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [showSettings, setShowSettings] = useState(true);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const handleSave = () => {
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

  const contentBlocks = [
    { icon: Type, label: 'Text', type: 'text' },
    { icon: ImageIcon, label: 'Image', type: 'image' },
    { icon: Square, label: 'Button', type: 'button' },
    { icon: Columns, label: 'Columns', type: 'columns' },
    { icon: Layout, label: 'Divider', type: 'divider' },
    { icon: Mail, label: 'Social', type: 'social' },
  ];

  const insertBlock = (type: string) => {
    let blockHtml = '';

    switch(type) {
      case 'text':
        blockHtml = `
<div style="padding: 20px; font-family: Arial, sans-serif;">
  <p style="margin: 0; color: #333; font-size: 16px; line-height: 1.6;">
    Click to edit this text. Use variables like {firstName} or {lastName}.
  </p>
</div>`;
        break;
      case 'image':
        blockHtml = `
<div style="padding: 20px; text-align: center;">
  <img src="https://via.placeholder.com/600x300" alt="Image" style="max-width: 100%; height: auto;" />
</div>`;
        break;
      case 'button':
        blockHtml = `
<div style="padding: 20px; text-align: center;">
  <a href="#" style="display: inline-block; padding: 14px 40px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">
    Click Here
  </a>
</div>`;
        break;
      case 'columns':
        blockHtml = `
<table width="100%" cellpadding="0" cellspacing="0" style="padding: 20px;">
  <tr>
    <td style="width: 50%; padding: 10px; vertical-align: top;">
      <p style="margin: 0; color: #333;">Column 1 content</p>
    </td>
    <td style="width: 50%; padding: 10px; vertical-align: top;">
      <p style="margin: 0; color: #333;">Column 2 content</p>
    </td>
  </tr>
</table>`;
        break;
      case 'divider':
        blockHtml = `
<div style="padding: 20px;">
  <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 10px 0;" />
</div>`;
        break;
      case 'social':
        blockHtml = `
<div style="padding: 20px; text-align: center;">
  <a href="#" style="display: inline-block; margin: 0 10px;">
    <img src="https://via.placeholder.com/32" alt="Facebook" width="32" height="32" />
  </a>
  <a href="#" style="display: inline-block; margin: 0 10px;">
    <img src="https://via.placeholder.com/32" alt="Twitter" width="32" height="32" />
  </a>
  <a href="#" style="display: inline-block; margin: 0 10px;">
    <img src="https://via.placeholder.com/32" alt="LinkedIn" width="32" height="32" />
  </a>
</div>`;
        break;
    }

    setHtmlContent(prev => prev + blockHtml);
  };

  return (
    <div className="fixed inset-0 left-0 right-0 top-0 bottom-0 bg-white z-[100] flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
          <div className="h-8 w-px bg-gray-300" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template Name"
            className="text-lg font-semibold border-none focus:outline-none focus:ring-0 text-gray-900"
          />
        </div>

        <div className="flex items-center space-x-3">
          {/* Device Preview Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'tablet' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="h-8 w-px bg-gray-300" />

          <button
            onClick={() => setShowCode(!showCode)}
            className={`p-2 rounded-lg transition-colors ${
              showCode ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Code className="w-5 h-5" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
            <Download className="w-5 h-5" />
          </button>

          <div className="h-8 w-px bg-gray-300" />

          <button
            onClick={handleSave}
            disabled={!name}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            Save Template
          </button>
        </div>
      </div>

      {/* Subject Line */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email Subject Line"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Content Blocks */}
        {showSettings && (
          <div className="w-72 border-r border-gray-200 bg-white overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">CONTENT</h3>
              <div className="grid grid-cols-2 gap-3">
                {contentBlocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => insertBlock(block.type)}
                    className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <block.icon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 mb-2" />
                    <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600">{block.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">VARIABLES</h3>
                <div className="space-y-2">
                  {['firstName', 'lastName', 'email', 'phone', 'companyName'].map((variable) => (
                    <button
                      key={variable}
                      onClick={() => setHtmlContent(prev => prev + `{${variable}}`)}
                      className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-blue-50 rounded-lg transition-colors group"
                    >
                      <code className="text-xs text-blue-600 font-mono">{`{${variable}}`}</code>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">PREDEFINED TEMPLATES</h3>
                <div className="space-y-2">
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                    <div className="text-sm font-medium text-gray-900">Welcome Email</div>
                    <div className="text-xs text-gray-500 mt-1">Professional gradient</div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                    <div className="text-sm font-medium text-gray-900">Policy Quote</div>
                    <div className="text-xs text-gray-500 mt-1">Banking style</div>
                  </button>
                  <button className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left">
                    <div className="text-sm font-medium text-gray-900">Thank You</div>
                    <div className="text-xs text-gray-500 mt-1">Elegant design</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center - Editor/Preview */}
        <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden">
          {showCode ? (
            <div className="flex-1 p-6">
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                className="w-full h-full font-mono text-sm border border-gray-300 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Enter your HTML code here..."
              />
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-8">
              <div className="max-w-4xl mx-auto">
                <div
                  style={{
                    width: deviceWidths[viewMode],
                    margin: '0 auto',
                    maxWidth: '100%',
                  }}
                  className="bg-white shadow-2xl rounded-lg overflow-hidden transition-all duration-300"
                >
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                    <div className="text-sm opacity-90">Preview Mode</div>
                    <div className="font-semibold">{subject || 'Email Subject'}</div>
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: htmlContent || '<div style="padding: 40px; text-align: center; color: #9ca3af;">Drag and drop content blocks from the left sidebar to start building your email template</div>' }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties (Optional) */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">PROPERTIES</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Background Color</label>
              <div className="flex items-center space-x-2">
                <input type="color" className="w-10 h-10 rounded cursor-pointer" defaultValue="#ffffff" />
                <input type="text" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" defaultValue="#ffffff" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Font Family</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option>Arial</option>
                <option>Helvetica</option>
                <option>Georgia</option>
                <option>Times New Roman</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Text Align</label>
              <div className="flex space-x-2">
                <button className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-50">
                  <AlignLeft className="w-4 h-4 mx-auto" />
                </button>
                <button className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-50">
                  <AlignCenter className="w-4 h-4 mx-auto" />
                </button>
                <button className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-50">
                  <AlignRight className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Padding</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" defaultValue="20" />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Border Radius</label>
              <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" defaultValue="0" />
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">TIPS</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-900 space-y-1">
                <div>• Use variables with curly braces</div>
                <div>• Inline CSS for compatibility</div>
                <div>• Test on multiple devices</div>
                <div>• Keep under 600px width</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
