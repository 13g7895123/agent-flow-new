// afh-ui.jsx — Shared UI components v3

const { useState, useEffect, useRef } = React;

// ── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 16, style: s = {} }) => {
  const p = {
    dashboard: 'M3 3h7v7H3zm0 9h7v7H3zm9-9h7v7h-7zm0 9h7v7h-7z',
    runs: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    roles: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
    skills: 'M13 10V3L4 14h7v7l9-11h-7z',
    projects: 'M3 7l9-4 9 4v10l-9 4-9-4V7zm9 0v10M3 7l9 4 9-4',
    connectors: 'M5 12h14M12 5l7 7-7 7M2 12h1M21 12h1',
    insights: 'M18 20V10M12 20V4M6 20v-6',
    chevronLeft: 'M15 18l-6-6 6-6',
    chevronRight: 'M9 18l6-6-6-6',
    chevronDown: 'M6 9l6 6 6-6',
    chevronUp: 'M18 15l-6-6-6 6',
    sun: 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 5a7 7 0 100 14A7 7 0 0012 5z',
    moon: 'M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z',
    search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
    x: 'M18 6L6 18M6 6l12 12',
    check: 'M20 6L9 17l-5-5',
    warning: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01',
    pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
    play: 'M5 3l14 9-14 9V3z',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
    film: 'M2 8h20M2 16h20M6 2v20M18 2v20M2 2h20a2 2 0 012 2v16a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2z',
    image: 'M21 15l-5-5L5 20M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2zm6.5 6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z',
    send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
    clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
    thumbsUp: 'M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3',
    thumbsDown: 'M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17',
    plus: 'M12 5v14M5 12h14',
    settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z',
    key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    link: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71',
    grid: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z',
    list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
    maximize: 'M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3',
    gitCompare: 'M18 6a3 3 0 100-6 3 3 0 000 6zM6 18a3 3 0 100-6 3 3 0 000 6zM18 6v6a6 6 0 01-6 6H6M6 18V12a6 6 0 016-6h6',
  };
  const d = p[name];
  if (!d) return <svg width={size} height={size} viewBox="0 0 24 24" style={s} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.75} strokeLinecap="round"
      strokeLinejoin="round" style={s}>
      <path d={d} />
    </svg>
  );
};

// ── Status config ─────────────────────────────────────────────────────────────
const statusConfig = {
  running:        { label: 'Running',       color: 'var(--status-running)',   bg: 'rgba(96,165,250,0.12)' },
  success:        { label: 'Success',       color: 'var(--status-success)',   bg: 'rgba(52,211,153,0.12)' },
  failed:         { label: 'Failed',        color: 'var(--status-error)',     bg: 'rgba(248,113,113,0.12)' },
  escalated:      { label: 'Escalated',     color: 'var(--status-escalate)', bg: 'rgba(251,146,60,0.12)' },
  pending:        { label: 'Pending',       color: 'var(--text-muted)',       bg: 'var(--bg-surface)' },
  waiting_review: { label: 'Needs Review',  color: 'var(--status-review)',    bg: 'rgba(192,132,252,0.12)' },
};

const StatusBadge = ({ status, size = 'sm' }) => {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: cfg.bg, color: cfg.color,
      borderRadius: 4, padding: size === 'sm' ? '2px 6px' : '3px 8px',
      fontSize: size === 'sm' ? 11 : 12, fontWeight: 500, whiteSpace: 'nowrap',
    }}>
      {status === 'running' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, animation: 'pulse-dot 1.4s infinite' }} />}
      {status === 'waiting_review' && <Icon name="pause" size={9} />}
      {cfg.label}
    </span>
  );
};

// ── Mode badge ────────────────────────────────────────────────────────────────
const ModeBadge = ({ mode }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase',
    background: mode === 'code'
      ? 'rgba(96,165,250,0.12)' : 'rgba(244,114,182,0.12)',
    color: mode === 'code' ? 'var(--mode-code)' : 'var(--mode-creative)',
  }}>
    <Icon name={mode === 'code' ? 'code' : 'film'} size={9} />
    {mode === 'code' ? 'Code' : 'Creative'}
  </span>
);

// ── Connector type badge ──────────────────────────────────────────────────────
const ConnectorBadge = ({ type }) => {
  const labels = { llm: 'LLM', image_gen: 'Image Gen', video_gen: 'Video Gen', processor: 'Processor' };
  return (
    <span style={{
      fontSize: 10, padding: '2px 6px', borderRadius: 3,
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      color: 'var(--text-muted)', fontWeight: 500,
    }}>{labels[type] || type}</span>
  );
};

// ── Button ────────────────────────────────────────────────────────────────────
const Button = ({ children, variant = 'secondary', size = 'sm', onClick, disabled, style: xs = {}, icon }) => {
  const [hov, setHov] = useState(false);
  const sizes = { sm: { fontSize: 12, padding: '5px 10px' }, md: { fontSize: 13, padding: '7px 14px' }, lg: { fontSize: 14, padding: '9px 18px' } };
  const variants = {
    primary:   { background: hov ? 'var(--accent-hover)' : 'var(--accent)', color: '#fff', border: 'none' },
    secondary: { background: hov ? 'var(--bg-hover)' : 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)' },
    ghost:     { background: hov ? 'var(--bg-hover)' : 'transparent', color: hov ? 'var(--text-primary)' : 'var(--text-secondary)', border: 'none' },
    danger:    { background: hov ? 'rgba(248,113,113,0.12)' : 'transparent', color: 'var(--status-error)', border: '1px solid rgba(248,113,113,0.3)' },
    approve:   { background: hov ? '#16a34a' : 'var(--status-success)', color: '#fff', border: 'none' },
    reject:    { background: hov ? 'rgba(248,113,113,0.15)' : 'transparent', color: 'var(--status-error)', border: '1px solid rgba(248,113,113,0.35)' },
  };
  return (
    <button onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick} disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 6,
        fontFamily: 'inherit', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background 80ms, border-color 80ms', opacity: disabled ? 0.5 : 1,
        ...sizes[size], ...variants[variant], ...xs }}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </button>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',       icon: 'dashboard' },
  { id: 'runs',       label: 'Runs',             icon: 'runs' },
  { id: 'roles',      label: 'Roles & Prompts',  icon: 'roles' },
  { id: 'skills',     label: 'Skills',           icon: 'skills' },
  { id: 'connectors', label: 'Agent Connectors', icon: 'connectors' },
  { id: 'projects',   label: 'Projects',         icon: 'projects' },
  { id: 'insights',   label: 'Insights',         icon: 'insights' },
];

const Sidebar = ({ page, setPage, collapsed, setCollapsed }) => (
  <aside style={{
    width: collapsed ? 64 : 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
    background: 'var(--bg-panel)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', transition: 'width 200ms ease', zIndex: 20,
  }}>
    <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: collapsed ? '0 20px' : '0 16px', borderBottom: '1px solid var(--border)', gap: 10, overflow: 'hidden' }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="zap" size={13} style={{ color: '#fff' }} />
      </div>
      {!collapsed && <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>Agent Flow</span>}
    </div>
    <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
      {NAV_ITEMS.map(item => {
        const active = page === item.id;
        const [hov, setHov] = useState(false);
        return (
          <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '8px 20px' : '7px 16px',
              background: active ? 'var(--bg-active)' : hov ? 'var(--bg-hover)' : 'transparent',
              border: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start',
              transition: 'background 80ms',
            }}>
            <span style={{ color: active ? 'var(--accent)' : hov ? 'var(--text-primary)' : 'var(--text-secondary)', flexShrink: 0 }}>
              <Icon name={item.icon} size={16} />
            </span>
            {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{item.label}</span>}
          </button>
        );
      })}
    </nav>
    <div style={{ padding: 8, borderTop: '1px solid var(--border)' }}>
      <button onClick={() => setCollapsed(c => !c)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 8, padding: '7px 8px', borderRadius: 6, background: 'transparent', border: 'none',
        cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12,
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
        <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
        {!collapsed && 'Collapse'}
      </button>
    </div>
  </aside>
);

// ── Topbar ────────────────────────────────────────────────────────────────────
const Topbar = ({ title, theme, setTheme, onCmdK, rightSlot }) => (
  <header style={{
    height: 52, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12,
    background: 'var(--bg-panel)', borderBottom: '1px solid var(--border)',
    position: 'sticky', top: 0, zIndex: 10, flexShrink: 0,
  }}>
    <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{title}</h1>
    {rightSlot}
    <button onClick={onCmdK} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 6,
      border: '1px solid var(--border)', background: 'var(--bg-surface)',
      color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
      <Icon name="search" size={12} />
      <span>Search</span>
      <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '1px 4px', borderRadius: 3, background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>⌘K</kbd>
    </button>
    <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{
      width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)',
      background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={14} />
    </button>
  </header>
);

// ── Command Palette ───────────────────────────────────────────────────────────
const CommandPalette = ({ open, onClose, setPage }) => {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);

  const all = [
    ...NAV_ITEMS.map(n => ({ type: 'page', id: n.id, label: n.label, icon: n.icon })),
    ...RUNS.map(r => ({ type: 'run', id: r.id, label: `${r.id} — ${r.task}`, sub: r.project, icon: r.mode === 'creative' ? 'film' : 'runs', status: r.status, mode: r.mode })),
    ...PROJECTS.map(p => ({ type: 'project', id: p.id, label: p.name, sub: p.mode === 'creative' ? 'Creative' : 'Code', icon: 'projects', mode: p.mode })),
  ];

  const filtered = query ? all.filter(i => i.label.toLowerCase().includes(query.toLowerCase()) || (i.sub || '').toLowerCase().includes(query.toLowerCase())) : all.slice(0, 10);

  useEffect(() => { if (open) { setQuery(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 50); } }, [open]);
  useEffect(() => setSel(0), [query]);

  const handleKey = e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[sel]) { pick(filtered[sel]); }
    if (e.key === 'Escape') onClose();
  };

  const pick = item => {
    const dest = item.type === 'page' ? item.id : item.type === 'project' ? 'projects' : 'runs';
    setPage(dest); onClose();
  };

  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 580, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 24px 64px rgba(0,0,0,0.45)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
          <Icon name="search" size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKey}
            placeholder="Search runs, projects, pages..."
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 14, color: 'var(--text-primary)', padding: '14px 0', fontFamily: 'inherit' }} />
          {query && <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><Icon name="x" size={14} /></button>}
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '6px 0' }}>
          {filtered.length === 0
            ? <div style={{ padding: '20px 16px', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>No results for "{query}"</div>
            : filtered.map((item, i) => (
              <button key={item.id + i} onClick={() => pick(item)} onMouseEnter={() => setSel(i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', background: i === sel ? 'var(--bg-hover)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                <Icon name={item.icon} size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-primary)' }}>{item.label}</span>
                {item.sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sub}</span>}
                {item.status && <StatusBadge status={item.status} />}
                {item.mode && <ModeBadge mode={item.mode} />}
              </button>
            ))
          }
        </div>
        <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 12 }}>
          {[['↑↓','navigate'],['↵','select'],['esc','close']].map(([k,l]) => (
            <span key={k} style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, padding: '1px 4px', borderRadius: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>{k}</kbd>{l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Reusable layout helpers ───────────────────────────────────────────────────
const PageWrap = ({ children }) => (
  <div style={{ padding: 24, maxWidth: 1440 }}>{children}</div>
);

const SectionTitle = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
    <h2 style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{children}</h2>
    {action}
  </div>
);

const StatCard = ({ label, value, sub, color }) => (
  <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px' }}>
    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 32, fontWeight: 600, color: color || 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
  </div>
);

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
    {tabs.map(tab => (
      <button key={tab.id} onClick={() => onChange(tab.id)} style={{
        padding: '8px 16px', background: 'transparent', border: 'none',
        borderBottom: active === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
        marginBottom: -1, cursor: 'pointer', fontSize: 13,
        color: active === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: active === tab.id ? 500 : 400, fontFamily: 'inherit',
      }}>
        {tab.label}
        {tab.count != null && (
          <span style={{ marginLeft: 6, fontSize: 11, padding: '1px 5px', borderRadius: 10, background: active === tab.id ? 'var(--accent-subtle)' : 'var(--bg-surface)', color: active === tab.id ? 'var(--accent)' : 'var(--text-muted)' }}>{tab.count}</span>
        )}
      </button>
    ))}
  </div>
);

// ── Asset Placeholder (simulates generated image/video) ───────────────────────
const AssetPlaceholder = ({ color = '#1a2030', aspectRatio = '16:9', label, status, version }) => {
  const [w, h] = aspectRatio.split(':').map(Number);
  const pb = `${(h / w) * 100}%`;
  const statusOverlay = {
    approved: { color: 'var(--status-success)', icon: 'check', label: 'Approved' },
    rejected: { color: 'var(--status-error)', icon: 'x', label: 'Rejected' },
    pending:  { color: 'var(--status-review)', icon: 'eye', label: 'Review' },
    generating: { color: 'var(--text-muted)', icon: 'refresh', label: 'Generating…' },
  };
  const ov = statusOverlay[status] || statusOverlay.pending;
  return (
    <div style={{ position: 'relative', paddingBottom: pb, background: '#1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
      {/* Placeholder stripes */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.06 }}>
          <defs>
            <pattern id={`stripe-${version}`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
              <line x1="0" y1="16" x2="16" y2="0" stroke="white" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#stripe-${version})`} />
        </svg>
        <div style={{ position: 'relative', textAlign: 'center', padding: 8 }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>
            {label}
          </div>
        </div>
      </div>
      {/* Status badge */}
      <div style={{
        position: 'absolute', bottom: 6, left: 6,
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(0,0,0,0.7)', borderRadius: 4,
        padding: '3px 6px', backdropFilter: 'blur(4px)',
      }}>
        <Icon name={ov.icon} size={10} style={{ color: ov.color }} />
        <span style={{ fontSize: 10, color: ov.color, fontWeight: 500 }}>{ov.label}</span>
      </div>
      {/* Version */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        background: 'rgba(0,0,0,0.65)', borderRadius: 3,
        padding: '2px 6px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'rgba(255,255,255,0.7)',
      }}>v{version}</div>
      {/* Generating spinner */}
      {status === 'generating' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 22, height: 22, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.7)', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  Icon, StatusBadge, ModeBadge, ConnectorBadge, Button,
  Sidebar, Topbar, CommandPalette,
  PageWrap, SectionTitle, StatCard, Tabs, AssetPlaceholder,
  statusConfig, NAV_ITEMS,
});
