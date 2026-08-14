"use client";

import { useState } from 'react';

export default function Dashboard() {
  const [allProjects, setAllProjects] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [stats, setStats] = useState(null); // { cards: [], play_count: 0 }
  const [isLoading, setIsLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchProjects = async () => {
    if (hasFetched) return;
    setHasFetched(true);
    const res = await fetch('/api/groups?all=true');
    const data = await res.json();
    if (Array.isArray(data)) setAllProjects(data);
  };

  useState(() => { fetchProjects(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedGroup.name, password })
      });
      const data = await res.json();
      if (!res.ok) { setLoginError(data.error || 'รหัสผ่านไม่ถูกต้อง'); return; }

      // Fetch stats
      const statsRes = await fetch(`/api/cards/stats?group_id=${data.id}`);
      const statsData = await statsRes.json();
      setStats(statsData);
      setShowLogin(false);
    } catch (err) {
      setLoginError('เกิดข้อผิดพลาด');
    } finally {
      setIsLoading(false);
    }
  };

  const crisis = stats?.cards?.filter(c => c.card_type === 'crisis') || [];
  const resolution = stats?.cards?.filter(c => c.card_type === 'resolution') || [];

  const renderCardBar = (card) => {
    const total = (card.stats_a || 0) + (card.stats_b || 0);
    const pctA = total > 0 ? Math.round((card.stats_a / total) * 100) : 50;
    const pctB = 100 - pctA;
    return (
      <div key={card.id} style={{ marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{card.title}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{total} ครั้ง</span>
        </div>
        <div style={{ display: 'flex', height: '22px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
          <div style={{
            width: `${pctA}%`, background: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 'bold', color: 'white', transition: 'width 0.5s'
          }}>
            {total > 0 ? `A ${pctA}%` : 'A'}
          </div>
          <div style={{
            width: `${pctB}%`, background: '#a78bfa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.7rem', fontWeight: 'bold', color: 'white', transition: 'width 0.5s'
          }}>
            {total > 0 ? `B ${pctB}%` : 'B'}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ color: '#93c5fd' }}>← ปัดซ้าย (A): {card.stats_a || 0} ครั้ง</span>
          <span style={{ color: '#c4b5fd' }}>ปัดขวา (B): {card.stats_b || 0} ครั้ง →</span>
        </div>
      </div>
    );
  };

  return (
    <div className="container animate-fade-in" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>📊 Teacher Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>ดูสถิติการเล่นเกมของนักเรียนแบบ Real-time</p>

        {!stats ? (
          <div>
            <h3 style={{ marginBottom: '1.5rem' }}>เลือกโปรเจกต์ที่ต้องการดูสถิติ</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
              {allProjects.map(proj => (
                <div
                  key={proj.id}
                  onClick={() => { setSelectedGroup(proj); setShowLogin(true); setPassword(''); setLoginError(''); }}
                  className="glass-panel"
                  style={{ padding: '1.2rem', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#60a5fa'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  <div style={{ fontSize: '0.7rem', marginBottom: '0.5rem' }}>
                    <span style={{ background: proj.is_published ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: proj.is_published ? '#34d399' : '#fbbf24', padding: '2px 8px', borderRadius: '12px' }}>
                      {proj.is_published ? '🌟 เผยแพร่แล้ว' : '🔧 ร่าง'}
                    </span>
                  </div>
                  <h3 style={{ margin: '0 0 0.3rem 0', color: 'white', fontSize: '1rem' }}>{proj.game_title || proj.name}</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>กลุ่ม: {proj.name}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '3rem', textAlign: 'center' }}>
              <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>← กลับหน้าหลัก</a>
            </div>
          </div>
        ) : (
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎮</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#60a5fa' }}>{stats.play_count}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>จำนวนผู้เล่นทั้งหมด</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔴</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{crisis.length}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>การ์ดวิกฤต</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🟡</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{resolution.length}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>การ์ดเหตุการณ์พลิกผัน</div>
              </div>
              <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#34d399' }}>
                  {stats.cards.reduce((s, c) => s + (c.stats_a || 0) + (c.stats_b || 0), 0)}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>การตัดสินใจทั้งหมด</div>
              </div>
            </div>

            {/* Most Controversial Cards */}
            {(() => {
              const sorted = [...stats.cards]
                .filter(c => (c.stats_a + c.stats_b) > 0)
                .map(c => {
                  const total = c.stats_a + c.stats_b;
                  const pctA = (c.stats_a / total) * 100;
                  const controversy = 50 - Math.abs(pctA - 50); // 50 = most controversial
                  return { ...c, controversy };
                })
                .sort((a, b) => b.controversy - a.controversy)
                .slice(0, 3);

              if (sorted.length === 0) return null;
              return (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>⚡ การ์ดที่ผู้เล่นเห็นต่างกันมากที่สุด (Most Controversial)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    คือการ์ดที่ผู้เล่นแบ่งเป็น 2 ฝ่ายเกือบเท่าๆ กัน เหมาะสำหรับนำมาอภิปรายในชั้นเรียน
                  </p>
                  {sorted.map(renderCardBar)}
                </div>
              );
            })()}

            {/* Crisis Cards */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>🔴 การ์ดวิกฤต (Crisis)</h3>
              {crisis.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูล</p> : crisis.map(renderCardBar)}
            </div>

            {/* Resolution Cards */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>🟡 การ์ดเหตุการณ์พลิกผัน (Game Changer)</h3>
              {resolution.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูล</p> : resolution.map(renderCardBar)}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button onClick={() => { setStats(null); setSelectedGroup(null); }} className="btn-primary" style={{ background: 'var(--secondary)' }}>
                ← เปลี่ยนโปรเจกต์
              </button>
              <a href="/" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', textDecoration: 'none' }}>กลับหน้าหลัก</a>
            </div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      {showLogin && selectedGroup && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>🔐 ยืนยันตัวตน</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>{selectedGroup.game_title || selectedGroup.name}</p>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                placeholder="ใส่รหัสผ่านกลุ่ม..."
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              {loginError && <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{loginError}</p>}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" onClick={() => setShowLogin(false)} className="btn-primary" style={{ background: 'var(--secondary)' }}>ยกเลิก</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={isLoading}>
                  {isLoading ? 'กำลังโหลด...' : 'ดูสถิติ 📊'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
