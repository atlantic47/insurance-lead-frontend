'use client';

import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  User,
  Building,
  CreditCard,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const { data: clientResponse, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getById(clientId).then(res => res.data),
  });

  const client = clientResponse?.data;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Client not found</h2>
          <button
            onClick={() => router.push('/clients')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Back to Clients
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="jira-page-content">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/clients')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-2xl mr-4">
                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {client.firstName} {client.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    client.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/clients/${clientId}/edit`)}
              className="jira-button-primary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="jira-content-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{client.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{client.phone || 'N/A'}</p>
                  </div>
                </div>
                {client.address && (
                  <div className="flex items-start col-span-2">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{client.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Policy Information */}
            <div className="jira-content-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Policy Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Policy Number</p>
                    <p className="text-sm font-medium text-gray-900">{client.policyNumber || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Building className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Product</p>
                    <p className="text-sm font-medium text-gray-900">
                      {typeof client.product === 'object' && client.product !== null
                        ? (client.product as any).name || 'N/A'
                        : client.product || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Start Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(client.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Renewal Date</p>
                    <p className={`text-sm font-medium ${
                      client.renewalDate && new Date(client.renewalDate) < new Date()
                        ? 'text-red-600'
                        : client.renewalDate && new Date(client.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        ? 'text-orange-600'
                        : 'text-gray-900'
                    }`}>
                      {formatDate(client.renewalDate)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {client.notes && (
              <div className="jira-content-card p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Financial Info */}
          <div className="space-y-6">
            {/* Premium Card */}
            <div className="jira-content-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                Financial Information
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Premium</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {client.premium ? formatCurrency(client.premium) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Commission</p>
                  <p className="text-xl font-semibold text-green-600">
                    {client.commission ? formatCurrency(client.commission) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="jira-content-card p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                Timeline
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Client Since</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(client.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(client.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
