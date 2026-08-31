import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import type { Activity } from '../types';
import { ScoreCircle } from './ScoreCircle';
import { HourlyChart } from './HourlyChart';
import { activityColor, activityIcon, activityLabel, scoreColor } from '../utils/weather';

interface Props {
  activity: Activity;
  onClose: () => void;
}

const styles = {
  aside: {
    width: 300,
    flexShrink: 0,
    background: 'var(--bg-card)',
    borderLeft: '1px solid var(--border)',
    padding: 24,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 20,
    overflowY: 'auto' as const,
  },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' },
  titleRow: { display: 'flex', alignItems: 'center', gap: 10 },
  closeButton: {
    background: 'none', border: 'none', fontSize: 20,
    color: 'var(--text-muted)', lineHeight: 1, padding: 4,
  },
  scoreRow: { display: 'flex', alignItems: 'center', gap: 16 },
  ratingBadge: (color: string) => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: color + '22',
    color,
  }),
  tabList: {
    display: 'flex',
    background: 'var(--bg-secondary)',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  whyBox: {
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    padding: 14,
  },
  breakdownList: { display: 'flex', flexDirection: 'column' as const, gap: 10, marginTop: 4 },
  breakdownRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
  breakdownTrack: { height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' },
};

function tabTriggerStyle(isActive: boolean) {
  return {
    flex: 1,
    padding: '5px 0',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: isActive ? 'var(--bg-card)' : 'none',
    cursor: 'pointer',
    boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
    transition: 'background 0.15s, color 0.15s',
  };
}

function barFillStyle(color: string, score: number) {
  return { width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' };
}

export function DetailPanel({ activity, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'hour' | 'breakdown'>('hour');
  const color = activityColor(activity.name);
  const isUnavailable = activity.score === 0 && activity.breakdown.length === 0;

  function handleTabChange(v: string) {
    setActiveTab(v as 'hour' | 'breakdown');
  }

  return (
    <aside aria-label={`${activityLabel(activity.name)} detail`} style={styles.aside}>
      <div style={styles.header}>
        <div style={styles.titleRow}>
          <span style={{ fontSize: 24 }} aria-hidden="true">{activityIcon(activity.name)}</span>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            {activityLabel(activity.name)}
          </h2>
        </div>
        <button onClick={onClose} aria-label="Close detail panel" style={styles.closeButton}>×</button>
      </div>

      <div style={styles.scoreRow}>
        <ScoreCircle score={activity.score} size={80} strokeWidth={7} />
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Score</p>
          <p style={{ fontSize: 28, fontWeight: 800, color: scoreColor(activity.score) }}>
            {activity.score}
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}> / 100</span>
          </p>
          <span style={styles.ratingBadge(scoreColor(activity.score))}>{activity.rating}</span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{activity.description}</p>

      {activity.bestTime !== 'N/A' && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
            Best time
          </p>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{activity.bestTime}</p>
        </div>
      )}

      {!isUnavailable && (
        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List aria-label="Chart view" style={styles.tabList}>
            {(['hour', 'breakdown'] as const).map((tab) => (
              <Tabs.Trigger key={tab} value={tab} style={tabTriggerStyle(activeTab === tab)}>
                {tab === 'hour' ? 'By hour' : 'Breakdown'}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="hour">
            <HourlyChart hourly={activity.hourly} color={color} />
          </Tabs.Content>

          <Tabs.Content value="breakdown">
            <div style={styles.breakdownList}>
              {activity.breakdown.map((f) => (
                <div key={f.name}>
                  <div style={styles.breakdownRow}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{f.name}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{f.score}</span>
                  </div>
                  <div
                    role="meter"
                    aria-label={`${f.name}: ${f.score} out of 100`}
                    aria-valuenow={f.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    style={styles.breakdownTrack}
                  >
                    <div style={barFillStyle(color, f.score)} />
                  </div>
                </div>
              ))}
            </div>
          </Tabs.Content>
        </Tabs.Root>
      )}

      {!isUnavailable && (
        <div style={styles.whyBox}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Why this score?</p>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{activity.description}</p>
        </div>
      )}
    </aside>
  );
}
