import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { dir } = useI18n();
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-stone-300 dark:border-stone-700 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <PrevIcon className="w-5 h-5" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3 py-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm">1</button>
          {start > 2 && <span className="px-2 text-stone-400">...</span>}
        </>
      )}
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            p === currentPage
              ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
              : 'hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-stone-400">...</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-3 py-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 text-sm">{totalPages}</button>
        </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-stone-300 dark:border-stone-700 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
      >
        <NextIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
