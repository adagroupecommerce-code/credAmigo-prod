/**
 * Utility function to get date ranges for filters
 * Returns ISO strings for start and end dates
 */

export type DateFilter = 'day' | 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all' | 'custom';

export interface DateRange {
  from: string;
  to: string;
}

export interface CustomDateRange {
  start: string;
  end: string;
}

export function getDateRange(filter: DateFilter, customRange?: CustomDateRange): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let from: Date;
  let to: Date = new Date(today);
  to.setHours(23, 59, 59, 999); // End of today

  switch (filter) {
    case 'day':
      from = new Date(today);
      break;

    case 'week':
      // Start of current week (Sunday)
      from = new Date(today);
      from.setDate(today.getDate() - today.getDay());
      break;

    case 'month':
      // Start of current month
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      break;

    case 'quarter':
      // Start of current quarter (Jan/Apr/Jul/Oct)
      const currentQuarter = Math.floor(today.getMonth() / 3);
      from = new Date(today.getFullYear(), currentQuarter * 3, 1);
      break;

    case 'semester':
      // Start of current semester (Jan or Jul)
      const currentSemester = Math.floor(today.getMonth() / 6);
      from = new Date(today.getFullYear(), currentSemester * 6, 1);
      break;

    case 'year':
      // Start of current year
      from = new Date(today.getFullYear(), 0, 1);
      break;

    case 'all':
      // From 10 years ago to today
      from = new Date(today.getFullYear() - 10, 0, 1);
      break;

    case 'custom':
      // Use custom range if provided
      if (customRange) {
        from = new Date(customRange.start);
        to = new Date(customRange.end);
        to.setHours(23, 59, 59, 999);
      } else {
        from = new Date(today);
      }
      break;

    default:
      from = new Date(today);
  }

  from.setHours(0, 0, 0, 0); // Start of day

  return {
    from: from.toISOString(),
    to: to.toISOString()
  };
}

/**
 * Format date for display
 */
export function formatDateRange(filter: DateFilter, customRange?: CustomDateRange): string {
  const range = getDateRange(filter, customRange);
  const from = new Date(range.from);
  const to = new Date(range.to);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return `${formatDate(from)} - ${formatDate(to)}`;
}
