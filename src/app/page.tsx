'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import Sidebar from '@/components/dealscope/Sidebar';
import DashboardTab from '@/components/dealscope/DashboardTab';
import SearchTab from '@/components/dealscope/SearchTab';
import PipelineTab from '@/components/dealscope/PipelineTab';
import ScanTab from '@/components/dealscope/ScanTab';
import ChatTab from '@/components/dealscope/ChatTab';
import NewsTab from '@/components/dealscope/NewsTab';
import SettingsTab from '@/components/dealscope/SettingsTab';
import { cn } from '@/lib/utils';

function AppContent() {
  const { activeTab, sidebarOpen, setCompanies } = useDealScopeStore();

  // Load companies on mount
  useEffect(() => {
    fetch('/api/companies')
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text(); })
      .then(text => { try { const data = JSON.parse(text); if (Array.isArray(data)) setCompanies(data); } catch {} })
      .catch(() => {});
  }, [setCompanies]);

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'recherche': return <SearchTab />;
      case 'pipeline': return <PipelineTab />;
      case 'scan': return <ScanTab />;
      case 'chat': return <ChatTab />;
      case 'actualites': return <NewsTab />;
      case 'parametres': return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main
        className={cn(
          'flex-1 transition-all duration-300',
          sidebarOpen ? 'ml-60' : 'ml-[72px]'
        )}
      >
        <div className="p-6 max-w-[1600px]">
          {renderTab()}
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppContent />
    </ThemeProvider>
  );
}
