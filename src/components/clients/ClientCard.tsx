'use client';

import { Client } from '@/types';
import { formatCurrency, formatDate, getInitials } from '@/lib/utils';
import { User, Mail, Phone, Calendar, DollarSign, Eye, Edit, Building } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onEdit: () => void;
  onView: () => void;
}

export default function ClientCard({ client, onEdit, onView }: ClientCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
      !client.isActive ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-blue-600">
              {getInitials(client.firstName, client.lastName)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {client.firstName} {client.lastName}
            </h3>
            <div className="flex items-center space-x-2">
              {client.company && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                  <Building className="w-3 h-3 mr-1" />
                  {client.company.name}
                </span>
              )}
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1">
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
            title="Edit client"
          >
            <Edit size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {client.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2" />
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{client.phone}</span>
          </div>
        )}
        {client.dateOfBirth && (
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Born {formatDate(client.dateOfBirth)}</span>
          </div>
        )}
      </div>

      {client.policyNumber && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Policy Details</span>
            <span className="text-xs text-blue-600">#{client.policyNumber}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {client.product && (
              <div>
                <span className="text-blue-600">Product:</span>
                <p className="font-medium text-blue-900 truncate">{client.product.name}</p>
              </div>
            )}
            {client.premium && (
              <div>
                <span className="text-blue-600">Premium:</span>
                <p className="font-medium text-blue-900">{formatCurrency(client.premium)}</p>
              </div>
            )}
          </div>
          {(client.startDate || client.endDate) && (
            <div className="mt-2 pt-2 border-t border-blue-200 flex justify-between text-xs text-blue-600">
              {client.startDate && <span>Start: {formatDate(client.startDate)}</span>}
              {client.endDate && <span>End: {formatDate(client.endDate)}</span>}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>Client since {formatDate(client.createdAt)}</span>
        </div>
        
        {client.commission && (
          <div className="flex items-center text-sm">
            <DollarSign className="w-4 h-4 text-green-600 mr-1" />
            <span className="font-medium text-green-600">{formatCurrency(client.commission)}</span>
          </div>
        )}
      </div>

      {client.renewalDate && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className={`text-sm flex items-center ${
            new Date(client.renewalDate) < new Date() 
              ? 'text-red-600' 
              : new Date(client.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              ? 'text-orange-600'
              : 'text-gray-600'
          }`}>
            <Calendar className="w-4 h-4 mr-1" />
            <span>Renewal: {formatDate(client.renewalDate)}</span>
          </div>
        </div>
      )}
    </div>
  );
}