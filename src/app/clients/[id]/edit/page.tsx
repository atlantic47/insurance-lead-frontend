'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useQuery, useMutation } from '@tanstack/react-query';
import { clientsApi } from '@/lib/api';
import { ArrowLeft, Save } from 'lucide-react';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    policyNumber: '',
    premium: '',
    commission: '',
    startDate: '',
    renewalDate: '',
    isActive: true,
  });

  const { data: clientResponse, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.getById(clientId).then(res => res.data),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => clientsApi.update(clientId, data),
    onSuccess: () => {
      alert('Client updated successfully!');
      router.push(`/clients/${clientId}`);
    },
    onError: (error: any) => {
      alert('Failed to update client: ' + error.message);
    },
  });

  useEffect(() => {
    if (clientResponse?.data) {
      const client = clientResponse.data;
      setFormData({
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        policyNumber: client.policyNumber || '',
        premium: client.premium?.toString() || '',
        commission: client.commission?.toString() || '',
        startDate: client.startDate ? new Date(client.startDate).toISOString().split('T')[0] : '',
        renewalDate: client.renewalDate ? new Date(client.renewalDate).toISOString().split('T')[0] : '',
        isActive: client.isActive ?? true,
      });
    }
  }, [clientResponse]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      policyNumber: formData.policyNumber || null,
      premium: formData.premium ? parseFloat(formData.premium) : 0,
      commission: formData.commission ? parseFloat(formData.commission) : 0,
      startDate: formData.startDate || null,
      renewalDate: formData.renewalDate || null,
      isActive: formData.isActive,
    };

    updateMutation.mutate(submitData);
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

  if (!clientResponse?.data) {
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
        <button
          onClick={() => router.push(`/clients/${clientId}`)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Client Details
        </button>

        <div className="jira-content-card p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Client</h1>
            <p className="text-gray-600 mt-1">Update client information and policy details</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Policy Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Number
                </label>
                <input
                  type="text"
                  name="policyNumber"
                  value={formData.policyNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Premium */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premium ($)
                </label>
                <input
                  type="number"
                  name="premium"
                  value={formData.premium}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission ($)
                </label>
                <input
                  type="number"
                  name="commission"
                  value={formData.commission}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Renewal Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Renewal Date
                </label>
                <input
                  type="date"
                  name="renewalDate"
                  value={formData.renewalDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active Client</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Inactive clients won't appear in active listings and reports
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push(`/clients/${clientId}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
