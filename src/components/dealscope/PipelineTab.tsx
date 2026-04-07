'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GripVertical, Building2, MapPin, Users, ExternalLink, Trash2, X,
  ChevronRight, TrendingUp, Briefcase, Star, Loader2, ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import { getStageLabel, getStageColor, getStageDotColor, formatCurrency, formatNumber, timeAgo } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/constants';
import type { CompanyWithRelations } from '@/lib/types';
import CompanyProfileDialog from './CompanyProfileDialog';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PipelineData {
  [stage: string]: Array<{
    id: string;
    companyId: string;
    stage: string;
    notes: string;
    movedAt: string;
    company: CompanyWithRelations;
  }>;
}

interface SortableCompanyCardProps {
  item: {
    id: string;
    companyId: string;
    stage: string;
    notes: string;
    movedAt: string;
    company: CompanyWithRelations;
  };
  onClick: (companyId: string) => void;
  onDelete?: (companyId: string) => void;
}

function SortableCompanyCard({ item, onClick, onDelete }: SortableCompanyCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const company = item.company;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border border-border bg-card/80 backdrop-blur-sm p-3.5 cursor-pointer hover:border-indigo-500/30 hover:shadow-md transition-all duration-200 group ${isDragging ? 'shadow-xl' : ''}`}
    >
      <div className="flex items-start gap-2 mb-2">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => onClick(company.id)}>
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-medium text-foreground truncate">{company.name}</h4>
            {company.icpScore && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                company.icpScore >= 75 ? 'bg-emerald-500/20 text-emerald-400' :
                company.icpScore >= 50 ? 'bg-amber-500/20 text-amber-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {company.icpScore}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-mono">{company.siren}</p>
        </div>
      </div>

      <div className="space-y-1.5 mb-2.5 pl-5">
        {company.city && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>{company.city}{company.postalCode ? ` ${company.postalCode}` : ''}</span>
          </div>
        )}
        {company.nafLabel && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Briefcase className="w-3 h-3" />
            <span className="truncate">{company.nafLabel}</span>
          </div>
        )}
        {company.revenue != null && company.revenue > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>CA: {formatCurrency(company.revenue)}</span>
          </div>
        )}
        {company.isEnriched && (
          <div className="flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>Profil enrichi</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pl-5 pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">{timeAgo(item.movedAt)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Lien Annuaire Entreprises */}
          <a
            href={`https://annuaire-entreprises.data.gouv.fr/entreprise/${company.siren}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-400 transition-colors"
            title="Annuaire Entreprises (gouv.fr)"
          >
            <ArrowUpRight className="w-3 h-3" />
          </a>
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(company.id); }}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onClick(company.id)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PipelineTab() {
  const { companies, setCompanies, setActiveTab } = useDealScopeStore();
  const [pipelineData, setPipelineData] = useState<PipelineData>({});
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch('/api/pipeline');
      if (res.ok) { const text = await res.text(); try { setPipelineData(JSON.parse(text)); } catch {} }

      // Also refresh companies
      const compRes = await fetch('/api/companies');
      if (compRes.ok) { const text = await compRes.text(); try { setCompanies(JSON.parse(text)); } catch {} }
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, [setCompanies]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  const handleDragStart = (event: DragStartEvent) => {
    // Find the dragged item from pipeline data
    const draggedId = String(event.active.id);
    for (const stage of Object.values(pipelineData)) {
      const item = stage.find(s => s.id === draggedId);
      if (item) {
        setDraggedItem(item);
        break;
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setDraggedItem(null);
    const { active, over } = event;
    if (!over) return;

    const draggedId = String(active.id);
    const targetId = String(over.id);

    // Determine target stage
    let targetStage: string | null = null;

    // Check if dropped on a stage column header
    const stageKeys = PIPELINE_STAGES.map(s => s.key);
    if (stageKeys.includes(targetId as typeof stageKeys[number])) {
      targetStage = targetId;
    } else {
      // Find the target item's stage
      for (const [stage, items] of Object.entries(pipelineData)) {
        const item = items.find(i => i.id === targetId);
        if (item) {
          targetStage = stage;
          break;
        }
      }
    }

    if (!targetStage) return;

    // Find source item
    let sourceCompanyId: string | null = null;
    for (const items of Object.values(pipelineData)) {
      const item = items.find(i => i.id === draggedId);
      if (item) {
        sourceCompanyId = item.companyId;
        break;
      }
    }

    if (!sourceCompanyId) return;

    // Check if the company's current stage is the same as target
    const sourceItem = Object.values(pipelineData)
      .flat()
      .find(i => i.id === draggedId);
    if (sourceItem && sourceItem.stage === targetStage) return;

    // Update pipeline
    try {
      await fetch('/api/pipeline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: sourceCompanyId, newStage: targetStage }),
      });
      await fetchPipeline();
    } catch (error) {
      console.error('Error moving company:', error);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!confirm('Supprimer cette entreprise du pipeline ?')) return;
    try {
      await fetch(`/api/companies?id=${companyId}`, { method: 'DELETE' });
      await fetchPipeline();
    } catch (error) {
      console.error('Error deleting company:', error);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-4 shrink-0">
        <h2 className="text-2xl font-bold text-foreground">Pipeline</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Glissez-déposez les entreprises entre les étapes
        </p>
      </div>

      {/* Pipeline board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 h-full min-w-max pb-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
            {PIPELINE_STAGES.map((stage) => {
              const items = pipelineData[stage.key] || [];
              return (
                <div
                  key={stage.key}
                  className="flex flex-col w-72 shrink-0 rounded-xl border border-border bg-background/30 backdrop-blur-sm"
                >
                  {/* Column header */}
                  <div className="p-3 border-b border-border shrink-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${getStageDotColor(stage.key)}`} />
                        <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          {stage.label}
                        </h3>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <SortableContext
                    id={stage.key}
                    items={items.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                      {items.length === 0 ? (
                        <div className="text-center py-8 text-xs text-muted-foreground/50">
                          Aucune entreprise
                        </div>
                      ) : (
                        items.map((item) => (
                          <SortableCompanyCard
                            key={item.id}
                            item={item}
                            onClick={(id) => setSelectedCompanyId(id)}
                            onDelete={handleDeleteCompany}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {draggedItem && (
            <div className="w-72 rounded-lg border border-indigo-500/30 bg-card p-3.5 shadow-2xl shadow-indigo-500/10 opacity-90">
              <h4 className="text-sm font-medium text-foreground">{draggedItem.company.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{draggedItem.company.city}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Company Profile Dialog */}
      {selectedCompanyId && (
        <CompanyProfileDialog
          companyId={selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
          onRefresh={fetchPipeline}
        />
      )}
    </div>
  );
}
