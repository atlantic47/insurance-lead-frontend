'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, Package, Plus, Trash2 } from 'lucide-react';
import { Product, InsuranceType } from '@/types';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  product: Product;
  isLoading: boolean;
}

export default function EditProductModal({
  isOpen,
  onClose,
  onSubmit,
  product,
  isLoading,
}: EditProductModalProps) {
  const [formData, setFormData] = useState({
    name: product.name,
    description: product.description || '',
    type: product.type,
    basePrice: product.basePrice?.toString() || '',
    isActive: product.isActive,
  });

  const [features, setFeatures] = useState<Record<string, string>>(
    product.features as Record<string, string> || {}
  );

  const [newFeatureKey, setNewFeatureKey] = useState('');
  const [newFeatureValue, setNewFeatureValue] = useState('');

  useEffect(() => {
    setFormData({
      name: product.name,
      description: product.description || '',
      type: product.type,
      basePrice: product.basePrice?.toString() || '',
      isActive: product.isActive,
    });
    setFeatures(product.features as Record<string, string> || {});
  }, [product]);

  const handleAddFeature = () => {
    if (newFeatureKey.trim() && newFeatureValue.trim()) {
      setFeatures({ ...features, [newFeatureKey.trim()]: newFeatureValue.trim() });
      setNewFeatureKey('');
      setNewFeatureValue('');
    }
  };

  const handleRemoveFeature = (key: string) => {
    const updatedFeatures = { ...features };
    delete updatedFeatures[key];
    setFeatures(updatedFeatures);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      basePrice: formData.basePrice ? parseFloat(formData.basePrice) : null,
      features: Object.keys(features).length > 0 ? features : null,
    });
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Edit Product
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">Update product information</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-5">
                    {/* Product Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Comprehensive Auto Insurance"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Brief description of the product..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Insurance Type */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Insurance Type *
                        </label>
                        <select
                          required
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as InsuranceType })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                          {Object.values(InsuranceType).map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Base Price */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Base Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Key Features */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Key Features (Extras)
                      </label>

                      {/* Existing Features */}
                      <div className="space-y-2 mb-3">
                        {Object.entries(features).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <span className="text-sm font-medium text-blue-900">{key}</span>
                              <span className="text-sm text-blue-700">{value}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFeature(key)}
                              className="p-1.5 hover:bg-red-100 rounded-md text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add New Feature */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newFeatureKey}
                          onChange={(e) => setNewFeatureKey(e.target.value)}
                          placeholder="Feature name (e.g., coverage)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={newFeatureValue}
                          onChange={(e) => setNewFeatureValue(e.target.value)}
                          placeholder="Value (e.g., $100k)"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={handleAddFeature}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">Product Status</p>
                        <p className="text-sm text-gray-600">
                          {formData.isActive ? 'Product is active and visible' : 'Product is inactive and hidden'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
                    >
                      {isLoading ? 'Updating...' : 'Update Product'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
