'use client';

import { User, UserRole } from '@/types';
import { formatDateTime, getInitials } from '@/lib/utils';
import { 
  Mail, 
  Phone, 
  Crown,
  Users,
  UserCheck,
  Calendar,
  Eye,
  Edit,
  MoreVertical,
  Shield,
  User as UserIcon
} from 'lucide-react';
import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';

interface UserCardProps {
  user: User;
  onEdit: () => void;
  onView: () => void;
  onToggleStatus: () => void;
  currentUser: User;
}

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return <Crown className="w-4 h-4" />;
    case UserRole.MANAGER:
      return <Shield className="w-4 h-4" />;
    case UserRole.AGENT:
      return <UserIcon className="w-4 h-4" />;
    default:
      return <UserIcon className="w-4 h-4" />;
  }
};

const getRoleColor = (role: UserRole) => {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-red-100 text-red-800';
    case UserRole.MANAGER:
      return 'bg-purple-100 text-purple-800';
    case UserRole.AGENT:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function UserCard({ 
  user, 
  onEdit, 
  onView, 
  onToggleStatus, 
  currentUser 
}: UserCardProps) {
  const canManageUser = currentUser.role === UserRole.ADMIN || 
    (currentUser.role === UserRole.MANAGER && user.role === UserRole.AGENT);

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
      !user.isActive ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-medium text-blue-600">
              {getInitials(user.firstName, user.lastName)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user.firstName} {user.lastName}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
                <span className="ml-1">{user.role}</span>
              </span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
        
        {canManageUser && (
          <Menu as="div" className="relative">
            <Menu.Button className="p-1 text-gray-400 hover:text-gray-600">
              <MoreVertical size={18} />
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
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onView}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex items-center w-full px-4 py-2 text-sm`}
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
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex items-center w-full px-4 py-2 text-sm`}
                      >
                        <Edit className="mr-3 h-4 w-4" />
                        Edit User
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={onToggleStatus}
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex items-center w-full px-4 py-2 text-sm`}
                      >
                        <UserCheck className="mr-3 h-4 w-4" />
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-2" />
          <span className="truncate">{user.email}</span>
        </div>
        {user.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{user.phone}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Joined {formatDateTime(user.createdAt)}</span>
        </div>
        {user.lastLogin && (
          <div className="flex items-center text-sm text-gray-600">
            <UserCheck className="w-4 h-4 mr-2" />
            <span>Last login {formatDateTime(user.lastLogin)}</span>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">User ID:</span>
          <span className="text-gray-900 font-mono text-xs">{user.id.slice(-8)}</span>
        </div>
      </div>
    </div>
  );
}