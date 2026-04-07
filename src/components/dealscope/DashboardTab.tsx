'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp, Target, Search, Kanban, Radar, Sparkles, Brain, ArrowRight, Lightbulb, Zap, BarChart3 } from 'lucide-react';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import { formatCurrency, formatNumber, getStageLabel, timeAgo, getStageDotColor } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const stageColors = ['#6B7280', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#EF4444'];

const AI_INSIGHTS = [
  {
    id: '1',
    icon: TrendingUp,
    text: 'Le secteur SaaS B2B affiche une croissance de 23% en France',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    iconColor: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/30',
  },
  {
    id: '2',
    icon: BarChart3,
    text: 'Les valuations medtech sont en hausse de 15% ce trimestre',
    gradient: 'from-blue-500/10 to-cyan-500/10',
    iconColor: 'text-blue-400',
    borderHover: 'hover:border-blue-500/30',
  },
  {
    id: '3',
    icon: Zap,
    text: '12 nouvelles cibles correspondent à votre ICP cette semaine',
    gradient: 'from-amber-500/10 to-orange-500/10',
    iconColor: 'text-amber-400',
    borderHover: 'hover:border-amber-500/30',
  },
  {
    id: '4',
    icon: Lightbulb,
    text: 'Les fintechs françaises lèvent 2,3 Md€ au T1 2025, un record',
    gradient: 'from-violet-500/10 to-purple-500/10',
    iconColor: 'text-violet-400',
    borderHover: 'hover:border-violet-500/30',
  },
];

interface Stats {
  totalCompanies: number;
  pipelineByStage: Record<string, number>;
  topSectors: { sector: string; count: number }[];
  avgIcpScore: number;
  recentCompanies: any[];
  totalSignals: number;
  totalContacts: number;
}

export default function DashboardTab() {
  const { setActiveTab } = useDealScopeStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch('/api/dashboard/stats', { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.text(); })
      .then(text => { try { setStats(JSON.parse(text)); } catch {} finally { setLoading(false); } })
      .catch(() => setLoading(false));

    return () => { clearTimeout(timeout); controller.abort(); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const s = stats || {
    totalCompanies: 0,
    pipelineByStage: {},
    topSectors: [],
    avgIcpScore: 0,
    recentCompanies: [],
    totalSignals: 0,
    totalContacts: 0,
  };

  const pipelineChartData = PIPELINE_STAGES.map((stage, i) => ({
    name: stage.label,
    count: s.pipelineByStage[stage.key] || 0,
    color: stageColors[i],
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">Vue d&apos;ensemble de votre activité M&A</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 className="w-5 h-5" />}
          label="Entreprises"
          value={formatNumber(s.totalCompanies)}
          color="from-indigo-500 to-violet-500"
          delay="0ms"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Score ICP Moyen"
          value={`${s.avgIcpScore}/100`}
          color="from-emerald-500 to-teal-500"
          delay="75ms"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Signaux détectés"
          value={formatNumber(s.totalSignals)}
          color="from-amber-500 to-orange-500"
          delay="150ms"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Contacts"
          value={formatNumber(s.totalContacts)}
          color="from-pink-500 to-rose-500"
          delay="225ms"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <QuickAction
          icon={<Search className="w-5 h-5" />}
          title="Rechercher"
          description="Trouver des entreprises cibles"
          gradient="from-blue-500/10 to-cyan-500/10"
          onClick={() => setActiveTab('recherche')}
        />
        <QuickAction
          icon={<Kanban className="w-5 h-5" />}
          title="Pipeline"
          description="Gérer les étapes du deal"
          gradient="from-violet-500/10 to-purple-500/10"
          onClick={() => setActiveTab('pipeline')}
        />
        <QuickAction
          icon={<Radar className="w-5 h-5" />}
          title="Scan IA"
          description="Scanner automatiquement"
          gradient="from-emerald-500/10 to-teal-500/10"
          onClick={() => setActiveTab('scan')}
        />
      </div>

      {/* AI Insights — Gemma 4 */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                Insights IA
                <span className="text-sm font-medium bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">— Gemma 4</span>
              </h3>
              <p className="text-xs text-muted-foreground">Analyses et tendances du marché M&A</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/15 transition-colors"
          >
            Voir plus
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AI_INSIGHTS.map((insight) => {
            const Icon = insight.icon;
            return (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br ${insight.gradient} border border-transparent ${insight.borderHover} transition-all duration-200`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${insight.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline chart */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Pipeline</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipelineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  color: '#E2E8F0',
                }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                {pipelineChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Activité récente</h3>
        {s.recentCompanies.length === 0 ? (
          <p className="text-muted-foreground text-sm">Aucune entreprise récente</p>
        ) : (
          <div className="space-y-3">
            {s.recentCompanies.map((company: any) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={() => setActiveTab('pipeline')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                    <p className="text-xs text-muted-foreground">{company.city}, {company.postalCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${getStageDotColor(company.status)}`} />
                    <span className="text-xs text-muted-foreground">{getStageLabel(company.status)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(company.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, delay }: {
  icon: React.ReactNode; label: string; value: string; color: string; delay: string;
}) {
  return (
    <div
      className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 hover:shadow-lg transition-all duration-300"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white opacity-90`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function QuickAction({ icon, title, description, gradient, onClick }: {
  icon: React.ReactNode; title: string; description: string; gradient: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border border-border bg-gradient-to-br ${gradient} p-5 text-left hover:shadow-lg hover:border-indigo-500/30 transition-all duration-300 group`}
    >
      <div className="text-indigo-400 mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </button>
  );
}
