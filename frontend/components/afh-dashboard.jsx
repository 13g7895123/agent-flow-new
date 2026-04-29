'use client';

import React, { useState } from 'react';
import { CONNECTORS, INSIGHTS, PROJECTS, RUNS } from '@/lib/afh-data';
import { Button, ConnectorBadge, Icon, ModeBadge, PageWrap, SectionTitle, StatCard, StatusBadge } from '@/components/afh-ui';
import { useI18n } from '@/components/i18n';

// afh-dashboard.jsx — Dashboard (mixed Code + Creative Mode)

const ActiveRunCard = ({ run, onClick }) => {
  const { t } = useI18n();
  const [hov, setHov] = useState(false);
  const isCreative = run.mode === 'creative';
  const isReview = run.status === 'waiting_review';
  const isEscalated = run.status === 'escalated';

  const accentColor = isReview ? 'var(--status-review)'
    : isEscalated ? 'var(--status-escalate)'
    : run.status === 'running' ? 'var(--status-running)'
    : 'var(--border)';

  const pct = run.stepsTotal ? (run.stepsDone / run.stepsTotal) * 100 : 0;

  return (
    <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--bg-panel)', borderRadius: 8, cursor: 'pointer',
        borderStyle: 'solid',
        borderTopWidth: 1,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderLeftWidth: 4,
        borderTopColor: hov ? accentColor : 'var(--border)',
        borderRightColor: hov ? accentColor : 'var(--border)',
        borderBottomColor: hov ? accentColor : 'var(--border)',
        borderLeftColor: accentColor,
        padding: '14px 16px', transition: 'border-color 80ms',
        animation: isReview ? 'review-pulse 3s infinite' : run.status === 'running' ? 'pulse-border 2s infinite' : 'none',
      }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
            <ModeBadge mode={run.mode} />
            <StatusBadge status={run.status} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{run.id}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{run.task}</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{run.project} · {run.role}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{run.duration}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {isCreative
              ? `$${run.estimatedCost?.toFixed(2)}`
              : `${(run.tokensUsed / 1000).toFixed(1)}k tok`}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'var(--bg-surface)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: 2, transition: 'width 600ms' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('dashboard.stepProgress', { done: run.stepsDone, total: run.stepsTotal })}</span>
        {isCreative && run.assetsPendingReview > 0 && (
          <span style={{ fontSize: 11, color: 'var(--status-review)', fontWeight: 500 }}>
            {t('dashboard.assetsPending', { count: run.assetsPendingReview })}
          </span>
        )}
        {!isCreative && run.fixAttempts > 0 && (
          <span style={{ fontSize: 11, color: isEscalated ? 'var(--status-escalate)' : 'var(--text-muted)' }}>
            {t('dashboard.fixProgress', { attempts: run.fixAttempts, max: run.maxFix })}
          </span>
        )}
      </div>

      {/* Review alert */}
      {isReview && (
        <div style={{
          marginTop: 10, padding: '7px 10px', borderRadius: 6,
          background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="pause" size={12} style={{ color: 'var(--status-review)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--status-review)' }}>
            {t('dashboard.waitingReview', { count: run.assetsPendingReview })}
          </span>
        </div>
      )}

      {/* Escalation alert */}
      {isEscalated && (
        <div style={{
          marginTop: 10, padding: '7px 10px', borderRadius: 6,
          background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Icon name="warning" size={12} style={{ color: 'var(--status-escalate)', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'var(--status-escalate)' }}>{t('dashboard.escalatedAlert')}</span>
        </div>
      )}
    </div>
  );
};

const RecentRow = ({ run, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <tr onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer', transition: 'background 80ms' }}>
      <td style={{ padding: '9px 14px' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>{run.id}</span>
      </td>
      <td style={{ padding: '9px 14px' }}><ModeBadge mode={run.mode} /></td>
      <td style={{ padding: '9px 14px', maxWidth: 260 }}>
        <span style={{ fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{run.task}</span>
      </td>
      <td style={{ padding: '9px 14px' }}><span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{run.project}</span></td>
      <td style={{ padding: '9px 14px' }}><StatusBadge status={run.status} /></td>
      <td style={{ padding: '9px 14px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>{run.duration}</span>
      </td>
      <td style={{ padding: '9px 14px', textAlign: 'right' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-muted)' }}>
          {run.mode === 'creative' ? `$${run.estimatedCost?.toFixed(2)}` : `${(run.tokensUsed / 1000).toFixed(1)}k`}
        </span>
      </td>
    </tr>
  );
};

const ConnectorStatusDot = ({ status }) => {
  const colors = { connected: 'var(--status-success)', rate_limited: 'var(--status-warning)', disconnected: 'var(--text-muted)', error: 'var(--status-error)' };
  return (
    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: colors[status] || colors.disconnected, flexShrink: 0 }} />
  );
};

export const DashboardPage = ({ setPage, setSelectedRun }) => {
  const { t } = useI18n();
  const s = INSIGHTS.todaySummary;
  const active = RUNS.filter(r => ['running', 'waiting_review', 'escalated'].includes(r.status));
  const recent = RUNS.filter(r => !['running', 'waiting_review', 'escalated'].includes(r.status)).slice(0, 8);

  return (
    <PageWrap>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 28 }}>
        <StatCard label={t('dashboard.codeRuns')} value={s.codeRuns} sub={t('dashboard.codeRunsSub', { success: s.codeSuccess, failed: s.codeFailed })} />
        <StatCard label={t('dashboard.creativeRuns')} value={s.creativeRuns} sub={t('dashboard.creativeRunsSub', { approved: s.creativeApproved })} color="var(--mode-creative)" />
        <StatCard label={t('dashboard.needsReview')} value={s.needsReview} sub={t('dashboard.needsReviewSub')} color={s.needsReview > 0 ? 'var(--status-review)' : undefined} />
        <StatCard label={t('dashboard.intervention')} value={s.needsIntervention} sub={t('dashboard.interventionSub')} color={s.needsIntervention > 0 ? 'var(--status-escalate)' : undefined} />
        <StatCard label={t('dashboard.tokens')} value={`${(s.tokensTotal / 1000).toFixed(0)}k`} sub={t('dashboard.tokensSub')} />
        <StatCard label={t('dashboard.estimatedCost')} value={`$${s.estimatedCost.toFixed(2)}`} sub={t('dashboard.costSub')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, marginBottom: 28 }}>
        {/* Active runs */}
        <div>
          <SectionTitle action={<Button variant="ghost" size="sm" onClick={() => setPage('runs')}>{t('button.viewAll')} →</Button>}>
            {t('dashboard.activeRuns')}
          </SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.length === 0
              ? <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-panel)', borderRadius: 8, border: '1px solid var(--border)' }}>{t('dashboard.noActiveRuns')}</div>
              : active.map(run => <ActiveRunCard key={run.id} run={run} onClick={() => { setSelectedRun(run.id); setPage('runs'); }} />)
            }
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Projects */}
          <div>
            <SectionTitle action={<Button variant="ghost" size="sm" onClick={() => setPage('projects')}>{t('button.all')} →</Button>}>
              {t('dashboard.projects')}
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PROJECTS.map(p => (
                <div key={p.id} onClick={() => setPage('projects')}
                  style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <ModeBadge mode={p.mode} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{p.name}</span>
                  <span style={{
                    fontSize: 14, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace',
                    color: p.successRate >= 80 ? 'var(--status-success)' : p.successRate >= 60 ? 'var(--status-warning)' : 'var(--status-error)',
                  }}>{p.successRate}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Connector status */}
          <div>
            <SectionTitle action={<Button variant="ghost" size="sm" onClick={() => setPage('connectors')}>{t('button.manage')} →</Button>}>
              {t('dashboard.connectors')}
            </SectionTitle>
            <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              {CONNECTORS.map((c, i) => (
                <div key={c.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
                  borderBottom: i < CONNECTORS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <ConnectorStatusDot status={c.status} />
                  <span style={{ flex: 1, fontSize: 13, color: c.status === 'disconnected' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{c.name}</span>
                  <ConnectorBadge type={c.type} />
                  {c.status === 'rate_limited' && (
                    <span style={{ fontSize: 11, color: 'var(--status-warning)', fontFamily: 'JetBrains Mono, monospace' }}>{t('dashboard.rateLimitReset', { time: c.resetIn })}</span>
                  )}
                  {c.status === 'connected' && c.latencyAvg && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{c.latencyAvg}</span>
                  )}
                  {c.status === 'disconnected' && (
                    <span style={{ fontSize: 11, color: 'var(--status-error)' }}>{t('dashboard.keyExpired')}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent runs table */}
      <SectionTitle action={<Button variant="ghost" size="sm" onClick={() => setPage('runs')}>{t('button.viewAll')} →</Button>}>
        {t('dashboard.recentRuns')}
      </SectionTitle>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {[t('table.run'), t('table.mode'), t('table.task'), t('table.project'), t('table.status'), t('table.duration'), t('table.usage')].map((h, index) => (
                <th key={h} style={{ padding: '8px 14px', textAlign: index >= 5 ? 'right' : 'left', fontSize: 11, fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((run, i) => (
              <React.Fragment key={run.id}>
                <RecentRow run={run} onClick={() => { setSelectedRun(run.id); setPage('runs'); }} />
                {i < recent.length - 1 && <tr><td colSpan={7} style={{ padding: 0 }}><div style={{ height: 1, background: 'var(--border-subtle)' }} /></td></tr>}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </PageWrap>
  );
};

