import { type ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {icon && <div className="text-stone-300 dark:text-stone-700 mb-4">{icon}</div>}
      <h2 className="text-xl font-medium text-stone-700 dark:text-stone-300">{title}</h2>
      {description && <p className="mt-2 text-sm text-stone-500 dark:text-stone-400 max-w-md">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
