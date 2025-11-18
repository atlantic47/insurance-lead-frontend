'use client';

import { ConversationLabelsManager } from '@/components/ConversationLabelsManager';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function LabelsPage() {
  return (
    <DashboardLayout>
      <ConversationLabelsManager />
    </DashboardLayout>
  );
}
