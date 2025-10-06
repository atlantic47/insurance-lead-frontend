'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProductCard from '@/components/products/ProductCard';
import CreateProductModal from '@/components/products/CreateProductModal';
import EditProductModal from '@/components/products/EditProductModal';
import ViewProductModal from '@/components/products/ViewProductModal';
import ManageCategoriesModal from '@/components/products/ManageCategoriesModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { Product, InsuranceType } from '@/types';
import {
  Search,
  Plus,
  Package,
  ToggleLeft,
  ToggleRight,
  Filter,
  Tags,
  Grid3x3,
  List,
  Download,
  Settings
} from 'lucide-react';

export default function ProductsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<InsuranceType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const queryClient = useQueryClient();

  const { data: productsResponse, isLoading } = useQuery({
    queryKey: ['products', { search: searchTerm, type: typeFilter, status: statusFilter }],
    queryFn: () => productsApi.getAll({
      search: searchTerm,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'active',
      limit: 100,
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
      setIsEditModalOpen(false);
    },
  });

  const handleCreateProduct = async (data: any) => {
    await createProductMutation.mutateAsync(data);
  };

  const handleEditProduct = async (data: any) => {
    if (selectedProduct) {
      await updateProductMutation.mutateAsync({ id: selectedProduct.id, data });
    }
  };

  const handleToggleStatus = (product: Product) => {
    updateProductMutation.mutate({
      id: product.id,
      data: { isActive: !product.isActive }
    });
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const openViewModal = (product: Product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
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

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Manage insurance products and offerings</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCategoriesModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Tags className="w-4 h-4 mr-2" />
              Manage Categories
            </button>
            <button className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{productStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{productStats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ToggleRight className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{productStats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <ToggleLeft className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-80">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Tags */}
        {Object.keys(productStats.typeStats).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(productStats.typeStats).map(([type, count]) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type === typeFilter ? 'ALL' : type as InsuranceType)}
                className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  typeFilter === type
                    ? getTypeColor(type as InsuranceType)
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Tags className="w-3.5 h-3.5 mr-1.5" />
                {type}: {count}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid/List */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first product'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Product
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8' : 'space-y-5'}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
                onEdit={() => openEditModal(product)}
                onView={() => openViewModal(product)}
                onToggleStatus={() => handleToggleStatus(product)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <CreateProductModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateProduct}
          isLoading={createProductMutation.isPending}
        />

        {selectedProduct && (
          <>
            <EditProductModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedProduct(null);
              }}
              onSubmit={handleEditProduct}
              product={selectedProduct}
              isLoading={updateProductMutation.isPending}
            />

            <ViewProductModal
              isOpen={isViewModalOpen}
              onClose={() => {
                setIsViewModalOpen(false);
                setSelectedProduct(null);
              }}
              product={selectedProduct}
            />
          </>
        )}

        <ManageCategoriesModal
          isOpen={isCategoriesModalOpen}
          onClose={() => setIsCategoriesModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}
