'use client';

import { useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { FullPageLoader } from '@/components/auth/loading-spinner';

function AppContent() {
  const { activeTab, sidebarOpen, setCompanies } = useDealScopeStore();

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/companies', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.companies) setCompanies(data.companies);
      })
      .catch(() => {});
    return () => controller.abort();
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
      <main className={cn('flex-1 transition-all duration-300', sidebarOpen ? 'ml-60' : 'ml-[72px]')}>
        <div className="p-6 max-w-[1600px]">{renderTab()}</div>
      </main>
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'unauthenticated') return <FullPageLoader />;
  return <AppContent />;
}
