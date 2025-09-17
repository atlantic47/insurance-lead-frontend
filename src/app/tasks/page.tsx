'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import TaskCard from '@/components/tasks/TaskCard';
import CreateTaskModal from '@/components/tasks/CreateTaskModal';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api';
import { Task, TaskStatus, TaskType } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  Filter, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  User
} from 'lucide-react';
import { getStatusColor } from '@/lib/utils';

export default function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<TaskType | 'ALL'>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<'ALL' | 'mine' | 'others'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');

  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: tasksResponse, isLoading } = useQuery({
    queryKey: ['tasks', { 
      search: searchTerm, 
      status: statusFilter, 
      type: typeFilter, 
      assignee: assigneeFilter 
    }],
    queryFn: () => tasksApi.getAll({
      search: searchTerm,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      type: typeFilter === 'ALL' ? undefined : typeFilter,
      assignedUserId: assigneeFilter === 'mine' ? currentUser?.id : assigneeFilter === 'others' ? '!' + currentUser?.id : undefined,
      limit: 100,
      sortBy: 'dueDate',
      sortOrder: 'asc'
    }).then(res => res.data),
  });

  const createTaskMutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      tasksApi.updateStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleCreateTask = async (data: any) => {
    await createTaskMutation.mutateAsync(data);
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateStatusMutation.mutate({ taskId, status });
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const tasks = tasksResponse?.data || [];
  
  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const pending = tasks.filter(t => t.status === TaskStatus.PENDING).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const overdue = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== TaskStatus.COMPLETED
    ).length;

    return { total, completed, pending, inProgress, overdue };
  };

  const taskStats = getTaskStats();

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };

  const KANBAN_COLUMNS = [
    { status: TaskStatus.PENDING, title: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { status: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { status: TaskStatus.COMPLETED, title: 'Completed', color: 'bg-green-100 text-green-800' },
    { status: TaskStatus.CANCELLED, title: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

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
      <div className="jira-page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Tasks & Activities</h1>
            <p className="text-gray-600 mt-1">Manage tasks and track activity progress</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm font-medium border ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } rounded-l-md`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm font-medium border-t border-r border-b ${
                  viewMode === 'kanban'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } rounded-r-md`}
              >
                Kanban
              </button>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </button>
          </div>
        </div>
      </div>
      
      <div className="jira-page-content">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="jira-stat-card">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="jira-stat-card">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.pending}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.completed}</p>
              </div>
            </div>
          </div>

          <div className="jira-stat-card">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{taskStats.overdue}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Statuses</option>
              {Object.values(TaskStatus).map((status) => (
                <option key={status} value={status}>
                  {status.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              {Object.values(TaskType).map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">All Tasks</option>
              <option value="mine">My Tasks</option>
              <option value="others">Others' Tasks</option>
            </select>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {tasks.length === 0 ? (
              <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || statusFilter !== 'ALL' || typeFilter !== 'ALL' || assigneeFilter !== 'ALL'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Create your first task to get started.'}
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Task
                </button>
              </div>
            ) : (
              tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStatusChange={handleStatusChange}
                  onClick={() => handleTaskClick(task)}
                />
              ))
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Task Board</h2>
            </div>
            <div className="p-6 overflow-x-auto">
              <div className="flex space-x-6 min-w-max">
                {KANBAN_COLUMNS.map(column => {
                  const columnTasks = getTasksByStatus(column.status);
                  return (
                    <div key={column.status} className="flex-shrink-0 w-80">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(column.status)}`}>
                            {column.title}
                          </span>
                          <span className="text-sm text-gray-500">({columnTasks.length})</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {columnTasks.length === 0 ? (
                          <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                            <p className="text-sm text-gray-500">No {column.title.toLowerCase()} tasks</p>
                          </div>
                        ) : (
                          columnTasks.map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onStatusChange={handleStatusChange}
                              onClick={() => handleTaskClick(task)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <CreateTaskModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTask}
          isLoading={createTaskMutation.isPending}
        />

        <TaskDetailsModal
          task={selectedTask}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onStatusChange={(status) => selectedTask && handleStatusChange(selectedTask.id, status)}
        />
      </div>
    </DashboardLayout>
  );
}