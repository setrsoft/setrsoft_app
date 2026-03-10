import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Root } from '@/app/Root';
import { HomePage } from '@/features/showcase';
import { GymDashboard } from '@/features/gym';
import { EditorView } from '@/features/editor';
import { ROUTES } from '@/core/config';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Root />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.GYM, element: <GymDashboard /> },
      { path: ROUTES.EDITOR, element: <EditorView /> },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.HOME} replace /> },
]);
