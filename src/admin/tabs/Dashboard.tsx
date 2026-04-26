import type { State } from '../types';

type Props = {
  state: State;
  onRefresh: () => void;
};

export function Dashboard({ state, onRefresh }: Props) {
  const { stats, config } = state;
  const langLine = Object.entries(stats.users.langs)
    .sort(([, a], [, b]) => b - a)
    .map(([k, v]) => `${k} ${v}`)
    .join(' · ') || '—';
  const onboardedPct = stats.users.total > 0
    ? Math.round((stats.users.onboarded / stats.users.total) * 100)
    : 0;

  return (
    <>
      <div className="metric-row">
        <div className="metric">
          <div className="metric-label">Users</div>
          <div className="metric-value">{stats.users.total}</div>
        </div>
        <div className="metric">
          <div className="metric-label">DAU</div>
          <div className="metric-value">{stats.users.dau}</div>
        </div>
        <div className="metric">
          <div className="metric-label">WAU</div>
          <div className="metric-value">{stats.users.wau}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Engagement</div>
        <div className="kv-grid">
          <span className="k">MAU</span>
          <span className="v">{stats.users.mau}</span>
          <span className="k">Onboarded</span>
          <span className="v">{stats.users.onboarded} ({onboardedPct}%)</span>
          <span className="k">Languages</span>
          <span className="v">{langLine}</span>
          <span className="k">Active alerts</span>
          <span className="v">{stats.alerts.active} · {stats.alerts.users} user(s)</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Referrals</div>
        <div className="kv-grid">
          <span className="k">Total</span>
          <span className="v">{stats.referrals.total}</span>
          <span className="k">Inviters</span>
          <span className="v">{stats.referrals.inviters}</span>
        </div>
        {stats.referrals.top.length > 0 && (
          <div className="list" style={{ marginTop: 12 }}>
            {stats.referrals.top.map((r, i) => (
              <div className="list-item" key={r.uid}>
                <span><b>{i + 1}.</b> <code>{r.uid}</code></span>
                <span className="v">{r.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">News pipeline</div>
        <div className="kv-grid">
          <span className="k">Channel</span>
          <span className="v">{config.channelId ?? '—'}</span>
          <span className="k">Discussion group</span>
          <span className="v">{config.groupId ?? '—'}</span>
          <span className="k">AI cheerleader</span>
          <span className="v">{config.aiOn ? '🟢 ON' : '🔴 OFF'}</span>
          <span className="k">Audience</span>
          <span className="v">{config.aiPublic ? '🌍 public' : '🧪 beta only'}</span>
        </div>
      </div>

      <button className="btn btn-secondary btn-block" onClick={onRefresh}>
        🔄 Refresh
      </button>
    </>
  );
}
