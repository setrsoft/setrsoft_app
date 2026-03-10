import { Outlet, Link } from 'react-router-dom';
import { ROUTES, APP_TITLE } from '@/core/config';

export function Root() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
          <Link
            to={ROUTES.HOME}
            className="font-semibold text-gray-900 hover:text-gray-600"
          >
            {APP_TITLE}
          </Link>
          <Link
            to={ROUTES.HOME}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Home
          </Link>
          <Link
            to={ROUTES.GYM}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Gym
          </Link>
          <Link
            to={ROUTES.EDITOR}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Editor
          </Link>
        </nav>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
