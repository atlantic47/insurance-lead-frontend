'use client';

import { Lead, LeadStatus } from '@/types';
import { getStatusColor, formatDate, getInitials, getUrgencyLabel } from '@/lib/utils';
import { Phone, Mail, User, Calendar, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';

interface LeadCardProps {
  lead: Lead;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
  onClick: () => void;
}

const PIPELINE_STAGES = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.ENGAGED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL_SENT,
  LeadStatus.NEGOTIATION,
  LeadStatus.CLOSED_WON,
  LeadStatus.CLOSED_LOST,
  LeadStatus.FOLLOW_UP,
];

export default function LeadCard({ lead, onStatusChange, onClick }: LeadCardProps) {
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();
    onStatusChange(lead.id, e.target.value as LeadStatus);
  };

  const currentIndex = PIPELINE_STAGES.indexOf(lead.status);
  const canMovePrevious = currentIndex > 0;
  const canMoveNext = currentIndex < PIPELINE_STAGES.length - 1;

  const moveToPreviousStage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canMovePrevious) {
      onStatusChange(lead.id, PIPELINE_STAGES[currentIndex - 1]);
    }
  };

  const moveToNextStage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canMoveNext) {
      onStatusChange(lead.id, PIPELINE_STAGES[currentIndex + 1]);
    }
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {getInitials(lead.firstName, lead.lastName)}
            </span>
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {lead.firstName} {lead.lastName}
            </h3>
            <p className="text-sm text-gray-500">{lead.insuranceType}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(lead.status)}`}>
            {lead.status.replace('_', ' ')}
          </span>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {getUrgencyLabel(lead.urgency)}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {lead.email && (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="w-4 h-4 mr-2" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="w-4 h-4 mr-2" />
            <span>{lead.phone}</span>
          </div>
        )}
        {lead.assignedUser && (
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>{lead.assignedUser.firstName} {lead.assignedUser.lastName}</span>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Created {formatDate(lead.createdAt)}</span>
        </div>
        {lead.budget && (
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="w-4 h-4 mr-2" />
            <span>${lead.budget.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <span className="text-xs text-gray-500">Score:</span>
          <span className="text-sm font-medium text-gray-900">{lead.score.toFixed(1)}</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={moveToPreviousStage}
            disabled={!canMovePrevious}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              !canMovePrevious ? 'opacity-30 cursor-not-allowed' : ''
            }`}
            title="Move to previous stage"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>

          <select
            value={lead.status}
            onChange={handleStatusChange}
            className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          >
            {PIPELINE_STAGES.map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>

          <button
            onClick={moveToNextStage}
            disabled={!canMoveNext}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              !canMoveNext ? 'opacity-30 cursor-not-allowed' : ''
            }`}
            title="Move to next stage"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {lead.inquiryDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-600 line-clamp-2">
            {lead.inquiryDetails}
          </p>
        </div>
      )}
    </div>
  );
}