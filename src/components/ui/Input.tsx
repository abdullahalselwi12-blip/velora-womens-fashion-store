import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        className={`w-full px-4 py-2.5 rounded-md border bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent ${
          error ? 'border-red-400' : 'border-stone-300 dark:border-stone-700'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-4 py-2.5 rounded-md border bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 placeholder-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent ${
          error ? 'border-red-400' : 'border-stone-300 dark:border-stone-700'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = '', children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 rounded-md border bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-transparent ${
          error ? 'border-red-400' : 'border-stone-300 dark:border-stone-700'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
