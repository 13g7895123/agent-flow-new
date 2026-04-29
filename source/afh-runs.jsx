// afh-runs.jsx — Run list + Code Mode run detail

const { useState, useEffect } = React;

// ── Code Diff Viewer ──────────────────────────────────────────────────────────
const DiffViewer = ({ before, after }) => {
  const [mode, setMode] = useState('split');
  const bLines = before.split('\n');
  const aLines = after.split('\n');

  const hl = line => line
    .replace(/(\/\/.*)/g, '<span style="color:var(--syntax-comment)">$1</span>')
    .replace(/('.*?'|".*?")/g, '<span style="color:var(--syntax-string)">$1</span>')
    .replace(/\b(const|require|use|router|module)\b/g, '<span style="color:var(--syntax-keyword)">$1</span>');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Code Diff</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {['split','unified'].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: '3px 8px', fontSize: 11, borderRadius: 4, fontFamily: 'inherit', cursor: 'pointer',
              background: mode === m ? 'var(--bg-active)' : 'transparent',
              border: '1px solid var(--border)',
              color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>{m}</button>
          ))}
        </div>
      </div>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border)', overflow: 'auto', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}>
        {mode === 'split' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {[{ lines: bLines, label: 'before', color: 'var(--status-error)', bg: 'rgba(248,113,113,0.05)' },
              { lines: aLines, label: 'after',  color: 'var(--status-success)', bg: 'rgba(52,211,153,0.05)' }].map(({ lines, label, color, bg }) => (
              <div key={label} style={{ borderRight: label === 'before' ? '1px solid var(--border)' : 'none' }}>
                <div style={{ padding: '5px 12px', fontSize: 11, color, borderBottom: '1px solid var(--border)', background: bg }}>{label}</div>
                {lines.map((line, i) => {
                  const isNew = label === 'after' && !bLines.includes(line) && line.trim();
                  return (
                    <div key={i} style={{ display: 'flex', lineHeight: '20px', background: isNew ? 'rgba(52,211,153,0.06)' : 'transparent' }}>
                      <span style={{ width: 34, flexShrink: 0, color: 'var(--text-muted)', padding: '0 8px', userSelect: 'none', fontSize: 10, borderRight: '1px solid var(--border-subtle)', textAlign: 'right' }}>{i + 1}</span>
                      <span style={{ padding: '0 10px', whiteSpace: 'pre', color: isNew ? 'var(--status-success)' : 'var(--text-secondary)' }}
                        dangerouslySetInnerHTML={{ __html: hl(line) || ' ' }} />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div>
            {Array.from({ length: Math.max(bLines.length, aLines.length) }, (_, i) => {
              const b = bLines[i] || '', a = aLines[i] || '';
              const removed = b && !aLines.includes(b) && b.trim();
              const added = a && !bLines.includes(a) && a.trim();
              if (!removed && !added) return (
                <div key={i} style={{ display: 'flex', lineHeight: '20px' }}>
                  <span style={{ width: 24, textAlign: 'center', color: 'var(--text-muted)', userSelect: 'none' }}> </span>
                  <span style={{ padding: '0 8px', whiteSpace: 'pre', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: hl(b || a) }} />
                </div>
              );
              return (
                <React.Fragment key={i}>
                  {removed && <div style={{ display: 'flex', lineHeight: '20px', background: 'rgba(248,113,113,0.08)' }}>
                    <span style={{ width: 24, color: 'var(--status-error)', textAlign: 'center', userSelect: 'none' }}>-</span>
                    <span style={{ padding: '0 8px', whiteSpace: 'pre', color: 'var(--status-error)' }} dangerouslySetInnerHTML={{ __html: hl(b) }} />
                  </div>}
                  {added && <div style={{ display: 'flex', lineHeight: '20px', background: 'rgba(52,211,153,0.07)' }}>
                    <span style={{ width: 24, color: 'var(--status-success)', textAlign: 'center', userSelect: 'none' }}>+</span>
                    <span style={{ padding: '0 8px', whiteSpace: 'pre', color: 'var(--status-success)' }} dangerouslySetInnerHTML={{ __html: hl(a) }} />
                  </div>}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Test Results ──────────────────────────────────────────────────────────────
const TestPanel = ({ results }) => {
  const [expanded, setExpanded] = useState(null);
  const pass = results.filter(r => r.status === 'pass').length;
  const fail = results.length - pass;
  const errColors = { TimeoutError: 'var(--status-warning)', TypeError: 'var(--status-error)', AssertionError: 'var(--status-escalate)', BuildError: 'var(--status-error)' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 5, background: 'var(--bg-surface)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${(pass / results.length) * 100}%`, background: 'var(--status-success)', transition: 'width 400ms' }} />
          <div style={{ width: `${(fail / results.length) * 100}%`, background: 'var(--status-error)' }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--status-success)', fontFamily: 'JetBrains Mono, monospace' }}>{pass} pass</span>
        <span style={{ fontSize: 12, color: 'var(--status-error)', fontFamily: 'JetBrains Mono, monospace' }}>{fail} fail</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {results.map((t, i) => (
          <div key={i}>
            <div onClick={() => t.status === 'fail' && setExpanded(expanded === i ? null : i)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, cursor: t.status === 'fail' ? 'pointer' : 'default', border: `1px solid ${t.status === 'fail' ? 'rgba(248,113,113,0.2)' : 'var(--border)'}`, background: expanded === i ? 'var(--bg-surface)' : 'var(--bg-panel)' }}>
              <Icon name={t.status === 'pass' ? 'check' : 'x'} size={12} style={{ color: t.status === 'pass' ? 'var(--status-success)' : 'var(--status-error)', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{t.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{t.duration}</span>
              {t.errorType && <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 3, background: `${errColors[t.errorType] || 'var(--text-muted)'}22`, color: errColors[t.errorType] || 'var(--text-muted)', fontWeight: 500 }}>{t.errorType}</span>}
              {t.status === 'fail' && <Icon name={expanded === i ? 'chevronUp' : 'chevronDown'} size={12} style={{ color: 'var(--text-muted)' }} />}
            </div>
            {expanded === i && t.error && (
              <div style={{ padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: '0 0 6px 6px', border: '1px solid rgba(248,113,113,0.15)', borderTop: 'none' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{t.file}:{t.line}</div>
                <pre style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--status-error)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{t.error}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Context Viewer ────────────────────────────────────────────────────────────
const ContextViewer = ({ breakdown }) => {
  const [expanded, setExpanded] = useState(null);
  const total = breakdown.reduce((s, b) => s + b.tokens, 0);
  const colors = ['var(--accent)', 'var(--status-success)', 'var(--syntax-variable)', 'var(--status-warning)', 'var(--syntax-keyword)', 'var(--text-secondary)'];
  return (
    <div>
      <div style={{ height: 7, borderRadius: 4, overflow: 'hidden', display: 'flex', gap: 1, marginBottom: 14 }}>
        {breakdown.map((b, i) => <div key={i} style={{ width: `${b.pct}%`, background: colors[i % colors.length] }} />)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {breakdown.map((b, i) => (
          <div key={i}>
            <div onClick={() => setExpanded(expanded === i ? null : i)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 6, cursor: 'pointer', background: expanded === i ? 'var(--bg-active)' : 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div style={{ width: 9, height: 9, borderRadius: 2, background: colors[i % colors.length], flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{b.name}</span>
              <div style={{ width: 72, height: 3, background: 'var(--bg-hover)', borderRadius: 2, alignSelf: 'center' }}>
                <div style={{ width: `${b.pct}%`, height: '100%', background: colors[i % colors.length], borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)', width: 52, textAlign: 'right' }}>{b.tokens.toLocaleString()}</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{b.pct}%</span>
              <Icon name={expanded === i ? 'chevronUp' : 'chevronDown'} size={11} style={{ color: 'var(--text-muted)' }} />
            </div>
            {expanded === i && (
              <div style={{ padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: '0 0 6px 6px', border: '1px solid var(--border)', borderTop: 'none', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>
                — content preview not available in this view —
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total context</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{total.toLocaleString()} tok · {(total / 130000 * 100).toFixed(0)}% of window</span>
      </div>
    </div>
  );
};

// ── Escalation Banner ─────────────────────────────────────────────────────────
const EscalationBanner = ({ run }) => {
  const [hint, setHint] = useState('');
  const [submitted, setSubmitted] = useState(false);
  return (
    <div style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.25)', borderRadius: 8, padding: 16, marginBottom: 16, animation: 'slideRight 400ms ease' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Icon name="warning" size={18} style={{ color: 'var(--status-escalate)', flexShrink: 0, marginTop: 1 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--status-escalate)', marginBottom: 4 }}>Human Intervention Required</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            Run exhausted {run.maxFix} fix attempts. {run.testFail} test{run.testFail !== 1 ? 's' : ''} still failing.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[['Attempts used', `${run.fixAttempts}/${run.maxFix}`], ['Tests failing', `${run.testFail}`], ['Duration', run.duration]].map(([l, v]) => (
              <div key={l} style={{ padding: '8px 10px', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>{v}</div>
              </div>
            ))}
          </div>
          {!submitted ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={hint} onChange={e => setHint(e.target.value)}
                placeholder="Hint for next attempt… (e.g. 'upsert needs ON CONFLICT (cart_id)')"
                style={{ flex: 1, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 12px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'} />
              <Button variant="primary" size="md" icon="send" onClick={() => hint.trim() && setSubmitted(true)}>Resume</Button>
              <Button variant="danger" size="md">Abort</Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--status-success)', fontSize: 13 }}>
              <Icon name="check" size={14} />Hint submitted — run will resume shortly
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Step Timeline ─────────────────────────────────────────────────────────────
const StepTimeline = ({ steps, selected, onSelect, mode = 'code' }) => {
  const dotColor = s => ({
    success: 'var(--status-success)', failed: 'var(--status-error)',
    running: 'var(--status-running)', pending: 'var(--bg-active)',
    escalated: 'var(--status-escalate)', waiting_review: 'var(--status-review)',
  })[s] || 'var(--bg-active)';

  const dotIcon = s => ({
    success: <Icon name="check" size={10} />,
    failed:  <Icon name="x" size={10} />,
    running: <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--status-running)', animation: 'pulse-dot 1.4s infinite' }} />,
    waiting_review: <Icon name="pause" size={10} />,
  })[s] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, i) => {
        const active = selected === step.id;
        const clickable = step.status !== 'pending';
        return (
          <div key={step.id} style={{ display: 'flex', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 28, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 10,
                background: dotColor(step.status), zIndex: 1,
                border: `2px solid ${active ? 'var(--text-primary)' : dotColor(step.status)}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: step.status === 'pending' ? 'var(--text-muted)' : '#fff',
              }}>
                {dotIcon(step.status)}
              </div>
              {i < steps.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 8, background: 'var(--border)', marginTop: 2 }} />}
            </div>
            <div onClick={() => clickable && onSelect(step.id)}
              style={{ flex: 1, padding: '10px 8px 10px 8px', borderRadius: 6, marginBottom: 2, marginLeft: 4, cursor: clickable ? 'pointer' : 'default', background: active ? 'var(--bg-active)' : 'transparent', border: `1px solid ${active ? 'var(--border)' : 'transparent'}` }}
              onMouseEnter={e => { if (!active && clickable) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: step.status === 'pending' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{step.name}</span>
                {step.duration && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{step.duration}</span>}
              </div>
              {(step.tokens || step.cost) && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: 'JetBrains Mono, monospace' }}>
                  {step.tokens ? `${(step.tokens / 1000).toFixed(1)}k tok` : ''}
                  {step.cost ? ` · $${step.cost.toFixed(2)}` : ''}
                  {step.connector ? ` · ${step.connector}` : ''}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Code Mode Run Detail ──────────────────────────────────────────────────────
const CodeRunDetail = ({ run, onBack }) => {
  const steps = CODE_RUN_STEPS;
  const [sel, setSel] = useState('s4');
  const [tab, setTab] = useState('output');
  const step = steps.find(s => s.id === sel);

  const tabs = [
    { id: 'output', label: 'Output' },
    ...(step?.diff ? [{ id: 'diff', label: 'Code Diff' }] : []),
    ...(step?.testResults ? [{ id: 'tests', label: 'Tests', count: step.testResults.filter(t => t.status === 'fail').length }] : []),
    ...(step?.collectorBreakdown ? [{ id: 'context', label: 'Context' }] : []),
  ];

  useEffect(() => { if (!tabs.find(t => t.id === tab)) setTab(tabs[0]?.id || 'output'); }, [sel]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      {/* Sub-header */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-panel)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, padding: 0 }}>
          <Icon name="chevronLeft" size={14} />Runs
        </button>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-primary)' }}>{run.id}</span>
        <ModeBadge mode="code" />
        <StatusBadge status={run.status} />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{run.project}</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{run.duration}</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{(run.tokensUsed / 1000).toFixed(1)}k tok</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Timeline */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '16px 12px', overflowY: 'auto', background: 'var(--bg-panel)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, padding: '0 4px' }}>Step Timeline</div>
          <StepTimeline steps={steps} selected={sel} onSelect={id => { setSel(id); }} mode="code" />
        </div>

        {/* Detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {run.status === 'escalated' && <EscalationBanner run={run} />}
          {step && (
            <div style={{ }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{step.name}</h3>
                <StatusBadge status={step.status} size="md" />
                {step.duration && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>{step.duration} · {step.tokens?.toLocaleString()} tok</span>}
              </div>
              <Tabs tabs={tabs} active={tab} onChange={setTab} />
              <div style={{ marginTop: 16 }}>
                {tab === 'output' && (
                  <div>
                    {step.input && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Input</div>
                        <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{step.input}</pre>
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Output</div>
                        <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{step.output}</pre>
                      </div>
                    )}
                    {step.status === 'running' && !step.output && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--status-running)', fontSize: 13 }}>
                        <div style={{ width: 14, height: 14, border: '2px solid var(--status-running)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Analyzing failures and generating fix…
                      </div>
                    )}
                  </div>
                )}
                {tab === 'diff' && step.diff && <DiffViewer before={step.diff.before} after={step.diff.after} />}
                {tab === 'tests' && step.testResults && <TestPanel results={step.testResults} />}
                {tab === 'context' && step.collectorBreakdown && <ContextViewer breakdown={step.collectorBreakdown} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Run Row (extracted to avoid hook-in-loop) ─────────────────────────────────
const RunRow = ({ run, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <tr onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer', transition: 'background 80ms' }}>
      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>{run.id}</span></td>
      <td style={{ padding: '10px 14px' }}><ModeBadge mode={run.mode} /></td>
      <td style={{ padding: '10px 14px', maxWidth: 260 }}><div style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{run.task}</div></td>
      <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{run.project}</span></td>
      <td style={{ padding: '10px 14px' }}><StatusBadge status={run.status} /></td>
      <td style={{ padding: '10px 14px' }}><span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>{run.duration}</span></td>
      <td style={{ padding: '10px 14px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>
          {run.mode === 'creative' ? `$${run.estimatedCost?.toFixed(2)}` : `${(run.tokensUsed / 1000).toFixed(1)}k`}
        </span>
      </td>
      <td style={{ padding: '10px 14px' }}>
        {run.mode === 'code'
          ? <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: run.fixAttempts >= run.maxFix ? 'var(--status-error)' : 'var(--text-muted)' }}>{run.fixAttempts}/{run.maxFix}</span>
          : <span style={{ fontSize: 12, color: run.assetsPendingReview > 0 ? 'var(--status-review)' : 'var(--text-muted)' }}>{run.assetsGenerated} gen{run.assetsPendingReview > 0 ? ` · ${run.assetsPendingReview} pending` : ''}</span>
        }
      </td>
    </tr>
  );
};

// ── Run List Page ─────────────────────────────────────────────────────────────
const RunsListPage = ({ selectedRun, setSelectedRun }) => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [projFilter, setProjFilter] = useState('all');

  if (selectedRun) {
    const run = RUNS.find(r => r.id === selectedRun);
    if (run?.mode === 'creative') {
      return <CreativeRunDetail run={run} onBack={() => setSelectedRun(null)} />;
    }
    return <CodeRunDetail run={run || RUNS[1]} onBack={() => setSelectedRun(null)} />;
  }

  const statuses = ['all', 'running', 'waiting_review', 'success', 'failed', 'escalated'];
  const projects = ['all', ...new Set(RUNS.map(r => r.project))];

  const filtered = RUNS
    .filter(r => statusFilter === 'all' || r.status === statusFilter)
    .filter(r => modeFilter === 'all' || r.mode === modeFilter)
    .filter(r => projFilter === 'all' || r.project === projFilter);

  const counts = statuses.reduce((a, s) => { a[s] = s === 'all' ? RUNS.length : RUNS.filter(r => r.status === s).length; return a; }, {});

  return (
    <PageWrap>
      {/* Filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
              background: statusFilter === s ? 'var(--bg-active)' : 'transparent',
              color: statusFilter === s ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              {s !== 'all' && counts[s] > 0 && <span style={{ color: statusConfig[s]?.color }}>{counts[s]}</span>}
              {s === 'all' ? `All (${counts.all})` : s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        {['all', 'code', 'creative'].map(m => (
          <button key={m} onClick={() => setModeFilter(m)} style={{
            padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)',
            background: modeFilter === m ? 'var(--bg-active)' : 'transparent',
            color: modeFilter === m ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {m === 'all' ? 'All modes' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        <select value={projFilter} onChange={e => setProjFilter(e.target.value)} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
          {projects.map(p => <option key={p} value={p}>{p === 'all' ? 'All projects' : p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Run', 'Mode', 'Task', 'Project', 'Status', 'Duration', 'Usage', 'Fix / Assets'].map(h => (
                <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((run, i) => (
              <React.Fragment key={run.id}>
                <RunRow run={run} onClick={() => setSelectedRun(run.id)} />
                {i < filtered.length - 1 && <tr><td colSpan={8} style={{ padding: 0 }}><div style={{ height: 1, background: 'var(--border-subtle)' }} /></td></tr>}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No runs match current filters</div>}
      </div>
    </PageWrap>
  );
};

Object.assign(window, { RunsListPage, StepTimeline });
