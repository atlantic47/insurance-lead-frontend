'use client';

import { Task, TaskStatus, TaskType } from '@/types';
import { getStatusColor, formatDate, formatDateTime, getInitials, getPriorityColor } from '@/lib/utils';
import { 
  Calendar, 
  User, 
  Flag, 
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle
} from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onClick: () => void;
}

const TASK_STATUSES = [
  TaskStatus.PENDING,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
  TaskStatus.CANCELLED,
];

const getTypeIcon = (type: TaskType) => {
  switch (type) {
    case TaskType.CALL:
      return <Clock className="w-4 h-4" />;
    case TaskType.EMAIL:
      return <Calendar className="w-4 h-4" />;
    case TaskType.MEETING:
      return <User className="w-4 h-4" />;
    case TaskType.FOLLOW_UP:
      return <Flag className="w-4 h-4" />;
    case TaskType.PROPOSAL:
      return <CheckCircle className="w-4 h-4" />;
    default:
      return <Circle className="w-4 h-4" />;
  }
};

export default function TaskCard({ task, onStatusChange, onClick }: TaskCardProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(task.id, e.target.value as TaskStatus);
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.COMPLETED;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${getPriorityColor(task.priority)}`}>
            {getTypeIcon(task.type)}
          </div>
          <div className="flex-1">
            <h3 className={`font-medium ${isOverdue ? 'text-red-900' : 'text-gray-900'}`}>
              {task.title}
            </h3>
            <p className="text-sm text-gray-500">{task.type.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isOverdue && (
            <AlertTriangle className="w-4 h-4 text-red-500" />
          )}
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="space-y-2 mb-4">
        {task.assignedUser && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>{task.assignedUser.firstName} {task.assignedUser.lastName}</span>
          </div>
        )}
        
        {task.lead && (
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center mr-2">
              <span className="text-xs font-medium text-blue-600">
                {getInitials(task.lead.firstName, task.lead.lastName)}
              </span>
            </div>
            <span>{task.lead.firstName} {task.lead.lastName}</span>
          </div>
        )}

        {task.dueDate && (
          <div className={`flex items-center text-sm ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
            <Calendar className="w-4 h-4 mr-2" />
            <span>Due {formatDateTime(task.dueDate)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <Flag className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-500">Priority:</span>
          <span className={`text-xs font-medium px-1 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
        </div>
        
        <select
          value={task.status}
          onChange={handleStatusChange}
          className="text-xs border-0 bg-transparent text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-0"
          onClick={(e) => e.stopPropagation()}
        >
          {TASK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
        Created {formatDate(task.createdAt)}
        {task.completedAt && (
          <span className="ml-2">• Completed {formatDateTime(task.completedAt)}</span>
        )}
      </div>
    </div>
  );
}