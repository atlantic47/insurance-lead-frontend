'use client';

import { Product, InsuranceType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Edit, Eye, ToggleLeft, ToggleRight, MoreVertical, Trash2 } from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'list';
  onEdit: () => void;
  onView: () => void;
  onToggleStatus: () => void;
}

const getInsuranceTypeColor = (type: InsuranceType) => {
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

export default function ProductCard({ product, viewMode = 'grid', onEdit, onView, onToggleStatus }: ProductCardProps) {
  if (viewMode === 'list') {
    return (
      <div className={`bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all ${
        !product.isActive ? 'opacity-60' : ''
      }`}>
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 border ${getInsuranceTypeColor(product.type)}`}>
            <Package className="w-7 h-7" />
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getInsuranceTypeColor(product.type)}`}>
                {product.type}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {product.description && (
              <p className="text-sm text-gray-600 line-clamp-1 mb-2">{product.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {product.basePrice && (
                <span className="font-semibold text-gray-900">{formatCurrency(product.basePrice)}</span>
              )}
              <span>Created: {formatDate(product.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onView}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="View details"
            >
              <Eye className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onEdit}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit product"
            >
              <Edit className="w-5 h-5 text-blue-600" />
            </button>
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-gray-200">
                  <div className="p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={onToggleStatus}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-md`}
                        >
                          {product.isActive ? <ToggleLeft className="mr-3 h-4 w-4" /> : <ToggleRight className="mr-3 h-4 w-4" />}
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all ${
      !product.isActive ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${getInsuranceTypeColor(product.type)}`}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getInsuranceTypeColor(product.type)}`}>
              {product.type}
            </span>
          </div>
        </div>

        <Menu as="div" className="relative">
          <Menu.Button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-gray-200">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onView}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-md`}
                    >
                      <Eye className="mr-3 h-4 w-4" />
                      View Details
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onEdit}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-md`}
                    >
                      <Edit className="mr-3 h-4 w-4" />
                      Edit Product
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onToggleStatus}
                      className={`${
                        active ? 'bg-gray-50' : ''
                      } group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-md`}
                    >
                      {product.isActive ? <ToggleLeft className="mr-3 h-4 w-4" /> : <ToggleRight className="mr-3 h-4 w-4" />}
                      {product.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {product.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {product.description}
        </p>
      )}

      <div className="space-y-3 mb-4">
        {product.basePrice && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Base Price:</span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(product.basePrice)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Status:</span>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
            product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Created:</span>
          <span>{formatDate(product.createdAt)}</span>
        </div>
      </div>

      {product.features && Object.keys(product.features).length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">Key Features</h4>
          <div className="flex flex-wrap gap-1.5">
            {Object.keys(product.features).slice(0, 3).map((feature, index) => (
              <span key={index} className="inline-flex px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-md border border-blue-100 font-medium">
                {feature}
              </span>
            ))}
            {Object.keys(product.features).length > 3 && (
              <span className="inline-flex px-2.5 py-1 text-xs bg-gray-50 text-gray-600 rounded-md border border-gray-200 font-medium">
                +{Object.keys(product.features).length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
