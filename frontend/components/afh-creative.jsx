'use client';

import { useState } from 'react';
import { CONNECTORS, CREATIVE_RUN_STEPS } from '@/lib/afh-data';
import { AssetPlaceholder, Button, ConnectorBadge, Icon, ModeBadge, StatusBadge, Tabs } from '@/components/afh-ui';
import { useI18n } from '@/components/i18n';
import { StepTimeline } from '@/components/step-timeline';

// afh-creative.jsx — Creative Mode run detail: Asset Gallery + Review Panel

// ── Asset Gallery ─────────────────────────────────────────────────────────────
const AssetGallery = ({ assets, onReview }) => {
  const { t } = useI18n();
  const [lightbox, setLightbox] = useState(null); // { sceneIdx, versionIdx }

  return (
    <div>
      {assets.map((scene, si) => (
        <div key={scene.sceneId} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{scene.sceneName}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 3, padding: '1px 6px', fontFamily: 'JetBrains Mono, monospace' }}>{scene.aspectRatio}</span>
            {scene.versions.some(v => v.status === 'approved') && (
              <span style={{ fontSize: 11, color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="check" size={11} /> {t('creative.approved')}
              </span>
            )}
            {scene.versions.every(v => v.status === 'pending') && (
              <span style={{ fontSize: 11, color: 'var(--status-review)', display: 'flex', alignItems: 'center', gap: 4, animation: 'review-pulse 3s infinite' }}>
                <Icon name="pause" size={11} /> {t('creative.awaitingReview')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {scene.versions.map((ver, vi) => (
              <div key={vi}
                onClick={() => ver.status !== 'generating' && setLightbox({ si, vi })}
                style={{
                  width: 180, cursor: ver.status !== 'generating' ? 'pointer' : 'default',
                  transition: 'transform 120ms, box-shadow 120ms',
                  borderRadius: 8, overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  outline: ver.status === 'approved' ? '2px solid var(--status-success)' : ver.status === 'pending' ? '2px solid var(--status-review)' : 'none',
                  outlineOffset: 2,
                }}
                onMouseEnter={e => { if (ver.status !== 'generating') e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.25)'; }}
              >
                <AssetPlaceholder
                  color={ver.color} aspectRatio={scene.aspectRatio}
                  label={`${scene.sceneName}\nv${ver.v} · ${ver.connector}`}
                  status={ver.status} version={ver.v}
                />
                {ver.status === 'rejected' && ver.feedback && (
                  <div style={{ padding: '5px 8px', background: '#1a0a0a', borderTop: '1px solid rgba(248,113,113,0.2)' }}>
                    <div style={{ fontSize: 10, color: 'var(--status-error)', lineHeight: 1.4 }}>{ver.feedback}</div>
                  </div>
                )}
              </div>
            ))}
            {/* Generating placeholder slot */}
            {scene.versions.some(v => v.status === 'generating') && null}
          </div>
        </div>
      ))}

      {/* Lightbox */}
      {lightbox !== null && (() => {
        const scene = assets[lightbox.si];
        const ver = scene.versions[lightbox.vi];
        return (
          <div onClick={() => setLightbox(null)} style={{
            position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '70vw', maxWidth: 900 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: '#fff', flex: 1 }}>{scene.sceneName} — v{ver.v}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>{ver.connector}</span>
                {ver.cost && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'JetBrains Mono, monospace' }}>${ver.cost.toFixed(2)}</span>}
                <button onClick={() => setLightbox(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28 }}>
                  <Icon name="x" size={14} />
                </button>
              </div>
              {/* Image */}
              <AssetPlaceholder color={ver.color} aspectRatio={scene.aspectRatio} label={`${scene.sceneName} · v${ver.v}`} status={ver.status} version={ver.v} />
              {/* Version nav */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                {scene.versions.map((v, vi) => (
                  <button key={vi} onClick={() => setLightbox({ si: lightbox.si, vi })} style={{
                    padding: '4px 10px', borderRadius: 5, border: `1px solid ${vi === lightbox.vi ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                    background: vi === lightbox.vi ? 'var(--accent-subtle)' : 'transparent',
                    color: vi === lightbox.vi ? 'var(--accent)' : 'rgba(255,255,255,0.5)',
                    fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace',
                  }}>v{v.v}</button>
                ))}
              </div>
              {/* Review actions */}
              {ver.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
                  <Button variant="approve" size="md" icon="thumbsUp" onClick={() => { onReview(scene.sceneId, ver.v, 'approve', ''); setLightbox(null); }}>{t('creative.approve')}</Button>
                  <Button variant="reject" size="md" icon="thumbsDown" onClick={() => setLightbox(null)}>{t('creative.reject')}</Button>
                </div>
              )}
              {ver.feedback && (
                <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 12, color: 'var(--status-error)', textAlign: 'center' }}>
                  {t('creative.rejected')}: {ver.feedback}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ── Review Panel ──────────────────────────────────────────────────────────────
const ReviewPanel = ({ assets, onReview }) => {
  const { t } = useI18n();
  const [selectedScene, setSelectedScene] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState(null);
  const [submitted, setSubmitted] = useState({});

  const pendingItems = assets.flatMap(scene =>
    scene.versions.filter(v => v.status === 'pending').map(v => ({ scene, ver: v }))
  );

  const quickFeedbacks = ['風格不對', '構圖重來', '細節不夠', '太暗了', '太亮了', '色調偏差'];

  const handleSubmit = (sceneId, v) => {
    onReview(sceneId, v, action, feedback);
    setSubmitted(s => ({ ...s, [`${sceneId}-${v}`]: action }));
    setFeedback('');
    setAction(null);
    setSelectedScene(null);
  };

  if (pendingItems.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        <Icon name="check" size={20} style={{ color: 'var(--status-success)', display: 'block', margin: '0 auto 8px' }} />
        {t('creative.allAssetsReviewed')}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{t('creative.pendingReview')}</span>
        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 10, background: 'rgba(192,132,252,0.12)', color: 'var(--status-review)', fontWeight: 500 }}>{pendingItems.length}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pendingItems.map(({ scene, ver }) => {
          const key = `${scene.sceneId}-${ver.v}`;
          const done = submitted[key];
          const isOpen = selectedScene === key;
          return (
            <div key={key} style={{ border: `1px solid ${isOpen ? 'var(--status-review)' : 'var(--border)'}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 80ms' }}>
              <div onClick={() => !done && setSelectedScene(isOpen ? null : key)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: isOpen ? 'rgba(192,132,252,0.06)' : 'var(--bg-panel)', cursor: done ? 'default' : 'pointer' }}>
                <div style={{ width: 44, height: 28, borderRadius: 4, background: ver.color, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                  <svg width="100%" height="100%" style={{ opacity: 0.1 }}>
                    <defs><pattern id={`sp-${key}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse"><line x1="0" y1="8" x2="8" y2="0" stroke="white" strokeWidth="1" /></pattern></defs>
                    <rect width="100%" height="100%" fill={`url(#sp-${key})`} />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{scene.sceneName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>v{ver.v} · {ver.connector}</div>
                </div>
                {done ? (
                  <span style={{ fontSize: 12, color: done === 'approve' ? 'var(--status-success)' : 'var(--status-error)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon name={done === 'approve' ? 'check' : 'x'} size={13} />
                    {done === 'approve' ? t('creative.approved') : t('creative.rejected')}
                  </span>
                ) : (
                  <Icon name={isOpen ? 'chevronUp' : 'chevronDown'} size={14} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>

              {isOpen && !done && (
                <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <button onClick={() => setAction('approve')} style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      background: action === 'approve' ? 'var(--status-success)' : 'transparent',
                      border: `1px solid ${action === 'approve' ? 'var(--status-success)' : 'var(--border)'}`,
                      color: action === 'approve' ? '#fff' : 'var(--text-secondary)',
                      fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <Icon name="thumbsUp" size={14} /> {t('creative.approve')}
                    </button>
                    <button onClick={() => setAction('reject')} style={{
                      flex: 1, padding: '8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      background: action === 'reject' ? 'rgba(248,113,113,0.12)' : 'transparent',
                      border: `1px solid ${action === 'reject' ? 'var(--status-error)' : 'var(--border)'}`,
                      color: action === 'reject' ? 'var(--status-error)' : 'var(--text-secondary)',
                      fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      <Icon name="thumbsDown" size={14} /> {t('creative.reject')}
                    </button>
                    <button onClick={() => { setAction('regenerate'); }} style={{
                      padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                      background: 'transparent', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <Icon name="refresh" size={13} /> {t('creative.retry')}
                    </button>
                  </div>

                  {action === 'reject' && (
                    <div style={{ }}>
                      {/* Quick feedback */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                        {quickFeedbacks.map(qf => (
                          <button key={qf} onClick={() => setFeedback(f => f ? `${f}, ${qf}` : qf)} style={{
                            padding: '4px 8px', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                            background: 'var(--bg-hover)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
                          }}>{qf}</button>
                        ))}
                      </div>
                      <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                        placeholder="Describe what needs to change (this will be injected into the next prompt)…"
                        rows={3}
                        style={{ width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: 13, color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                        onBlur={e => e.target.style.borderColor = 'var(--border)'}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <Button variant="primary" size="md" disabled={!action || (action === 'reject' && !feedback.trim())} onClick={() => handleSubmit(scene.sceneId, ver.v)}>
                      {t('creative.submitReview')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Batch approve */}
      {pendingItems.filter(({ scene, ver }) => !submitted[`${scene.sceneId}-${ver.v}`]).length > 1 && (
        <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('creative.batchApprove')}</span>
          <Button variant="approve" size="sm" onClick={() => {
            pendingItems.forEach(({ scene, ver }) => {
              if (!submitted[`${scene.sceneId}-${ver.v}`]) {
                setSubmitted(s => ({ ...s, [`${scene.sceneId}-${ver.v}`]: 'approve' }));
              }
            });
          }}>{t('creative.approveAll')}</Button>
        </div>
      )}
    </div>
  );
};

// ── Agent Connector Status (mini panel) ───────────────────────────────────────
const ConnectorStatusMini = ({ steps }) => {
  const usedConnectors = [...new Set(steps.filter(s => s.connector && s.connector !== 'Internal').map(s => s.connector))];
  const connectorMap = Object.fromEntries(CONNECTORS.map(c => [c.name, c]));

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {usedConnectors.map(name => {
        const c = connectorMap[name];
        if (!c) return null;
        const dotColor = { connected: 'var(--status-success)', rate_limited: 'var(--status-warning)', disconnected: 'var(--text-muted)', error: 'var(--status-error)' }[c.status];
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</span>
            <ConnectorBadge type={c.type} />
            {c.latencyAvg && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{c.latencyAvg}</span>}
            {c.quotaMax && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 52, height: 3, background: 'var(--bg-hover)', borderRadius: 2 }}>
                  <div style={{ width: `${(c.quotaUsed / c.quotaMax) * 100}%`, height: '100%', background: c.quotaUsed >= c.quotaMax ? 'var(--status-error)' : 'var(--status-success)', borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{c.quotaUsed}/{c.quotaMax}</span>
              </div>
            )}
            {c.status === 'rate_limited' && <span style={{ fontSize: 11, color: 'var(--status-warning)' }}>reset {c.resetIn}</span>}
          </div>
        );
      })}
    </div>
  );
};

// ── Creative Mode Run Detail ───────────────────────────────────────────────────
export const CreativeRunDetail = ({ run, onBack }) => {
  const { t } = useI18n();
  const steps = CREATIVE_RUN_STEPS;
  const [sel, setSel] = useState('c3');
  const [tab, setTab] = useState('gallery');
  const [assetStates, setAssetStates] = useState({});
  const step = steps.find(s => s.id === sel);

  const handleReview = (sceneId, v, action, feedback) => {
    setAssetStates(s => ({ ...s, [`${sceneId}-${v}`]: { action, feedback } }));
  };

  // Merge review states into assets
  const mergedAssets = (step?.assets || []).map(scene => ({
    ...scene,
    versions: scene.versions.map(ver => {
      const rev = assetStates[`${scene.sceneId}-${ver.v}`];
      if (rev) return { ...ver, status: rev.action === 'approve' ? 'approved' : 'rejected', feedback: rev.feedback || ver.feedback };
      return ver;
    }),
  }));

  const hasPending = mergedAssets.some(sc => sc.versions.some(v => v.status === 'pending'));
  const galleryTabs = [
    { id: 'gallery', label: t('creative.assetGallery') },
    ...(step?.assets?.length > 0 ? [{ id: 'review', label: t('creative.review'), count: hasPending ? mergedAssets.flatMap(s => s.versions).filter(v => v.status === 'pending').length : 0 }] : []),
    { id: 'output', label: t('runs.output') },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 52px)' }}>
      {/* Sub-header */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-panel)', flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, padding: 0 }}>
          <Icon name="chevronLeft" size={14} />{t('nav.runs')}
        </button>
        <span style={{ color: 'var(--border)' }}>/</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-primary)' }}>{run.id}</span>
        <ModeBadge mode="creative" />
        <StatusBadge status={run.status} />
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{run.project}</span>
        <span style={{ color: 'var(--border)' }}>·</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-muted)' }}>{run.duration}</span>
        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--mode-creative)', fontWeight: 500 }}>${run.estimatedCost?.toFixed(2)}</span>
      </div>

      {/* Waiting review banner */}
      {run.status === 'waiting_review' && (
        <div style={{ padding: '10px 24px', background: 'rgba(192,132,252,0.07)', borderBottom: '1px solid rgba(192,132,252,0.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-review)', animation: 'pulse-dot 3s infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--status-review)', fontWeight: 500 }}>
            {t('creative.reviewGate', { count: run.assetsPendingReview })}
          </span>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('creative.reviewGateSub', { done: run.stepsDone, total: run.stepsTotal })}</span>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Timeline */}
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--border)', padding: '16px 12px', overflowY: 'auto', background: 'var(--bg-panel)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, padding: '0 4px' }}>{t('runs.timeline')}</div>
          <StepTimeline steps={steps} selected={sel} onSelect={setSel} mode="creative" />

          {/* Connector status */}
          <div style={{ marginTop: 20, padding: '0 4px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{t('creative.connectors')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {CONNECTORS.slice(0, 3).map(c => {
                const dotColor = { connected: 'var(--status-success)', rate_limited: 'var(--status-warning)', disconnected: 'var(--text-muted)' }[c.status];
                return (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--bg-surface)', borderRadius: 6, border: '1px solid var(--border)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{c.name}</span>
                    {c.status === 'rate_limited' && <span style={{ fontSize: 10, color: 'var(--status-warning)' }}>{c.resetIn}</span>}
                    {c.status === 'connected' && c.latencyAvg && <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{c.latencyAvg}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {step && (
            <div style={{ }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{step.name}</h3>
                <StatusBadge status={step.status} size="md" />
                {step.connector && <ConnectorBadge type={step.connectorType} />}
                {step.connector && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.connector}</span>}
                {step.duration && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginLeft: 'auto' }}>{step.duration}{step.cost ? ` · $${step.cost.toFixed(2)}` : ''}</span>}
              </div>

              {step.status === 'waiting_review' && step.assets?.length > 0 ? (
                <div>
                  <Tabs tabs={galleryTabs} active={tab} onChange={setTab} />
                  <div style={{ marginTop: 16 }}>
                    {tab === 'gallery' && <AssetGallery assets={mergedAssets} onReview={handleReview} />}
                    {tab === 'review' && <ReviewPanel assets={mergedAssets} onReview={handleReview} />}
                    {tab === 'output' && step.output && (
                      <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{step.output}</pre>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  {step.input && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('runs.input')}</div>
                      <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{step.input}</pre>
                    </div>
                  )}
                  {step.output && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{t('runs.output')}</div>
                      <pre style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{step.output}</pre>
                    </div>
                  )}
                  {step.status === 'pending' && (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      {t('creative.waitingUpstream')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

