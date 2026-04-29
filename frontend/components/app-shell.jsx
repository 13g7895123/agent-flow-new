'use client';

import { useEffect, useState } from 'react';
import { CommandPalette, Sidebar, Topbar } from '@/components/afh-ui';
import { DashboardPage } from '@/components/afh-dashboard';
import { I18nProvider, useI18n } from '@/components/i18n';
import { RunsListPage } from '@/components/afh-runs';
import { ConnectorsPage, InsightsPage, ProjectsPage, RolesPage, SkillsPage } from '@/components/afh-pages';

export default function AppShell() {
  const [theme, setTheme] = useState('light');
  const [language, setLanguage] = useState('zh-TW');
  const [page, setPage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [selectedRun, setSelectedRun] = useState(null);
  const [preferencesReady, setPreferencesReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem('afh-theme-mode');
      const savedLanguage = window.localStorage.getItem('afh-language');
      setTheme(savedTheme || 'light');
      setLanguage(savedLanguage || 'zh-TW');
      setCollapsed(window.localStorage.getItem('afh-sidebar') === '1');
      setPreferencesReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    window.localStorage.setItem('afh-theme-mode', theme);
  }, [preferencesReady, theme]);
  useEffect(() => {
    if (!preferencesReady) return;
    window.localStorage.setItem('afh-language', language);
    document.documentElement.lang = language === 'zh-TW' ? 'zh-Hant' : 'en';
  }, [language, preferencesReady]);
  useEffect(() => {
    if (!preferencesReady) return;
    window.localStorage.setItem('afh-sidebar', collapsed ? '1' : '0');
  }, [collapsed, preferencesReady]);

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setCmdOpen((open) => !open);
      }
      if (event.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-base', '#0c0c0e');
      root.style.setProperty('--bg-panel', '#131316');
      root.style.setProperty('--bg-surface', '#1c1c21');
      root.style.setProperty('--bg-hover', '#24242b');
      root.style.setProperty('--bg-active', '#2c2c35');
      root.style.setProperty('--border', '#2e2e38');
      root.style.setProperty('--border-subtle', '#232329');
      root.style.setProperty('--text-primary', '#ededf0');
      root.style.setProperty('--text-secondary', '#8c8c9e');
      root.style.setProperty('--text-muted', '#4c4c5e');
      root.style.setProperty('--accent', '#5b7cf6');
      root.style.setProperty('--accent-hover', '#7090f8');
      root.style.setProperty('--accent-subtle', 'rgba(91,124,246,0.12)');
      root.style.setProperty('--status-success', '#34d399');
      root.style.setProperty('--status-warning', '#fbbf24');
      root.style.setProperty('--status-error', '#f87171');
      root.style.setProperty('--status-escalate', '#fb923c');
      root.style.setProperty('--status-running', '#60a5fa');
      root.style.setProperty('--status-review', '#c084fc');
      root.style.setProperty('--syntax-variable', '#a78bfa');
      root.style.setProperty('--syntax-string', '#86efac');
      root.style.setProperty('--syntax-comment', '#4c4c5e');
      root.style.setProperty('--syntax-keyword', '#67e8f9');
      root.style.setProperty('--mode-code', '#60a5fa');
      root.style.setProperty('--mode-creative', '#f472b6');
      root.style.setProperty('--preview-bg', '#1a1a1a');
    } else {
      root.style.setProperty('--bg-base', '#f8f8fb');
      root.style.setProperty('--bg-panel', '#ffffff');
      root.style.setProperty('--bg-surface', '#f2f2f6');
      root.style.setProperty('--bg-hover', '#ececf2');
      root.style.setProperty('--bg-active', '#e4e4ee');
      root.style.setProperty('--border', '#e2e2ea');
      root.style.setProperty('--border-subtle', '#ededf4');
      root.style.setProperty('--text-primary', '#111118');
      root.style.setProperty('--text-secondary', '#5c5c72');
      root.style.setProperty('--text-muted', '#a0a0b4');
      root.style.setProperty('--accent', '#4b6cf5');
      root.style.setProperty('--accent-hover', '#3a5be4');
      root.style.setProperty('--accent-subtle', 'rgba(75,108,245,0.08)');
      root.style.setProperty('--status-success', '#16a34a');
      root.style.setProperty('--status-warning', '#d97706');
      root.style.setProperty('--status-error', '#dc2626');
      root.style.setProperty('--status-escalate', '#ea580c');
      root.style.setProperty('--status-running', '#2563eb');
      root.style.setProperty('--status-review', '#9333ea');
      root.style.setProperty('--syntax-variable', '#7c3aed');
      root.style.setProperty('--syntax-string', '#16a34a');
      root.style.setProperty('--syntax-comment', '#a0a0b4');
      root.style.setProperty('--syntax-keyword', '#0891b2');
      root.style.setProperty('--mode-code', '#2563eb');
      root.style.setProperty('--mode-creative', '#db2777');
      root.style.setProperty('--preview-bg', '#e5e5e5');
    }
    document.body.style.background = theme === 'dark' ? '#0c0c0e' : '#f8f8fb';
    document.body.style.transition = 'background 200ms, color 200ms';
  }, [theme]);

  return (
    <I18nProvider language={language} setLanguage={setLanguage}>
      <AppContent
        theme={theme}
        setTheme={setTheme}
        page={page}
        setPage={setPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        cmdOpen={cmdOpen}
        setCmdOpen={setCmdOpen}
        selectedRun={selectedRun}
        setSelectedRun={setSelectedRun}
      />
    </I18nProvider>
  );
}

function AppContent({ theme, setTheme, page, setPage, collapsed, setCollapsed, cmdOpen, setCmdOpen, selectedRun, setSelectedRun }) {
  const { t } = useI18n();

  const pageTitles = {
    dashboard: t('nav.dashboard'),
    runs: t('nav.runs'),
    roles: t('nav.roles'),
    skills: t('nav.skills'),
    connectors: t('nav.connectors'),
    projects: t('nav.projects'),
    insights: t('nav.insights'),
  };

  const setPageAndResetRun = (nextPage) => {
    setPage(nextPage);
    setSelectedRun(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage setPage={setPage} setSelectedRun={setSelectedRun} />;
      case 'runs': return <RunsListPage selectedRun={selectedRun} setSelectedRun={setSelectedRun} />;
      case 'roles': return <RolesPage />;
      case 'skills': return <SkillsPage />;
      case 'connectors': return <ConnectorsPage />;
      case 'projects': return <ProjectsPage />;
      case 'insights': return <InsightsPage />;
      default: return <DashboardPage setPage={setPage} setSelectedRun={setSelectedRun} />;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-geist-sans), Geist Sans, -apple-system, BlinkMacSystemFont, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
      <Sidebar page={page} setPage={setPageAndResetRun} collapsed={collapsed} setCollapsed={setCollapsed} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Topbar title={pageTitles[page]} theme={theme} setTheme={setTheme} onCmdK={() => setCmdOpen(true)} />
        <main style={{ flex: 1, overflowY: 'auto' }}>{renderPage()}</main>
      </div>
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} setPage={setPageAndResetRun} />
    </div>
  );
}
