'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  X, Save, Eye, Code, Smartphone, Monitor, Tablet,
  Type, Image as ImageIcon, Square, Columns, Layout,
  GripVertical, Trash2, Edit3, Plus, Download, Mail,
  AlignLeft, Palette, Settings, Undo, Redo
} from 'lucide-react';

interface Block {
  id: string;
  type: string;
  content: string;
  styles?: Record<string, string>;
  selected?: boolean;
}

interface EmailBuilderProps {
  initialHtml?: string;
  initialName?: string;
  initialSubject?: string;
  initialDescription?: string;
  onSave: (data: { name: string; subject: string; description: string; htmlContent: string; content: string }) => void;
  onClose: () => void;
}

function SortableBlock({ block, onEdit, onDelete, isSelected, onSelect }: {
  block: Block;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(block.content);

  const handleSave = () => {
    onEdit(block.id, editContent);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(block.id)}
      className={`group relative bg-white rounded-xl mb-4 transition-all ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg'
          : 'border border-gray-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      {/* Drag Handle */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <div {...attributes} {...listeners} className="cursor-move bg-gradient-to-br from-gray-700 to-gray-800 text-white p-2 rounded-lg shadow-lg hover:from-gray-600 hover:to-gray-700">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Top Action Bar */}
      {isSelected && (
        <div className="absolute -top-11 left-0 right-0 flex items-center justify-end gap-2 px-3 py-2 bg-white border border-gray-200 rounded-t-xl shadow-sm">
          <span className="text-xs text-gray-500 mr-auto font-medium">{block.type.toUpperCase()}</span>
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }}
            className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
            className="p-1.5 hover:bg-red-50 rounded-md text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
          <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Edit Content</label>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-3 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              Save Changes
            </button>
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="p-5" dangerouslySetInnerHTML={{ __html: block.content }} />
      )}
    </div>
  );
}

export default function EmailBuilder({
  initialHtml = '',
  initialName = '',
  initialSubject = '',
  initialDescription = '',
  onSave,
  onClose,
}: EmailBuilderProps) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState(initialDescription);
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  const contentBlocks = [
    { icon: Type, label: 'Text', type: 'text', template: '<p style="font-family: Arial, sans-serif; color: #333; font-size: 16px; line-height: 1.6; margin: 0;">Click edit to change this text. Use {firstName} or {lastName} for personalization.</p>' },
    { icon: ImageIcon, label: 'Image', type: 'image', template: '<img src="https://via.placeholder.com/600x300/3b82f6/ffffff?text=Click+Edit+to+Change+Image" alt="Image" style="max-width: 100%; height: auto; display: block;" />' },
    { icon: Square, label: 'Button', type: 'button', template: '<a href="#" style="display: inline-block; padding: 14px 40px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-family: Arial, sans-serif;">Click Here</a>' },
    { icon: Columns, label: '2 Columns', type: 'columns', template: '<table width="100%" cellpadding="0" cellspacing="0"><tr><td style="width: 50%; padding: 10px; vertical-align: top;"><p style="margin: 0; color: #333; font-family: Arial;">Column 1</p></td><td style="width: 50%; padding: 10px; vertical-align: top;"><p style="margin: 0; color: #333; font-family: Arial;">Column 2</p></td></tr></table>' },
    { icon: Layout, label: 'Divider', type: 'divider', template: '<hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;" />' },
  ];

  const addBlock = (type: string, template: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: template,
    };
    setBlocks([...blocks, newBlock]);
  };

  const editBlock = (id: string, content: string) => {
    setBlocks(blocks.map(block => block.id === id ? { ...block, content } : block));
  };

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setBlocks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const generateHtml = () => {
    const blocksHtml = blocks.map(block => `<div style="padding: 20px;">${block.content}</div>`).join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff;">
          ${blocksHtml}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
  };

  const handleSave = () => {
    const htmlContent = generateHtml();
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

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-gray-100 z-[100] flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-600 group-hover:text-gray-900" />
          </button>
          <div className="h-8 w-px bg-gray-300" />
          <Mail className="w-5 h-5 text-blue-600" />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Template"
            className="text-lg font-semibold border-none focus:outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          {/* Device Preview */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-0.5">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'desktop'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Desktop View"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('tablet')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'tablet'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Tablet View"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-2 rounded-md transition-all ${
                viewMode === 'mobile'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="Mobile View"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-8 bg-gray-300" />

          <button
            onClick={() => setShowCode(!showCode)}
            className={`p-2 rounded-lg transition-all ${
              showCode
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="View Code"
          >
            <Code className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-gray-300" />

          <button
            onClick={handleSave}
            disabled={!name}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>
      </div>

      {/* Subject Bar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <AlignLeft className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email Subject Line"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Content Blocks */}
        <div className="w-72 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Content</h3>
              <Layout className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-2">
              {contentBlocks.map((block) => (
                <button
                  key={block.type}
                  onClick={() => addBlock(block.type, block.template)}
                  className="w-full flex items-center gap-3 p-3.5 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg group-hover:from-blue-100 group-hover:to-indigo-100 transition-all">
                    <block.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 flex-1 text-left">
                    {block.label}
                  </span>
                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Merge Fields</h3>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              {['firstName', 'lastName', 'email', 'phone'].map((v) => (
                <div
                  key={v}
                  className="px-3 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg text-xs hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <code className="text-blue-600 font-mono font-semibold">{`{${v}}`}</code>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Builder/Preview */}
        <div className="flex-1 overflow-auto">
          {showCode ? (
            <div className="p-6 h-full bg-gradient-to-br from-gray-900 to-gray-800">
              <div className="bg-gray-950 rounded-xl border border-gray-700 h-full overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700 bg-gray-900">
                  <span className="text-xs font-medium text-gray-400">HTML Output</span>
                  <button className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <textarea
                  value={generateHtml()}
                  readOnly
                  className="w-full h-[calc(100%-40px)] font-mono text-xs bg-transparent text-green-400 p-4 resize-none focus:outline-none"
                  style={{ fontFamily: 'Monaco, Consolas, monospace' }}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 min-h-full">
              <div
                style={{ width: deviceWidths[viewMode], margin: '0 auto', maxWidth: '100%' }}
                className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200"
              >
                {/* Email Preview Window */}
                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">{subject || 'Untitled Email'}</div>
                  <div className="text-xs text-gray-500 mt-1">Preview Mode • {viewMode}</div>
                </div>

                {/* Email Canvas */}
                <div className="p-8 bg-gray-50 min-h-[600px]">
                  {blocks.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 mb-4">
                        <Layout className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Start Building</h3>
                      <p className="text-gray-500 mb-1">Add content blocks from the left sidebar</p>
                      <p className="text-sm text-gray-400">Click the + button to add elements</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                          {blocks.map((block) => (
                            <SortableBlock
                              key={block.id}
                              block={block}
                              onEdit={editBlock}
                              onDelete={deleteBlock}
                              isSelected={selectedBlockId === block.id}
                              onSelect={setSelectedBlockId}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Properties */}
        <div className="w-80 border-l border-gray-200 bg-white overflow-y-auto">
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Settings</h3>
              <Settings className="w-4 h-4 text-gray-400" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2.5">Email Width</label>
                <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option>600px (Recommended)</option>
                  <option>650px</option>
                  <option>700px</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2.5">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    className="w-12 h-12 rounded-lg cursor-pointer border border-gray-300 shadow-sm"
                    defaultValue="#f4f4f4"
                  />
                  <input
                    type="text"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue="#f4f4f4"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2.5">Typography</label>
                <select className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                  <option>Arial, sans-serif</option>
                  <option>Helvetica, sans-serif</option>
                  <option>Georgia, serif</option>
                  <option>Times New Roman, serif</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Style</h3>
              <Palette className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 rounded-xl text-sm font-medium text-blue-700 transition-all shadow-sm">
                <Palette className="w-4 h-4" />
                Color Palette
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-all">
                <Type className="w-4 h-4" />
                Text Styles
              </button>
            </div>
          </div>

          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</h3>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all">
                <span>Export HTML</span>
                <Download className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setShowCode(true)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-all"
              >
                <span>View Code</span>
                <Code className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Pro Tips</h3>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
              <ul className="text-xs text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Keep email width at 600px for best compatibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Always use inline CSS for styling</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Test across multiple email clients</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Add descriptive alt text to images</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
