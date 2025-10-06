'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Plus, Tags, Edit, Trash2, Save } from 'lucide-react';
import { InsuranceType } from '@/types';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

const defaultCategories: Category[] = [
  {
    id: 'auto',
    name: 'AUTO',
    description: 'Automobile insurance products',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '🚗'
  },
  {
    id: 'life',
    name: 'LIFE',
    description: 'Life insurance products',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: '❤️'
  },
  {
    id: 'health',
    name: 'HEALTH',
    description: 'Health insurance products',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: '🏥'
  },
  {
    id: 'home',
    name: 'HOME',
    description: 'Home insurance products',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: '🏠'
  },
  {
    id: 'business',
    name: 'BUSINESS',
    description: 'Business insurance products',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: '💼'
  },
  {
    id: 'travel',
    name: 'TRAVEL',
    description: 'Travel insurance products',
    color: 'bg-pink-100 text-pink-700 border-pink-200',
    icon: '✈️'
  },
  {
    id: 'other',
    name: 'OTHER',
    description: 'Other insurance products',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: '📋'
  },
];

export default function ManageCategoriesModal({ isOpen, onClose }: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: '📦'
  });

  const colorOptions = [
    { value: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Blue' },
    { value: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Purple' },
    { value: 'bg-green-100 text-green-700 border-green-200', label: 'Green' },
    { value: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Orange' },
    { value: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Indigo' },
    { value: 'bg-pink-100 text-pink-700 border-pink-200', label: 'Pink' },
    { value: 'bg-red-100 text-red-700 border-red-200', label: 'Red' },
    { value: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Yellow' },
    { value: 'bg-teal-100 text-teal-700 border-teal-200', label: 'Teal' },
    { value: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Gray' },
  ];

  const iconOptions = ['🚗', '❤️', '🏥', '🏠', '💼', '✈️', '📋', '🛡️', '💰', '🌟', '📊', '🔑'];

  const handleAddCategory = () => {
    if (!newCategory.name.trim()) return;

    const category: Category = {
      id: newCategory.name.toLowerCase().replace(/\s+/g, '-'),
      ...newCategory,
      name: newCategory.name.toUpperCase(),
    };

    setCategories([...categories, category]);
    setNewCategory({ name: '', description: '', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📦' });
    setIsAddingNew(false);
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter(cat => cat.id !== id));
    }
  };

  const handleSave = () => {
    // Here you would save to backend
    console.log('Saving categories:', categories);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-40" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Tags className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Manage Product Categories
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">Add, edit, or remove insurance product categories</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Add New Button */}
                  {!isAddingNew && (
                    <button
                      onClick={() => setIsAddingNew(true)}
                      className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                    >
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                      <span className="font-medium text-gray-600 group-hover:text-blue-600">Add New Category</span>
                    </button>
                  )}

                  {/* Add New Form */}
                  {isAddingNew && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">New Category</h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Category Name</label>
                          <input
                            type="text"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="e.g., Pet Insurance"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Icon</label>
                          <select
                            value={newCategory.icon}
                            onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            {iconOptions.map((icon) => (
                              <option key={icon} value={icon}>{icon} {icon}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          placeholder="Brief description"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Color Theme</label>
                        <div className="grid grid-cols-5 gap-2">
                          {colorOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setNewCategory({ ...newCategory, color: option.value })}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                newCategory.color === option.value
                                  ? option.value + ' ring-2 ring-offset-2 ring-blue-500'
                                  : option.value
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddCategory}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Add Category
                        </button>
                        <button
                          onClick={() => setIsAddingNew(false)}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Categories List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="text-2xl">{category.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{category.name}</h4>
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${category.color}`}>
                              {category.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{category.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingId(category.id)}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit category"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete category"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Info Note */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      <strong>Note:</strong> Categories help organize your insurance products. Changes will be reflected across the system immediately.
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-sm flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
