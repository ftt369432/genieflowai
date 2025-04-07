import { AIAgents } from '../components/agents/AIAgents';
import { AIDrivePage } from '../pages/AIDrive';
import { MainLayout } from '../components/layout/MainLayout';

export const routes = [
  {
    path: '/',
    element: <MainLayout />,
  },
  {
    path: '/agents',
    element: <AIAgents />,
  },
  {
    path: '/drive',
    element: <AIDrivePage />,
  },
]; 