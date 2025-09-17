'use client';

import { Product, InsuranceType } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Package, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onEdit: () => void;
  onView: () => void;
  onToggleStatus: () => void;
}

const getInsuranceTypeColor = (type: InsuranceType) => {
  switch (type) {
    case InsuranceType.LIFE:
      return 'bg-blue-100 text-blue-800';
    case InsuranceType.HEALTH:
      return 'bg-green-100 text-green-800';
    case InsuranceType.AUTO:
      return 'bg-red-100 text-red-800';
    case InsuranceType.HOME:
      return 'bg-yellow-100 text-yellow-800';
    case InsuranceType.BUSINESS:
      return 'bg-purple-100 text-purple-800';
    case InsuranceType.TRAVEL:
      return 'bg-pink-100 text-pink-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function ProductCard({ product, onEdit, onView, onToggleStatus }: ProductCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
      !product.isActive ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-full ${getInsuranceTypeColor(product.type)}`}>
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getInsuranceTypeColor(product.type)}`}>
              {product.type}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onToggleStatus}
            className={`p-1 rounded ${product.isActive ? 'text-green-600' : 'text-gray-400'}`}
            title={product.isActive ? 'Deactivate product' : 'Activate product'}
          >
            {product.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          </button>
          <button
            onClick={onView}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="View details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-600"
            title="Edit product"
          >
            <Edit size={18} />
          </button>
        </div>
      </div>

      {product.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
          {product.description}
        </p>
      )}

      <div className="space-y-2">
        {product.basePrice && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Base Price:</span>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(product.basePrice)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Status:</span>
          <span className={`text-sm font-medium ${product.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>Created:</span>
          <span>{formatDate(product.createdAt)}</span>
        </div>
      </div>

      {product.features && Object.keys(product.features).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features:</h4>
          <div className="flex flex-wrap gap-1">
            {Object.keys(product.features).slice(0, 3).map((feature, index) => (
              <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                {feature}
              </span>
            ))}
            {Object.keys(product.features).length > 3 && (
              <span className="inline-flex px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded">
                +{Object.keys(product.features).length - 3} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}