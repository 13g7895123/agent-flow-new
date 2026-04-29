'use client';

import { Icon } from '@/components/afh-ui';

// ── Step Timeline ─────────────────────────────────────────────────────────────
export const StepTimeline = ({ steps, selected, onSelect, mode = 'code' }) => {
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
