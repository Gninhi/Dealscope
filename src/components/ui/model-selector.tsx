'use client';

import { useState } from 'react';
import { ChevronDown, Brain, Sparkles } from 'lucide-react';

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  description?: string;
}

interface ModelSelectorProps {
  models: ModelOption[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  label?: string;
  compact?: boolean;
  className?: string;
}

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  label = 'Modèle',
  compact = false,
  className = '',
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedModelData = models.find(m => m.id === selectedModel) || models[0];

  const handleSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {label && !compact && (
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
          {label}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center gap-2 px-3 py-2
          rounded-lg text-sm
          bg-card/80 border border-border
          hover:border-indigo-500/30 hover:bg-card
          transition-all duration-200
          ${compact ? 'py-1.5 text-xs' : ''}
        `}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Sparkles className={`shrink-0 text-indigo-400 ${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'}`} />
          <span className="truncate text-foreground font-medium">
            {selectedModelData?.name || 'Sélectionner'}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
<div className="py-1 max-h-64 overflow-y-auto">
          {models.map((model, index) => (
            <button
              key={`${model.id}-${model.provider}-${index}`}
              onClick={() => handleSelect(model.id)}
              className={`
                w-full flex items-start gap-2.5 px-3 py-2.5 text-left
                hover:bg-accent/50 transition-colors
                ${model.id === selectedModel ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}
              `}
                >
                  <Sparkles
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      model.id === selectedModel ? 'text-indigo-400' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          model.id === selectedModel ? 'text-foreground' : 'text-foreground'
                        }`}
                      >
                        {model.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                        {model.provider}
                      </span>
                    </div>
                    {model.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {model.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ModelSelector;
