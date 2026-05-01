
export function parseBackendDate(dateStr: string | Date | null | undefined): Date {
  if (dateStr instanceof Date) return dateStr;
  if (!dateStr) return new Date(NaN);
  const trimmed = dateStr.trim();
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    return new Date(trimmed);
  }
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(trimmed)) {
    return new Date(trimmed.replace(' ', 'T') + 'Z');
  }
  return new Date(trimmed);
}

export function formatRelativeShort(dateStr: string): string {
  const parsed = parseBackendDate(dateStr);
  const ms = parsed.getTime();
  if (Number.isNaN(ms)) return '';
  const diff = Math.max(0, Date.now() - ms);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}
