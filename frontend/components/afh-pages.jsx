'use client';

import React, { useState } from 'react';
import { CONNECTORS, INSIGHTS, PROJECTS, ROLES } from '@/lib/afh-data';
import { Button, ConnectorBadge, Icon, ModeBadge, PageWrap, SectionTitle, StatCard } from '@/components/afh-ui';
import { useI18n } from '@/components/i18n';

// afh-pages.jsx — Connectors, Roles & Prompts, Skills, Projects, Insights

// ══════════════════════════════════════════════════════════════════════════════
// AGENT CONNECTORS PAGE
// ══════════════════════════════════════════════════════════════════════════════

const ConnectorDot = ({ status }) => {
  const colors = { connected: 'var(--status-success)', rate_limited: 'var(--status-warning)', disconnected: 'var(--text-muted)', error: 'var(--status-error)' };
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: colors[status] || colors.disconnected, flexShrink: 0 }} />;
};

const ConnectorCard = ({ connector }) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [testState, setTestState] = useState(null); // null | 'testing' | 'ok' | 'fail'
  const [hov, setHov] = useState(false);

  const statusLabel = { connected: t('pages.connected'), rate_limited: t('pages.rateLimited'), disconnected: t('pages.disconnected'), error: t('pages.error') };
  const statusColor = { connected: 'var(--status-success)', rate_limited: 'var(--status-warning)', disconnected: 'var(--text-muted)', error: 'var(--status-error)' };

  const runTest = () => {
    setTestState('testing');
    setTimeout(() => setTestState(connector.status === 'connected' ? 'ok' : 'fail'), 1800);
  };

  const quotaPct = connector.quotaMax ? (connector.quotaUsed / connector.quotaMax) * 100 : null;

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--bg-panel)', border: `1px solid ${hov && !expanded ? 'var(--border)' : 'var(--border)'}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 80ms' }}>
      {/* Header row */}
      <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <ConnectorDot status={connector.status} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: connector.status === 'disconnected' ? 'var(--text-secondary)' : 'var(--text-primary)' }}>{connector.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{connector.provider}</span>
            <ConnectorBadge type={connector.type} />
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: statusColor[connector.status], fontWeight: 500 }}>{statusLabel[connector.status]}</span>
            {connector.latencyAvg && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{t('pages.latency', { latency: connector.latencyAvg })}</span>}
            {connector.error && <span style={{ fontSize: 12, color: 'var(--status-error)' }}>{connector.error}</span>}
            {connector.resetIn && <span style={{ fontSize: 12, color: 'var(--status-warning)' }}>{t('pages.resetsIn', { time: connector.resetIn })}</span>}
          </div>
        </div>

        {/* Quota bar */}
        {quotaPct !== null && (
          <div style={{ minWidth: 120, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontFamily: 'JetBrains Mono, monospace' }}>
              {connector.quotaUsed.toLocaleString()} / {connector.quotaMax.toLocaleString()} req
            </div>
            <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${quotaPct}%`, background: quotaPct >= 100 ? 'var(--status-error)' : quotaPct >= 80 ? 'var(--status-warning)' : 'var(--status-success)', borderRadius: 2, transition: 'width 400ms' }} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Button variant="ghost" size="sm" onClick={runTest} disabled={testState === 'testing'} icon={testState === 'testing' ? 'refresh' : 'activity'}>
            {testState === 'testing' ? t('pages.testing') : testState === 'ok' ? `✓ ${t('pages.ok')}` : testState === 'fail' ? `✗ ${t('pages.failed')}` : t('pages.test')}
          </Button>
          <Button variant="secondary" size="sm" icon="settings" onClick={() => setExpanded(e => !e)}>{t('pages.configure')}</Button>
        </div>
      </div>

      {/* Expanded config */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '16px 18px', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Connection */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{t('pages.connection')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t('pages.endpoint')}</label>
                  <input defaultValue={connector.endpoint} style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t('pages.apiKey')}</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input defaultValue="••••••••••••••••••••••••" type="password" style={{ flex: 1, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    <Button variant="secondary" size="sm" icon="key">{t('pages.rotate')}</Button>
                  </div>
                </div>
              </div>
            </div>
            {/* Model settings */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{t('pages.modelSettings')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t('pages.defaultModel')}</label>
                  <input defaultValue={connector.model} style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[[t('pages.temperature'), '0.7'], [t('pages.maxTokens'), '8192']].map(([l, v]) => (
                    <div key={l}>
                      <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{l}</label>
                      <input defaultValue={v} style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
            <Button variant="secondary" size="sm" onClick={() => setExpanded(false)}>{t('button.cancel')}</Button>
            <Button variant="primary" size="sm">{t('button.save')}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ConnectorsPage = () => {
  const { t } = useI18n();
  return (
    <PageWrap>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{t('pages.connectorsTitle')}</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('pages.connectorsDesc')}</p>
        </div>
        <Button variant="primary" size="md" icon="plus">{t('pages.addConnector')}</Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {CONNECTORS.map(c => <ConnectorCard key={c.id} connector={c} />)}
      </div>
    </PageWrap>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// ROLES & PROMPTS PAGE
// ══════════════════════════════════════════════════════════════════════════════

const PromptLayerEditor = ({ role }) => {
  const { t } = useI18n();
  const [activeLayer, setActiveLayer] = useState('global');
  const [prompts, setPrompts] = useState({ global: role.promptLayers.global, project: role.promptLayers.project, task: role.promptLayers.task });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const layers = [
    { id: 'global', label: 'Global', color: 'var(--accent)' },
    { id: 'project', label: 'Project', color: 'var(--status-success)' },
    { id: 'task', label: 'Task', color: 'var(--syntax-variable)' },
  ];

  const countTokens = t => Math.round(t.length / 3.8);

  const highlightText = text => text
    .replace(/(\{[^}]+\})/g, `<span style="color:var(--syntax-variable);background:rgba(167,139,250,0.1);border-radius:2px;padding:0 1px">$1</span>`)
    .replace(/(#.*)/gm, `<span style="color:var(--syntax-comment)">$1</span>`)
    .replace(/\b(Rules:|Note:|Stack:|Project:|Scene:)\b/g, `<span style="color:var(--syntax-keyword)">$1</span>`);

  const handleSave = () => { setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const totalTokens = Object.values(prompts).reduce((s, t) => s + countTokens(t), 0);

  return (
    <div>
      {/* Layer selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {layers.map(l => (
          <button key={l.id} onClick={() => setActiveLayer(l.id)} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer',
            background: activeLayer === l.id ? 'var(--bg-active)' : 'transparent',
            border: `1px solid ${activeLayer === l.id ? l.color : 'var(--border)'}`,
            color: activeLayer === l.id ? l.color : 'var(--text-secondary)',
          }}>
            {l.label}
            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              ~{countTokens(prompts[l.id])} tok
            </span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', alignSelf: 'center' }}>{t('pages.totalTokens', { tokens: totalTokens })}</span>
        {dirty && <Button variant="secondary" size="sm" onClick={() => { setPrompts({ global: role.promptLayers.global, project: role.promptLayers.project, task: role.promptLayers.task }); setDirty(false); }}>{t('button.discard')}</Button>}
        <Button variant={dirty ? 'primary' : 'secondary'} size="sm" disabled={!dirty} onClick={handleSave}>{saved ? `✓ ${t('button.saved')}` : t('button.save')}</Button>
      </div>

      {/* Editor area with highlight overlay */}
      <div style={{ position: 'relative', borderRadius: 6, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{activeLayer} prompt</span>
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
            <span><span style={{ color: 'var(--syntax-variable)' }}>{'{var}'}</span> {t('pages.variables', { var: '' }).trim()}</span>
            <span><span style={{ color: 'var(--syntax-keyword)' }}>{t('pages.keywords')}</span></span>
          </div>
        </div>
        <textarea
          value={prompts[activeLayer]}
          onChange={e => { setPrompts(p => ({ ...p, [activeLayer]: e.target.value })); setDirty(true); setSaved(false); }}
          spellCheck={false}
          style={{
            width: '100%', height: 260, padding: '12px 14px', background: 'var(--bg-surface)',
            border: 'none', outline: 'none', resize: 'vertical',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13, lineHeight: 1.65,
            color: 'var(--text-primary)', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Stack preview */}
      <div style={{ marginTop: 10 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{t('pages.stackPreview')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {layers.map(l => (
            <div key={l.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: l.id === activeLayer ? l.color : 'var(--text-muted)', fontWeight: l.id === activeLayer ? 500 : 400, textTransform: 'uppercase', letterSpacing: '0.05em', width: 52, flexShrink: 0 }}>{l.label}</span>
              <div style={{ flex: 1, height: 4, background: l.id === activeLayer ? l.color : 'var(--bg-surface)', borderRadius: 2, opacity: l.id === activeLayer ? 0.7 : 0.3 }} />
              <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>~{countTokens(prompts[l.id])} tok</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RolesPage = () => {
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState(null);
  const role = ROLES.find(r => r.id === selectedRole);

  return (
    <PageWrap>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Role list */}
        <div>
          <SectionTitle>{t('pages.roles')}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ROLES.map(r => (
              <div key={r.id} onClick={() => setSelectedRole(r.id)}
                style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${selectedRole === r.id ? 'var(--accent)' : 'var(--border)'}`, background: selectedRole === r.id ? 'var(--accent-subtle)' : 'var(--bg-panel)' }}
                onMouseEnter={e => { if (selectedRole !== r.id) e.currentTarget.style.borderColor = 'var(--border)'; }}
                onMouseLeave={e => { if (selectedRole !== r.id) e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ModeBadge mode={r.mode} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{r.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div>
          {role ? (
            <div style={{ }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{role.name}</h2>
                <ModeBadge mode={role.mode} />
              </div>
              <PromptLayerEditor role={role} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-panel)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {t('pages.selectRole')}
            </div>
          )}
        </div>
      </div>
    </PageWrap>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// SKILLS PAGE
// ══════════════════════════════════════════════════════════════════════════════

const SKILLS = [
  { id: 'sql-schema-reader', name: 'SQL Schema Reader', enabled: true, mode: 'code', roles: ['Backend Engineer', 'Data Engineer'], description: 'Reads relevant schema tables based on task context' },
  { id: 'test-runner', name: 'Test Runner', enabled: true, mode: 'code', roles: ['Backend Engineer', 'Security Engineer', 'Data Engineer', 'Frontend Engineer'], description: 'Executes test suite and parses structured failure output' },
  { id: 'git-diff', name: 'Git Diff', enabled: true, mode: 'code', roles: ['Backend Engineer'], description: 'Injects recent uncommitted changes as context' },
  { id: 'security-scanner', name: 'Security Scanner', enabled: true, mode: 'code', roles: ['Security Engineer'], description: 'Runs semgrep rules and injects findings into context' },
  { id: 'go-analyzer', name: 'Go Analyzer', enabled: true, mode: 'code', roles: ['Security Engineer'], description: 'Parses Go interfaces and injects type definitions' },
  { id: 'python-analyzer', name: 'Python Analyzer', enabled: true, mode: 'code', roles: ['Data Engineer'], description: 'Resolves imports and injects module signatures' },
  { id: 'ts-analyzer', name: 'TypeScript Analyzer', enabled: true, mode: 'code', roles: ['Frontend Engineer'], description: 'Resolves types, interfaces, and component props' },
  { id: 'style-extractor', name: 'Style Reference Extractor', enabled: true, mode: 'creative', roles: ['Creative Director'], description: 'Analyzes reference images and synthesizes a unified style prompt' },
  { id: 'scene-splitter', name: 'Scene Splitter', enabled: true, mode: 'creative', roles: ['Creative Director'], description: 'Breaks script into scenes with duration and visual cues' },
  { id: 'asset-validator', name: 'Asset Validator', enabled: false, mode: 'creative', roles: ['Creative Director'], description: 'Validates generated assets meet aspect ratio and resolution requirements' },
  { id: 'api-doc-gen', name: 'API Doc Generator', enabled: false, mode: 'code', roles: ['Backend Engineer'], description: 'Generates OpenAPI spec from route definitions' },
];

export const SkillsPage = () => {
  const { t } = useI18n();
  const [skills, setSkills] = useState(SKILLS);
  const [modeFilter, setModeFilter] = useState('all');

  const toggle = id => setSkills(ss => ss.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  const filtered = modeFilter === 'all' ? skills : skills.filter(s => s.mode === modeFilter);

  return (
    <PageWrap>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>{t('pages.skillsTitle')}</h2>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'code', 'creative'].map(m => (
            <button key={m} onClick={() => setModeFilter(m)} style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
              background: modeFilter === m ? 'var(--bg-active)' : 'transparent',
              border: '1px solid var(--border)',
              color: modeFilter === m ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}>{m === 'all' ? t('button.all') : t(`mode.${m}`)}</button>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t('pages.skillsTitle'), t('table.mode'), t('pages.rolesColumn'), t('pages.description'), t('pages.enabled')].map((h, index) => (
                <th key={h} style={{ padding: '9px 16px', textAlign: index === 4 ? 'center' : 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((skill, i) => (
              <React.Fragment key={skill.id}>
                <tr>
                  <td style={{ padding: '11px 16px' }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{skill.name}</span>
                  </td>
                  <td style={{ padding: '11px 16px' }}><ModeBadge mode={skill.mode} /></td>
                  <td style={{ padding: '11px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {skill.roles.map(r => (
                        <span key={r} style={{ fontSize: 11, padding: '1px 6px', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>{r.split(' ')[0]}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px', maxWidth: 300 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{skill.description}</span>
                  </td>
                  <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                    <button onClick={() => toggle(skill.id)} style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: skill.enabled ? 'var(--status-success)' : 'var(--bg-hover)',
                      position: 'relative', transition: 'background 150ms',
                    }}>
                      <div style={{
                        width: 14, height: 14, borderRadius: '50%', background: '#fff',
                        position: 'absolute', top: 3, left: skill.enabled ? 19 : 3,
                        transition: 'left 150ms', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </td>
                </tr>
                {i < filtered.length - 1 && <tr><td colSpan={5} style={{ padding: 0 }}><div style={{ height: 1, background: 'var(--border-subtle)' }} /></td></tr>}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrap>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS PAGE
// ══════════════════════════════════════════════════════════════════════════════

export const ProjectsPage = () => {
  const { t } = useI18n();
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [newMode, setNewMode] = useState('code');
  const proj = PROJECTS.find(p => p.id === selected);

  return (
    <PageWrap>
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Project list */}
        <div>
          <SectionTitle action={<Button variant="primary" size="sm" icon="plus" onClick={() => setShowNew(true)}>{t('button.new')}</Button>}>{t('pages.projectsTitle')}</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PROJECTS.map(p => (
              <div key={p.id} onClick={() => { setSelected(p.id); setShowNew(false); }}
                style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${selected === p.id ? 'var(--accent)' : 'var(--border)'}`, background: selected === p.id ? 'var(--accent-subtle)' : 'var(--bg-panel)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <ModeBadge mode={p.mode} />
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.stack.map(s => <span key={s} style={{ fontSize: 11, padding: '1px 5px', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Project detail / new form */}
        <div>
          {showNew ? (
            <div style={{ }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>{t('pages.newProject')}</h2>
              {/* Mode selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{t('table.mode')}</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { mode: 'code', title: t('pages.codeMode'), desc: t('pages.codeModeDesc'), icon: 'code' },
                    { mode: 'creative', title: t('pages.creativeMode'), desc: t('pages.creativeModeDesc'), icon: 'film' },
                  ].map(opt => (
                    <div key={opt.mode} onClick={() => setNewMode(opt.mode)}
                      style={{
                        padding: '14px 16px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${newMode === opt.mode ? (opt.mode === 'code' ? 'var(--mode-code)' : 'var(--mode-creative)') : 'var(--border)'}`,
                        background: newMode === opt.mode ? (opt.mode === 'code' ? 'rgba(96,165,250,0.06)' : 'rgba(244,114,182,0.06)') : 'var(--bg-panel)',
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Icon name={opt.icon} size={16} style={{ color: opt.mode === 'code' ? 'var(--mode-code)' : 'var(--mode-creative)' }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{opt.title}</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{opt.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Basic fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[[t('pages.name'), 'my-project'], [t('pages.stack'), newMode === 'code' ? 'Node.js, PostgreSQL' : 'Gemini, Runway']].map(([l, ph]) => (
                  <div key={l}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{l}</label>
                    <input placeholder={ph} style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                ))}
                {newMode === 'code' && (
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{t('pages.testCommand')}</label>
                    <input placeholder="npm test" style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Button variant="primary" size="md">{t('pages.createProject')}</Button>
                  <Button variant="secondary" size="md" onClick={() => setShowNew(false)}>{t('button.cancel')}</Button>
                </div>
              </div>
            </div>
          ) : proj ? (
            <div style={{ }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{proj.name}</h2>
                <ModeBadge mode={proj.mode} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: t('pages.stack'), value: proj.stack.join(', ') },
                  { label: t('pages.activeRole'), value: proj.activeRole },
                  ...(proj.testCmd ? [{ label: t('pages.testCommand'), value: proj.testCmd, mono: true }] : []),
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>
                    <input defaultValue={value} style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit', outline: 'none', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.target.style.borderColor = 'var(--border)'} />
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Button variant="primary" size="md">{t('pages.saveChanges')}</Button>
                  <Button variant="danger" size="md">{t('button.deleteProject')}</Button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-panel)', borderRadius: 8, border: '1px solid var(--border)' }}>
              {t('pages.selectProject')}
            </div>
          )}
        </div>
      </div>
    </PageWrap>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// INSIGHTS PAGE
// ══════════════════════════════════════════════════════════════════════════════

const MiniChart = ({ data, color, height = 48 }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200, h = height;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity={0.08} stroke="none" />
    </svg>
  );
};

export const InsightsPage = () => {
  const { t } = useI18n();
  const d = INSIGHTS;
  const s = d.todaySummary;
  const dates = d.firstPassRate.map(r => r.date);

  return (
    <PageWrap>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 20 }}>{t('pages.insightsTitle')}</h2>

      {/* Today summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard label={t('pages.codeSuccessRate')} value={`${Math.round(s.codeSuccess / s.codeRuns * 100)}%`} sub={`${s.codeSuccess}/${s.codeRuns} runs`} color="var(--mode-code)" />
        <StatCard label={t('pages.creativeApprovalRate')} value={`${Math.round(s.creativeApproved / s.creativeRuns * 100)}%`} sub={`${s.creativeApproved}/${s.creativeRuns} runs`} color="var(--mode-creative)" />
        <StatCard label={t('pages.totalTokensMetric')} value={`${(s.tokensTotal / 1000).toFixed(0)}k`} sub={t('dashboard.tokensSub')} />
        <StatCard label={t('pages.estimatedCostMetric')} value={`$${s.estimatedCost.toFixed(2)}`} sub={t('dashboard.costSub')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* First pass rate */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{t('pages.firstPassRate')}</span>
            <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
              <span style={{ color: 'var(--mode-code)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: 'var(--mode-code)', display: 'inline-block', borderRadius: 1 }} />Code</span>
              <span style={{ color: 'var(--mode-creative)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: 'var(--mode-creative)', display: 'inline-block', borderRadius: 1 }} />Creative</span>
            </div>
          </div>
          <div style={{ position: 'relative', height: 80, overflow: 'visible' }}>
            <MiniChart data={d.firstPassRate.map(r => r.code)} color="var(--mode-code)" height={70} />
            <div style={{ position: 'absolute', top: 0, left: 0 }}>
              <MiniChart data={d.firstPassRate.map(r => r.creative)} color="var(--mode-creative)" height={70} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {dates.map(d => <span key={d} style={{ fontSize: 10, color: 'var(--text-muted)' }}>{d.split(' ')[1]}</span>)}
          </div>
        </div>

        {/* Avg fix attempts (code) */}
        <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 14 }}>{t('pages.avgFixAttempts')}</div>
          <div style={{ height: 70 }}>
            <MiniChart data={d.avgFixAttempts} color="var(--status-warning)" height={60} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            {dates.map(dt => <span key={dt} style={{ fontSize: 10, color: 'var(--text-muted)' }}>{dt.split(' ')[1]}</span>)}
          </div>
        </div>
      </div>

      {/* Per-project breakdown */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{t('pages.usageByProject')}</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t('table.project'), t('table.mode'), t('dashboard.tokens'), t('pages.estCost'), ''].map(h => (
                <th key={h} style={{ padding: '8px 18px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.tokensByProject.map((p, i) => {
              const maxTokens = Math.max(...d.tokensByProject.map(x => x.tokens));
              return (
                <React.Fragment key={p.project}>
                  <tr>
                    <td style={{ padding: '11px 18px' }}><span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{p.project}</span></td>
                    <td style={{ padding: '11px 18px' }}><ModeBadge mode={p.mode} /></td>
                    <td style={{ padding: '11px 18px' }}><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{(p.tokens / 1000).toFixed(1)}k</span></td>
                    <td style={{ padding: '11px 18px' }}><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: p.mode === 'creative' ? 'var(--mode-creative)' : 'var(--text-secondary)' }}>${p.cost.toFixed(2)}</span></td>
                    <td style={{ padding: '11px 18px', width: 160 }}>
                      <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(p.tokens / maxTokens) * 100}%`, background: p.mode === 'creative' ? 'var(--mode-creative)' : 'var(--mode-code)', borderRadius: 2 }} />
                      </div>
                    </td>
                  </tr>
                  {i < d.tokensByProject.length - 1 && <tr><td colSpan={5} style={{ padding: 0 }}><div style={{ height: 1, background: 'var(--border-subtle)' }} /></td></tr>}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageWrap>
  );
};

