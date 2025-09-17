'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserCard from '@/components/users/UserCard';
import CreateUserModal from '@/components/users/CreateUserModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { User, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  Search, 
  Plus, 
  Users, 
  Crown,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';

export default function UsersPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'active' | 'inactive'>('ALL');

  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Check if user has access to user management
  const hasUserManagementAccess = currentUser?.role === UserRole.ADMIN || 
    currentUser?.role === UserRole.MANAGER;

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users', { search: searchTerm, role: roleFilter, status: statusFilter }],
    queryFn: () => usersApi.getAll({
      search: searchTerm,
      role: roleFilter === 'ALL' ? undefined : roleFilter,
      isActive: statusFilter === 'ALL' ? undefined : statusFilter === 'active',
      limit: 50,
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
    },
  });

  const handleCreateUser = async (data: any) => {
    await createUserMutation.mutateAsync(data);
  };

  const handleToggleUserStatus = (user: User) => {
    updateUserMutation.mutate({
      id: user.id,
      data: { ...user, isActive: !user.isActive }
    });
  };

  if (!hasUserManagementAccess) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
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
    const inactive = users.filter(u => !u.isActive).length;
    const admins = users.filter(u => u.role === UserRole.ADMIN).length;
    const managers = users.filter(u => u.role === UserRole.MANAGER).length;
    const agents = users.filter(u => u.role === UserRole.AGENT).length;

    return { total, active, inactive, admins, managers, agents };
  };

  const userStats = getUserStats();

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
            <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage system users and permissions</p>
          </div>
          {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="jira-button-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              New User
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Crown className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.admins}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Managers</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.managers}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Agents</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.agents}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <UserCheck className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{userStats.active}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="jira-content-card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              {Object.values(UserRole).map((role) => (
                <option key={role} value={role}>
                  {role}
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          {users.length === 0 ? (
            <div className="col-span-full jira-content-card p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Create your first user to get started.'}
              </p>
              {(currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER) && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First User
                </button>
              )}
            </div>
          ) : (
            users.map((user) => (
              <UserCard
                key={user.id}
                user={user}
                currentUser={currentUser!}
                onEdit={() => console.log('Edit:', user.id)}
                onView={() => console.log('View:', user.id)}
                onToggleStatus={() => handleToggleUserStatus(user)}
              />
            ))
          )}
        </div>

        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateUser}
          isLoading={createUserMutation.isPending}
          currentUserRole={currentUser?.role || UserRole.AGENT}
        />
      </div>
      </div>
    </DashboardLayout>
  );
}