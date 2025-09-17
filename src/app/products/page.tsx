'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProductCard from '@/components/products/ProductCard';
import CreateProductModal from '@/components/products/CreateProductModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { Product, InsuranceType } from '@/types';
import { 
  Search, 
  Plus, 
  Package, 
  ToggleLeft,
  ToggleRight,
  Filter
} from 'lucide-react';

export default function ProductsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InsuranceType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  const queryClient = useQueryClient();

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products', { search: searchTerm, type: typeFilter, status: statusFilter }],
    queryFn: () => productsApi.getAll({
      search: searchTerm,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'active',
      limit: 50,
      sortBy: 'name',
      sortOrder: 'asc'
    }).then(res => res.data),
  });

  const createProductMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const handleCreateProduct = async (data: any) => {
    await createProductMutation.mutateAsync(data);
  };

  const handleToggleStatus = (product: Product) => {
    updateProductMutation.mutate({
      id: product.id,
      data: { ...product, isActive: !product.isActive }
    });
  };

  const products = productsResponse?.data || [];

  const getProductStats = () => {
    const total = products.length;
    const active = products.filter(p => p.isActive).length;
    const inactive = products.filter(p => !p.isActive).length;
    
    const typeStats = products.reduce((acc, product) => {
      acc[product.type] = (acc[product.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, active, inactive, typeStats };
  };

  const productStats = getProductStats();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="jira-page-content">
        <div className="jira-page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Product Management</h1>
              <p className="text-gray-600 mt-1">Manage insurance products and offerings</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="jira-button-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Product
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{productStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="jira-stat-card">
            <div className="flex items-center">
              <ToggleRight className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{productStats.active}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <ToggleLeft className="w-8 h-8 text-gray-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">{productStats.inactive}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="jira-content-card p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              {Object.values(InsuranceType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {Object.keys(productStats.typeStats).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(productStats.typeStats).map(([type, count]) => (
                <span key={type} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {type}: {count}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {products.length === 0 ? (
            <div className="col-span-full jira-content-card p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first product to get started.'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Product
              </button>
            </div>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => console.log('Edit:', product.id)}
                onView={() => console.log('View:', product.id)}
                onToggleStatus={() => handleToggleStatus(product)}
              />
            ))
          )}
        </div>

        <CreateProductModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProduct}
          isLoading={createProductMutation.isPending}
        />
      </div>
    </DashboardLayout>
  );
}