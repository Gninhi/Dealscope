'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TargetCompany } from '@/lib/types';
import { formatCurrency, getScoreBgColor } from '@/lib/utils';

interface SortablePipelineCardProps {
  company: TargetCompany;
  isDragging: boolean;
  onClick: () => void;
}

export default function SortablePipelineCard({ company, isDragging, onClick }: SortablePipelineCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: company.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="glass-card glass-card-hover rounded-xl p-3.5 cursor-pointer hover-lift transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <GripVertical className="h-4 w-4 text-[var(--text-tertiary)] mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{company.name}</h4>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{company.sector}</p>
          <div className="flex items-center justify-between mt-2.5">
            <Badge className={`text-[10px] ${getScoreBgColor(company.icpScore)}`}>{company.icpScore}</Badge>
            <span className="text-[10px] text-[var(--text-tertiary)]">{formatCurrency(company.revenue)}</span>
          </div>
          {company.signals && company.signals.length > 0 && (
            <p className="text-[10px] text-indigo-400 mt-1.5 flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" /> {company.signals[0].title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
