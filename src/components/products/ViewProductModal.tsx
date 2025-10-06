'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Package, DollarSign, Calendar, Tag, CheckCircle, XCircle } from 'lucide-react';
import { Product, InsuranceType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

const getTypeColor = (type: InsuranceType) => {
  const colors: Record<InsuranceType, string> = {
    [InsuranceType.AUTO]: 'bg-blue-100 text-blue-700 border-blue-200',
    [InsuranceType.LIFE]: 'bg-purple-100 text-purple-700 border-purple-200',
    [InsuranceType.HEALTH]: 'bg-green-100 text-green-700 border-green-200',
    [InsuranceType.HOME]: 'bg-orange-100 text-orange-700 border-orange-200',
    [InsuranceType.BUSINESS]: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    [InsuranceType.TRAVEL]: 'bg-pink-100 text-pink-700 border-pink-200',
    [InsuranceType.OTHER]: 'bg-gray-100 text-gray-700 border-gray-200',
  };
  return colors[type] || 'bg-gray-100 text-gray-700 border-gray-200';
};

export default function ViewProductModal({ isOpen, onClose, product }: ViewProductModalProps) {
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
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${getTypeColor(product.type)}`}>
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <Dialog.Title className="text-xl font-bold text-gray-900">
                        {product.name}
                      </Dialog.Title>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${getTypeColor(product.type)}`}>
                          <Tag className="w-3 h-3 mr-1" />
                          {product.type}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {product.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
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
                  {/* Description */}
                  {product.description && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Description</h3>
                      <p className="text-gray-700">{product.description}</p>
                    </div>
                  )}

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Base Price */}
                    {product.basePrice && (
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">Base Price</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(product.basePrice)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Created Date */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Created</p>
                          <p className="text-lg font-semibold text-gray-900">{formatDate(product.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  {product.features && Object.keys(product.features).length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Key Features</h3>
                      <div className="grid grid-cols-3 gap-3">
                        {Object.entries(product.features).map(([key, value], index) => (
                          <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-semibold text-blue-900 mb-1">{key}</p>
                            <p className="text-sm text-blue-700">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Metadata</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Product ID</p>
                        <p className="font-mono text-gray-900 text-xs mt-1">{product.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Last Updated</p>
                        <p className="font-medium text-gray-900 mt-1">{formatDate(product.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Close
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
