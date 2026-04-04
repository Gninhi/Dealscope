export async function safeJson<T = unknown>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const text = await res.text();
  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<HTML')) {
    throw new Error('Received HTML instead of JSON');
  }
  return JSON.parse(text) as T;
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} Md€`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M€`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)} k€`;
  return `${value.toFixed(0)} €`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return 'N/A';
  return new Intl.NumberFormat('fr-FR').format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(date));
}

export function getScoreColor(score: number | null | undefined): string {
  if (score == null) return 'bg-gray-500/20 text-gray-400';
  if (score >= 75) return 'bg-emerald-500/20 text-emerald-400';
  if (score >= 50) return 'bg-amber-500/20 text-amber-400';
  return 'bg-red-500/20 text-red-400';
}

export function getScoreLabel(score: number | null | undefined): string {
  if (score == null) return '—';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Bon';
  return 'Faible';
}

export function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    identifiees: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    a_contacter: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    contactees: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    qualifiees: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    opportunite: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    deal: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    annule: 'bg-red-500/20 text-red-300 border-red-500/30',
  };
  return colors[stage] || 'bg-gray-500/20 text-gray-300';
}

export function getStageLabel(stage: string): string {
  const labels: Record<string, string> = {
    identifiees: 'Identifiées',
    a_contacter: 'A contacter',
    contactees: 'Contactées',
    qualifiees: 'Qualifiées',
    opportunite: 'Opportunité',
    deal: 'Deal',
    annule: 'Annulé',
  };
  return labels[stage] || stage;
}

export function getStageDotColor(stage: string): string {
  const colors: Record<string, string> = {
    identifiees: 'bg-gray-400',
    a_contacter: 'bg-blue-400',
    contactees: 'bg-amber-400',
    qualifiees: 'bg-emerald-400',
    opportunite: 'bg-violet-400',
    deal: 'bg-pink-400',
    annule: 'bg-red-400',
  };
  return colors[stage] || 'bg-gray-400';
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'à l\'instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHour < 24) return `il y a ${diffHour}h`;
  if (diffDay < 30) return `il y a ${diffDay}j`;
  return formatDate(date);
}

export function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter(Boolean).join(' ');
}
