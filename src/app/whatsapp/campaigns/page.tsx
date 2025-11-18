'use client';

import { CampaignBuilder } from '@/components/CampaignBuilder';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function CampaignsPage() {
  return (
    <DashboardLayout>
      <CampaignBuilder />
    </DashboardLayout>
  );
}
