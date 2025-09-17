'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link,
  Image,
  Type,
  Palette,
  Undo,
  Redo,
  Quote,
  Code,
  Strikethrough,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Type your message...", 
  className = "",
  minHeight = "200px" 
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertImage = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        executeCommand('insertImage', imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  }, [executeCommand]);

  const insertLink = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setLinkText(selection.toString());
    }
    setIsLinkModalOpen(true);
  }, []);

  const applyLink = useCallback(() => {
    if (linkUrl) {
      executeCommand('createLink', linkUrl);
      setIsLinkModalOpen(false);
      setLinkUrl('');
      setLinkText('');
    }
  }, [linkUrl, executeCommand]);

  const formatButtons = [
    { command: 'bold', icon: Bold, title: 'Bold (Ctrl+B)' },
    { command: 'italic', icon: Italic, title: 'Italic (Ctrl+I)' },
    { command: 'underline', icon: Underline, title: 'Underline (Ctrl+U)' },
    { command: 'strikeThrough', icon: Strikethrough, title: 'Strikethrough' },
  ];

  const alignButtons = [
    { command: 'justifyLeft', icon: AlignLeft, title: 'Align Left' },
    { command: 'justifyCenter', icon: AlignCenter, title: 'Align Center' },
    { command: 'justifyRight', icon: AlignRight, title: 'Align Right' },
  ];

  const listButtons = [
    { command: 'insertUnorderedList', icon: List, title: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, title: 'Numbered List' },
  ];

  const actionButtons = [
    { command: 'undo', icon: Undo, title: 'Undo (Ctrl+Z)' },
    { command: 'redo', icon: Redo, title: 'Redo (Ctrl+Y)' },
  ];

  const fontSizes = [
    { value: '1', label: 'Small' },
    { value: '3', label: 'Normal' },
    { value: '5', label: 'Large' },
    { value: '7', label: 'Extra Large' },
  ];

  const textColors = [
    '#000000', '#333333', '#666666', '#999999',
    '#FF0000', '#FF6600', '#FFCC00', '#33CC00',
    '#0066CC', '#6600CC', '#CC0066', '#FFFFFF'
  ];

  return (
    <div className={`border border-neutral-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-neutral-200 bg-neutral-50 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {/* Undo/Redo */}
          <div className="flex items-center border-r border-neutral-300 pr-2 mr-2">
            {actionButtons.map(({ command, icon: Icon, title }) => (
              <button
                key={command}
                onClick={() => executeCommand(command)}
                className="p-2 hover:bg-neutral-200 rounded transition-colors"
                title={title}
                type="button"
              >
                <Icon className="w-4 h-4 text-neutral-600" />
              </button>
            ))}
          </div>

          {/* Font Size */}
          <div className="flex items-center border-r border-neutral-300 pr-2 mr-2">
            <select
              onChange={(e) => executeCommand('fontSize', e.target.value)}
              className="px-2 py-1 text-sm border-0 bg-transparent focus:outline-none"
              defaultValue="3"
            >
              {fontSizes.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center border-r border-neutral-300 pr-2 mr-2">
            {formatButtons.map(({ command, icon: Icon, title }) => (
              <button
                key={command}
                onClick={() => executeCommand(command)}
                className="p-2 hover:bg-neutral-200 rounded transition-colors"
                title={title}
                type="button"
              >
                <Icon className="w-4 h-4 text-neutral-600" />
              </button>
            ))}
          </div>

          {/* Text Color */}
          <div className="flex items-center border-r border-neutral-300 pr-2 mr-2">
            <div className="relative group">
              <button
                className="p-2 hover:bg-neutral-200 rounded transition-colors"
                title="Text Color"
                type="button"
              >
                <Palette className="w-4 h-4 text-neutral-600" />
              </button>
              <div className="absolute top-full left-0 mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <div className="grid grid-cols-4 gap-1">
                  {textColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => executeCommand('foreColor', color)}
                      className="w-6 h-6 rounded border border-neutral-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Alignment */}
          <div className="flex items-center border-r border-neutral-300 pr-2 mr-2">
            {alignButtons.map(({ command, icon: Icon, title }) => (
              <button
                key={command}
                onClick={() => executeCommand(command)}
                className="p-2 hover:bg-neutral-200 rounded transition-colors"
                title={title}
                type="button"
              >
                <Icon className="w-4 h-4 text-neutral-600" />
              </button>
            ))}
          </div>

          {/* Lists */}
          <div className="flex items-center border-r border-neutral-300 pr-2 mr-2">
            {listButtons.map(({ command, icon: Icon, title }) => (
              <button
                key={command}
                onClick={() => executeCommand(command)}
                className="p-2 hover:bg-neutral-200 rounded transition-colors"
                title={title}
                type="button"
              >
                <Icon className="w-4 h-4 text-neutral-600" />
              </button>
            ))}
          </div>

          {/* Quote & Code */}
          <div className="flex items-center border-r border-neutral-300 pr-2 mr-2">
            <button
              onClick={() => executeCommand('formatBlock', 'blockquote')}
              className="p-2 hover:bg-neutral-200 rounded transition-colors"
              title="Quote"
              type="button"
            >
              <Quote className="w-4 h-4 text-neutral-600" />
            </button>
            <button
              onClick={() => executeCommand('formatBlock', 'pre')}
              className="p-2 hover:bg-neutral-200 rounded transition-colors"
              title="Code Block"
              type="button"
            >
              <Code className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* Insert Tools */}
          <div className="flex items-center">
            <button
              onClick={insertLink}
              className="p-2 hover:bg-neutral-200 rounded transition-colors"
              title="Insert Link"
              type="button"
            >
              <Link className="w-4 h-4 text-neutral-600" />
            </button>
            <button
              onClick={insertImage}
              className="p-2 hover:bg-neutral-200 rounded transition-colors"
              title="Insert Image"
              type="button"
            >
              <Image className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        className="p-4 focus:outline-none prose prose-neutral max-w-none"
        style={{ minHeight }}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder}
      />

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Link Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card w-full max-w-md mx-4">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-900">Insert Link</h3>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Link text"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>
            </div>
            <div className="card-footer">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setIsLinkModalOpen(false)}
                  className="btn btn-secondary"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={applyLink}
                  disabled={!linkUrl}
                  className="btn btn-primary"
                  type="button"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 8px 0;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #6b7280;
        }
        
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          overflow-x: auto;
        }
        
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 24px;
          margin: 8px 0;
        }
        
        [contenteditable] li {
          margin: 4px 0;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;