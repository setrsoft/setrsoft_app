import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/core/lib';

export function Button({
  className,
  ...props
}: ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      className={cn(
        'rounded border border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium',
        className
      )}
      {...props}
    />
  );
}
