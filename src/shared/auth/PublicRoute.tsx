import type { ReactNode } from 'react';

interface PublicRouteProps {
  children: ReactNode;
}

/**
 * Wrapper for public-only routes (e.g. login). Can redirect authenticated users later.
 */
export function PublicRoute({ children }: PublicRouteProps) {
  return <>{children}</>;
}
