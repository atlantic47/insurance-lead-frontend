'use client';

import { AutomationRulesManager } from '@/components/AutomationRulesManager';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function AutomationPage() {
  return (
    <DashboardLayout>
      <AutomationRulesManager />
    </DashboardLayout>
  );
}
