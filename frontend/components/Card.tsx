import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-card border border-border rounded-card shadow-card p-9 max-w-[720px] mx-auto w-full ${className}`}
      {...props}
    />
  );
}
