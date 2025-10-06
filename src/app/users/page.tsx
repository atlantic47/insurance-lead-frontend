'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateUserModal from '@/components/users/CreateUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import UserPermissionsModal from '@/components/users/UserPermissionsModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { User, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { getInitials } from '@/lib/utils';
import {
  Search,
  Plus,
  Users as UsersIcon,
  Crown,
  Shield,
  UserCheck,
  UserX,
  Edit,
  Key,
  Trash2,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function UsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const hasUserManagementAccess = currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.MANAGER;

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', { search: searchTerm, role: roleFilter, status: statusFilter }],
    queryFn: () => usersApi.getAll({
      search: searchTerm,
      role: roleFilter === 'ALL' ? undefined : roleFilter,
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'active',
      limit: 100,
      sortBy: 'firstName',
      sortOrder: 'asc'
    }).then(res => res.data),
    enabled: hasUserManagementAccess,
  });

  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsEditModalOpen(false);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const handleCreateUser = async (data: any) => {
    await createUserMutation.mutateAsync(data);
  };

  const handleEditUser = async (data: any) => {
    if (selectedUser) {
      await updateUserMutation.mutateAsync({ id: selectedUser.id, data });
    }
  };

  const handleToggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { isActive: !user.isActive }
    });
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      deleteUserMutation.mutate(user.id);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const openPermissionsModal = (user: User) => {
    setSelectedUser(user);
    setIsPermissionsModalOpen(true);
  };

  if (!hasUserManagementAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
              <UserX className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don&apos;t have permission to access user management.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const users = usersResponse?.data || [];

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const admins = users.filter(u => u.role === UserRole.ADMIN).length;
    const managers = users.filter(u => u.role === UserRole.MANAGER).length;
    const agents = users.filter(u => u.role === UserRole.AGENT).length;
    return { total, active, admins, managers, agents };
  };

  const userStats = getUserStats();

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <Crown className="w-4 h-4" />;
      case UserRole.MANAGER: return <Shield className="w-4 h-4" />;
      case UserRole.AGENT: return <UserCheck className="w-4 h-4" />;
      default: return <UserCheck className="w-4 h-4" />;
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

  const canManageUser = (user: User) => {
    if (currentUser?.role === UserRole.ADMIN) return true;
    if (currentUser?.role === UserRole.MANAGER && user.role === UserRole.AGENT) return true;
    return false;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage users, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{userStats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{userStats.active}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{userStats.admins}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{userStats.managers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agents</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{userStats.agents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-80">
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-11 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="ALL">All Roles</option>
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.MANAGER}>Manager</option>
              <option value={UserRole.AGENT}>Agent</option>
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
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {users.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <UsersIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first user'}
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-white">
                              {getInitials(user.firstName, user.lastName)}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">ID: {user.id.slice(-8)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-700 border border-green-200'
                            : 'bg-red-100 text-red-700 border border-red-200'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {user.lastLogin ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {new Date(user.lastLogin).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManageUser(user) ? (
                          <Menu as="div" className="relative inline-block text-left">
                            <Menu.Button className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors">
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
                              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 border border-gray-200">
                                <div className="p-1">
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => openEditModal(user)}
                                        className={`${
                                          active ? 'bg-gray-50' : ''
                                        } group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-lg transition-colors`}
                                      >
                                        <Edit className="mr-3 h-4 w-4 text-gray-400" />
                                        Edit User
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => openPermissionsModal(user)}
                                        className={`${
                                          active ? 'bg-gray-50' : ''
                                        } group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-lg transition-colors`}
                                      >
                                        <Key className="mr-3 h-4 w-4 text-gray-400" />
                                        Manage Permissions
                                      </button>
                                    )}
                                  </Menu.Item>
                                  <Menu.Item>
                                    {({ active }) => (
                                      <button
                                        onClick={() => handleToggleUserStatus(user)}
                                        className={`${
                                          active ? 'bg-gray-50' : ''
                                        } group flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-lg transition-colors`}
                                      >
                                        <UserCheck className="mr-3 h-4 w-4 text-gray-400" />
                                        {user.isActive ? 'Deactivate' : 'Activate'}
                                      </button>
                                    )}
                                  </Menu.Item>
                                  {currentUser?.role === UserRole.ADMIN && (
                                    <>
                                      <div className="my-1 border-t border-gray-200" />
                                      <Menu.Item>
                                        {({ active }) => (
                                          <button
                                            onClick={() => handleDeleteUser(user)}
                                            className={`${
                                              active ? 'bg-red-50' : ''
                                            } group flex items-center w-full px-4 py-2.5 text-sm text-red-600 rounded-lg transition-colors`}
                                          >
                                            <Trash2 className="mr-3 h-4 w-4" />
                                            Delete User
                                          </button>
                                        )}
                                      </Menu.Item>
                                    </>
                                  )}
                                </div>
                              </Menu.Items>
                            </Transition>
                          </Menu>
                        ) : (
                          <span className="text-sm text-gray-400">No access</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals */}
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateUser}
          isLoading={createUserMutation.isPending}
          currentUserRole={currentUser?.role || UserRole.AGENT}
        />

        {selectedUser && (
          <>
            <EditUserModal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
              onSubmit={handleEditUser}
              user={selectedUser}
              isLoading={updateUserMutation.isPending}
              currentUserRole={currentUser?.role || UserRole.AGENT}
            />

            <UserPermissionsModal
              isOpen={isPermissionsModalOpen}
              onClose={() => {
                setIsPermissionsModalOpen(false);
                setSelectedUser(null);
              }}
              user={selectedUser}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
