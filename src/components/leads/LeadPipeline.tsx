'use client';

import { Lead, LeadStatus } from '@/types';
import { getStatusColor } from '@/lib/utils';
import LeadCard from './LeadCard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/lib/api';
import { Plus } from 'lucide-react';

interface LeadPipelineProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onCreateLead: () => void;
}

const PIPELINE_STAGES = [
  { status: LeadStatus.NEW, name: 'New', color: 'bg-blue-100 text-blue-800' },
  { status: LeadStatus.CONTACTED, name: 'Contacted', color: 'bg-yellow-100 text-yellow-800' },
  { status: LeadStatus.ENGAGED, name: 'Engaged', color: 'bg-purple-100 text-purple-800' },
  { status: LeadStatus.QUALIFIED, name: 'Qualified', color: 'bg-indigo-100 text-indigo-800' },
  { status: LeadStatus.PROPOSAL_SENT, name: 'Proposal Sent', color: 'bg-orange-100 text-orange-800' },
  { status: LeadStatus.NEGOTIATION, name: 'Negotiation', color: 'bg-amber-100 text-amber-800' },
  { status: LeadStatus.CLOSED_WON, name: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { status: LeadStatus.CLOSED_LOST, name: 'Closed Lost', color: 'bg-red-100 text-red-800' },
  { status: LeadStatus.FOLLOW_UP, name: 'Follow Up', color: 'bg-gray-100 text-gray-800' },
];

export default function LeadPipeline({ leads, onLeadClick, onCreateLead }: LeadPipelineProps) {
  const queryClient = useQueryClient();
  
  const updateStatusMutation = useMutation({
    mutationFn: ({ leadId, status }: { leadId: string; status: LeadStatus }) =>
      leadsApi.updateStatus(leadId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const handleStatusChange = (leadId: string, status: LeadStatus) => {
    updateStatusMutation.mutate({ leadId, status });
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Lead Pipeline</h2>
          <button
            onClick={onCreateLead}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Lead
          </button>
        </div>
      </div>

      <div className="p-6 overflow-x-auto">
        <div className="flex space-x-6 min-w-max">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = getLeadsByStatus(stage.status);
            return (
              <div key={stage.status} className="flex-shrink-0 w-72">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stage.status)}`}>
                      {stage.name}
                    </span>
                    <span className="text-sm text-gray-500">({stageLeads.length})</span>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {stageLeads.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                      <p className="text-sm text-gray-500">No leads in this stage</p>
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onStatusChange={handleStatusChange}
                        onClick={() => onLeadClick(lead)}
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
  );
}