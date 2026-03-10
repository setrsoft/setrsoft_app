import type { ReactNode } from 'react';

interface PlaceholderProps {
  children?: ReactNode;
  label?: string;
}

export function Placeholder({ children, label = 'Placeholder' }: PlaceholderProps) {
  return (
    <div className="rounded border border-dashed border-gray-400 p-4 text-gray-500">
      <span className="font-medium">{label}</span>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
