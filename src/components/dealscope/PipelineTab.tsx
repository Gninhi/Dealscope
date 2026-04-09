'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  GripVertical, MapPin, Users, ExternalLink, Trash2,
  TrendingUp, Briefcase, Loader2, ArrowUpRight,
  CheckCircle2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDealScopeStore } from '@/store/use-deal-scope-store';
import { getStageDotColor, formatCurrency, formatNumber, timeAgo } from '@/lib/utils';
import { PIPELINE_STAGES } from '@/constants';
import type { CompanyWithRelations } from '@/lib/types';
import { apiFetch } from '@/lib/api-client';
import CompanyProfileDialog from './CompanyProfileDialog';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface PipelineItem {
  id: string;
  companyId: string;
  stage: string;
  notes: string;
  movedAt: string;
  company: CompanyWithRelations;
}

interface PipelineData {
  [stage: string]: PipelineItem[];
}

interface CompanyCardProps {
  item: PipelineItem;
  onClick: (companyId: string) => void;
  onDelete?: (companyId: string) => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  stageIndex: number;
}

function CompanyCard({
  item,
  onClick,
  onDelete,
  onMoveLeft,
  onMoveRight,
  canMoveLeft,
  canMoveRight,
  stageIndex
}: CompanyCardProps) {
  const company = item.company;
  const [isMoving, setIsMoving] = useState(false);

  const handleMoveLeft = async () => {
    if (!onMoveLeft || isMoving) return;
    setIsMoving(true);
    try {
      await onMoveLeft();
    } finally {
      setIsMoving(false);
    }
  };

  const handleMoveRight = async () => {
    if (!onMoveRight || isMoving) return;
    setIsMoving(true);
    try {
      await onMoveRight();
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <div
      data-testid="company-card"
      data-company-id={company.id}
      className="rounded-lg border border-border bg-card/80 backdrop-blur-sm p-3.5 cursor-pointer hover:border-indigo-500/30 hover:shadow-md transition-all duration-200 group"
    >
      {/* Header avec drag handle */}
      <div className="flex items-start gap-2 mb-2">
        <div className="cursor-grab active:cursor-grabbing mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => onClick(company.id)}>
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-medium text-foreground truncate">{company.name}</h4>
            {company.icpScore != null && (
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

      {/* Infos */}
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

      {/* Footer avec temps + actions */}
      <div className="flex items-center justify-between pl-5 pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">{timeAgo(item.movedAt)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              title="Supprimer"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => onClick(company.id)}
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Voir le profil"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Flèches bidirectionnelles */}
      <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          data-testid="move-left-btn"
          onClick={(e) => { e.stopPropagation(); handleMoveLeft(); }}
          disabled={!canMoveLeft || isMoving}
          className={`p-1.5 rounded-md transition-all ${
            canMoveLeft && !isMoving
              ? 'hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400'
              : 'text-muted-foreground/30 cursor-not-allowed'
          }`}
          title={canMoveLeft ? `Déplacer vers "${PIPELINE_STAGES[stageIndex - 1]?.label}"` : 'Impossible de déplacer'}
        >
          {isMoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        <span className="text-[10px] text-muted-foreground/50">Déplacer</span>
        <button
          data-testid="move-right-btn"
          onClick={(e) => { e.stopPropagation(); handleMoveRight(); }}
          disabled={!canMoveRight || isMoving}
          className={`p-1.5 rounded-md transition-all ${
            canMoveRight && !isMoving
              ? 'hover:bg-indigo-500/20 text-muted-foreground hover:text-indigo-400'
              : 'text-muted-foreground/30 cursor-not-allowed'
          }`}
          title={canMoveRight ? `Déplacer vers "${PIPELINE_STAGES[stageIndex + 1]?.label}"` : 'Impossible de déplacer'}
        >
          {isMoving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface DroppableColumnProps {
  stage: typeof PIPELINE_STAGES[number];
  items: PipelineItem[];
  isOver: boolean;
  children: React.ReactNode;
}

function DroppableColumn({ stage, items, isOver, children }: DroppableColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.key,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-72 shrink-0 rounded-xl border transition-all duration-200 ${
        isOver
          ? 'border-indigo-500/50 bg-indigo-500/5 ring-2 ring-indigo-500/20'
          : 'border-border bg-background/30'
      } backdrop-blur-sm`}
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

      {/* Cards container */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

interface DraggableCardProps {
  item: PipelineItem;
  children: React.ReactNode;
}

function DraggableCard({ item, children }: DraggableCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export default function PipelineTab() {
  const { setCompanies } = useDealScopeStore();
  const [pipelineData, setPipelineData] = useState<PipelineData>({});
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<PipelineItem | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await apiFetch('/api/pipeline');
      if (res.ok) {
        const data = await res.json();
        setPipelineData(data);
      }

      const compRes = await apiFetch('/api/companies');
      if (compRes.ok) {
        const data = await compRes.json();
        if (Array.isArray(data.companies)) setCompanies(data.companies);
      }
    } catch (error) {
      console.error('Error fetching pipeline:', error);
    } finally {
      setLoading(false);
    }
  }, [setCompanies]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Fonction pour déplacer une entreprise
  const moveCompany = useCallback(async (companyId: string, targetStage: string) => {
    // Optimistic update
    setPipelineData(prev => {
      const newData: PipelineData = {};
      let movedItem: PipelineItem | null = null;

      // Trouver et retirer l'item de son ancienne colonne
      for (const [stage, items] of Object.entries(prev)) {
        newData[stage] = items.filter(item => {
          if (item.companyId === companyId) {
            movedItem = { ...item, stage: targetStage, movedAt: new Date().toISOString() };
            return false;
          }
          return true;
        });
      }

      // Ajouter à la nouvelle colonne
      if (movedItem) {
        if (!newData[targetStage]) newData[targetStage] = [];
        newData[targetStage].push(movedItem);
      }

      return newData;
    });

    // Appel API
    try {
      const res = await apiFetch('/api/pipeline', {
        method: 'PUT',
        body: JSON.stringify({ companyId, stage: targetStage }),
      });

      if (!res.ok) {
        // Revert en cas d'erreur
        await fetchPipeline();
        throw new Error('Failed to move company');
      }

      // Refresh pour avoir les données à jour
      await fetchPipeline();
    } catch (error) {
      console.error('Error moving company:', error);
      throw error;
    }
  }, [fetchPipeline]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = String(event.active.id);
    for (const items of Object.values(pipelineData)) {
      const item = items.find(s => s.id === draggedId);
      if (item) {
        setDraggedItem(item);
        break;
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setOverStage(over.id as string);
    } else {
      setOverStage(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedItem(null);
    setOverStage(null);

    if (!over) return;

    const draggedId = String(active.id);
    const targetId = String(over.id);

    // Trouver l'item draggé
    let sourceCompanyId: string | null = null;
    let sourceStage: string | null = null;

    for (const [stage, items] of Object.entries(pipelineData)) {
      const item = items.find(i => i.id === draggedId);
      if (item) {
        sourceCompanyId = item.companyId;
        sourceStage = stage;
        break;
      }
    }

    if (!sourceCompanyId || !sourceStage) return;

    // Déterminer le stage cible
    let targetStage: string | null = null;

    const stageKeys = PIPELINE_STAGES.map(s => s.key);
    if (stageKeys.includes(targetId as typeof stageKeys[number])) {
      targetStage = targetId;
    } else {
      // Trouver le stage de l'item cible
      for (const [stage, items] of Object.entries(pipelineData)) {
        const item = items.find(i => i.id === targetId);
        if (item) {
          targetStage = stage;
          break;
        }
      }
    }

    if (!targetStage || sourceStage === targetStage) return;

    // Déplacer
    await moveCompany(sourceCompanyId, targetStage);
  };

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  const handleDeleteCompany = async (companyId: string) => {
    setConfirmState({
      open: true,
      title: 'Supprimer l\'entreprise',
      description: 'Supprimer cette entreprise du pipeline ?',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, open: false }));
        try {
          await apiFetch(`/api/companies?id=${companyId}`, { method: 'DELETE' });
          await fetchPipeline();
        } catch (error) {
          console.error('Error deleting company:', error);
        }
      },
    });
  };

  // Créer un index des stages pour les flèches
  const stageIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    PIPELINE_STAGES.forEach((stage, index) => {
      map.set(stage.key, index);
    });
    return map;
  }, []);

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
          Glissez-déposez les entreprises ou utilisez les flèches pour les déplacer entre les étapes
        </p>
      </div>

      {/* Pipeline board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 h-full min-w-max pb-4" style={{ minHeight: 'calc(100vh - 240px)' }}>
            {PIPELINE_STAGES.map((stage) => {
              const items = pipelineData[stage.key] || [];
              const stageIndex = stageIndexMap.get(stage.key) ?? 0;

              return (
                <DroppableColumn
                  key={stage.key}
                  stage={stage}
                  items={items}
                  isOver={overStage === stage.key}
                >
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground/50">
                      Aucune entreprise
                    </div>
                  ) : (
                    items.map((item) => (
                      <DraggableCard key={item.id} item={item}>
                        <CompanyCard
                          item={item}
                          onClick={(id) => setSelectedCompanyId(id)}
                          onDelete={handleDeleteCompany}
                          onMoveLeft={stageIndex > 0 ? () => moveCompany(item.companyId, PIPELINE_STAGES[stageIndex - 1].key) : undefined}
                          onMoveRight={stageIndex < PIPELINE_STAGES.length - 1 ? () => moveCompany(item.companyId, PIPELINE_STAGES[stageIndex + 1].key) : undefined}
                          canMoveLeft={stageIndex > 0}
                          canMoveRight={stageIndex < PIPELINE_STAGES.length - 1}
                          stageIndex={stageIndex}
                        />
                      </DraggableCard>
                    ))
                  )}
                </DroppableColumn>
              );
            })}
          </div>
        </div>
      </DndContext>

      <ConfirmDialog
        open={confirmState.open}
        onOpenChange={(open) => setConfirmState(prev => ({ ...prev, open }))}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        variant="destructive"
      />

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
