import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date) {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM dd, yyyy HH:mm');
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    NEW: 'bg-blue-100 text-blue-800',
    CONTACTED: 'bg-yellow-100 text-yellow-800',
    ENGAGED: 'bg-purple-100 text-purple-800',
    QUALIFIED: 'bg-indigo-100 text-indigo-800',
    PROPOSAL_SENT: 'bg-orange-100 text-orange-800',
    NEGOTIATION: 'bg-amber-100 text-amber-800',
    CLOSED_WON: 'bg-green-100 text-green-800',
    CLOSED_LOST: 'bg-red-100 text-red-800',
    FOLLOW_UP: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function getPriorityColor(priority: number) {
  if (priority >= 4) return 'bg-red-100 text-red-800';
  if (priority >= 3) return 'bg-orange-100 text-orange-800';
  if (priority >= 2) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

export function getUrgencyLabel(urgency: number) {
  if (urgency >= 4) return 'High';
  if (urgency >= 3) return 'Medium';
  if (urgency >= 2) return 'Low';
  return 'Very Low';
}

export function truncateText(text: string, length: number = 100) {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}