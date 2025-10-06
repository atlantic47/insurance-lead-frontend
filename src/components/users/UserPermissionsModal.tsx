'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { X, Key, Shield, Check, Crown, Users, FileText, Mail, BarChart, Settings } from 'lucide-react';
import { User, UserRole } from '@/types';

interface UserPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
}

const PERMISSIONS: Permission[] = [
  // Lead Management
  { id: 'leads.view', name: 'View Leads', description: 'View lead information', icon: Users, category: 'Leads' },
  { id: 'leads.create', name: 'Create Leads', description: 'Create new leads', icon: Users, category: 'Leads' },
  { id: 'leads.edit', name: 'Edit Leads', description: 'Modify lead information', icon: Users, category: 'Leads' },
  { id: 'leads.delete', name: 'Delete Leads', description: 'Delete leads from system', icon: Users, category: 'Leads' },
  { id: 'leads.assign', name: 'Assign Leads', description: 'Assign leads to users', icon: Users, category: 'Leads' },

  // Communications
  { id: 'comms.view', name: 'View Communications', description: 'View communication history', icon: Mail, category: 'Communications' },
  { id: 'comms.send', name: 'Send Communications', description: 'Send emails, SMS, WhatsApp', icon: Mail, category: 'Communications' },
  { id: 'comms.templates', name: 'Manage Templates', description: 'Create and edit templates', icon: FileText, category: 'Communications' },

  // Campaigns
  { id: 'campaigns.view', name: 'View Campaigns', description: 'View campaign information', icon: BarChart, category: 'Campaigns' },
  { id: 'campaigns.create', name: 'Create Campaigns', description: 'Create new campaigns', icon: BarChart, category: 'Campaigns' },
  { id: 'campaigns.edit', name: 'Edit Campaigns', description: 'Modify campaigns', icon: BarChart, category: 'Campaigns' },
  { id: 'campaigns.delete', name: 'Delete Campaigns', description: 'Delete campaigns', icon: BarChart, category: 'Campaigns' },

  // Reports
  { id: 'reports.view', name: 'View Reports', description: 'Access reports and analytics', icon: BarChart, category: 'Reports' },
  { id: 'reports.export', name: 'Export Reports', description: 'Export report data', icon: BarChart, category: 'Reports' },

  // User Management
  { id: 'users.view', name: 'View Users', description: 'View user information', icon: Shield, category: 'User Management' },
  { id: 'users.create', name: 'Create Users', description: 'Add new users', icon: Shield, category: 'User Management' },
  { id: 'users.edit', name: 'Edit Users', description: 'Modify user information', icon: Shield, category: 'User Management' },
  { id: 'users.delete', name: 'Delete Users', description: 'Remove users from system', icon: Shield, category: 'User Management' },
  { id: 'users.permissions', name: 'Manage Permissions', description: 'Assign user permissions', icon: Key, category: 'User Management' },

  // System Settings
  { id: 'settings.view', name: 'View Settings', description: 'View system settings', icon: Settings, category: 'System' },
  { id: 'settings.edit', name: 'Edit Settings', description: 'Modify system settings', icon: Settings, category: 'System' },
];

const getRolePermissions = (role: UserRole): string[] => {
  switch (role) {
    case UserRole.ADMIN:
      return PERMISSIONS.map(p => p.id); // All permissions
    case UserRole.MANAGER:
      return [
        'leads.view', 'leads.create', 'leads.edit', 'leads.assign',
        'comms.view', 'comms.send', 'comms.templates',
        'campaigns.view', 'campaigns.create', 'campaigns.edit',
        'reports.view', 'reports.export',
        'users.view', 'users.create', 'users.edit',
      ];
    case UserRole.AGENT:
      return [
        'leads.view', 'leads.create', 'leads.edit',
        'comms.view', 'comms.send',
        'campaigns.view',
        'reports.view',
      ];
    default:
      return [];
  }
};

export default function UserPermissionsModal({
  isOpen,
  onClose,
  user,
}: UserPermissionsModalProps) {
  const rolePermissions = getRolePermissions(user.role);
  const categories = Array.from(new Set(PERMISSIONS.map(p => p.category)));

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Crown className="w-5 h-5 text-red-600" />;
      case UserRole.MANAGER: return <Shield className="w-5 h-5 text-purple-600" />;
      case UserRole.AGENT: return <Users className="w-5 h-5 text-blue-600" />;
      default: return <Users className="w-5 h-5" />;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-100 text-red-700 border-red-200';
      case UserRole.MANAGER: return 'bg-purple-100 text-purple-700 border-purple-200';
      case UserRole.AGENT: return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Key className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        User Permissions
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">
                        {user.firstName} {user.lastName}
                      </p>
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
                  {/* User Info Card */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {user.firstName} {user.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {/* Permissions Matrix */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Role-Based Permissions
                      </h3>
                      <span className="text-sm text-gray-600">
                        {rolePermissions.length} of {PERMISSIONS.length} permissions granted
                      </span>
                    </div>

                    {categories.map((category) => {
                      const categoryPermissions = PERMISSIONS.filter(p => p.category === category);
                      const grantedCount = categoryPermissions.filter(p => rolePermissions.includes(p.id)).length;

                      return (
                        <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900">{category}</h4>
                              <span className="text-sm text-gray-600">
                                {grantedCount}/{categoryPermissions.length}
                              </span>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {categoryPermissions.map((permission) => {
                                const isGranted = rolePermissions.includes(permission.id);
                                const Icon = permission.icon;

                                return (
                                  <div
                                    key={permission.id}
                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                                      isGranted
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200 opacity-60'
                                    }`}
                                  >
                                    <div className={`p-2 rounded-lg ${
                                      isGranted ? 'bg-green-100' : 'bg-gray-200'
                                    }`}>
                                      {isGranted ? (
                                        <Check className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <Icon className="w-4 h-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 text-sm">
                                        {permission.name}
                                      </div>
                                      <div className="text-xs text-gray-600 mt-0.5">
                                        {permission.description}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Info Note */}
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex gap-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm mb-1">
                          Role-Based Access Control
                        </h4>
                        <p className="text-sm text-blue-800">
                          Permissions are automatically assigned based on the user&apos;s role. To change permissions, update the user&apos;s role.
                        </p>
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
