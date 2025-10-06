'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Phone, Shield } from 'lucide-react';
import { User, UserRole } from '@/types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  user: User;
  isLoading: boolean;
  currentUserRole: UserRole;
}

export default function EditUserModal({
  isOpen,
  onClose,
  onSubmit,
  user,
  isLoading,
  currentUserRole,
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
  });

  useEffect(() => {
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive,
    });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const canChangeRole = currentUserRole === UserRole.ADMIN ||
    (currentUserRole === UserRole.MANAGER && user.role === UserRole.AGENT);

  const availableRoles = currentUserRole === UserRole.ADMIN
    ? [UserRole.ADMIN, UserRole.MANAGER, UserRole.AGENT]
    : [UserRole.AGENT];

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
                      <UserIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Edit User
                      </Dialog.Title>
                      <p className="text-sm text-gray-600">Update user information</p>
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
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address *
                        </div>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="john.doe@example.com"
                      />
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </div>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    {/* Role */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Role *
                        </div>
                      </label>
                      <select
                        required
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        disabled={!canChangeRole}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        {availableRoles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      {!canChangeRole && (
                        <p className="mt-2 text-xs text-gray-500">
                          You don&apos;t have permission to change this user&apos;s role
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-semibold text-gray-900">Account Status</p>
                        <p className="text-sm text-gray-600">
                          {formData.isActive ? 'User can access the system' : 'User cannot access the system'}
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
                      {isLoading ? 'Updating...' : 'Update User'}
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
