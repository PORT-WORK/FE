import { createBrowserRouter, Navigate } from 'react-router';
import Layout from './components/Layout';
import HomePage from './domains/home/HomePage';
import ExplorePage from './domains/explore/ExplorePage';
import ExploreDetailPage from './domains/explore/ExploreDetailPage';
import PortfolioPage from './domains/portfolio/PortfolioPage';
import WorkspacePage from './domains/workspace/WorkspacePage';
import MessagesPage from './domains/messages/MessagesPage';
import ProfilePage from './domains/profile/ProfilePage';
import SavedPage from './domains/saved/SavedPage';
import SettingsPage from './domains/settings/SettingsPage';
import AnalyticsPage from './domains/analytics/AnalyticsPage';
import AIGeneratePage from './domains/generate/AIGeneratePage';
import EditorPage from './domains/portfolio/EditorPage';
import LoginPage from './domains/auth/LoginPage';
import OAuthSuccessPage from './domains/auth/OAuthSuccessPage';

export const router = createBrowserRouter([
  { path: '/oauth/success', Component: OAuthSuccessPage },
  // Login page (no layout)
  { path: '/login', Component: LoginPage },
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: HomePage },
      { path: 'explore', Component: ExplorePage },
      { path: 'explore/:id', Component: ExploreDetailPage },
      { path: 'portfolio', Component: PortfolioPage },
      { path: 'portfolio/editor', Component: EditorPage },
      { path: 'workspace', Component: WorkspacePage },
      { path: 'messages', Component: MessagesPage },
      { path: 'profile', Component: ProfilePage },
      { path: 'saved', Component: SavedPage },
      { path: 'settings', Component: SettingsPage },
      { path: 'analytics', Component: AnalyticsPage },
      { path: 'generate', Component: AIGeneratePage },
      { path: 'mypage/profile', element: <Navigate to="/profile" replace /> },
      { path: 'mypage/saved', element: <Navigate to="/saved" replace /> },
      { path: 'mypage/settings', element: <Navigate to="/settings" replace /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

