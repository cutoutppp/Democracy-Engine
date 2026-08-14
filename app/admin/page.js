"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingLimitsFor, setEditingLimitsFor] = useState(null);
  const [limitForm, setLimitForm] = useState({ max_crisis_val: 20, max_resolution_val: 30 });
  const [statsFor, setStatsFor] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  
  const [isGlobalLimitsModalOpen, setIsGlobalLimitsModalOpen] = useState(false);
  const [globalLimitsForm, setGlobalLimitsForm] = useState({ max_crisis_val: 20, max_resolution_val: 30 });

  const fetchStats = async (g) => {
    setStatsFor(g);
    setLoadingStats(true);
    setStatsData([]);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_stats', password, target_id: g.id })
      });
      const data = await res.json();
      if (res.ok) setStatsData(data.cards || []);
    } catch(e) { console.error(e); }
    finally { setLoadingStats(false); }
  };

  const updateLimits = async (e) => {
    e.preventDefault();
    if (!editingLimitsFor) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_limits', 
          password, 
          target_id: editingLimitsFor.id,
          max_crisis_val: limitForm.max_crisis_val,
          max_resolution_val: limitForm.max_resolution_val
        })
      });
      if (res.ok) {
        setGroups(groups.map(g => g.id === editingLimitsFor.id ? { ...g, max_crisis_val: limitForm.max_crisis_val, max_resolution_val: limitForm.max_resolution_val } : g));
        setEditingLimitsFor(null);
        alert('อัปเดตลิมิตคะแนนสำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const updateGlobalLimits = async (e) => {
    e.preventDefault();
    const conf = window.confirm('คุณแน่ใจหรือไม่ว่าจะเปลี่ยนเพดานคะแนนสำหรับ "ทุกโปรเจกต์" พร้อมกันทั้งหมด?');
    if (!conf) return;
    
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update_all_limits', 
          password, 
          max_crisis_val: globalLimitsForm.max_crisis_val,
          max_resolution_val: globalLimitsForm.max_resolution_val
        })
      });
      if (res.ok) {
        setGroups(groups.map(g => ({ ...g, max_crisis_val: globalLimitsForm.max_crisis_val, max_resolution_val: globalLimitsForm.max_resolution_val })));
        setIsGlobalLimitsModalOpen(false);
        alert('อัปเดตลิมิตคะแนนทุกโปรเจกต์สำเร็จ!');
      } else {
        alert('เกิดข้อผิดพลาดในการอัปเดต');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const login = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all', password })
      });
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
        setGroups(data.groups);
      } else {
        setError(data.error || 'รหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteGroup = async (id, name) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าจะลบกลุ่ม "${name}"? ข้อมูลและการ์ดทั้งหมดจะหายไปและไม่สามารถกู้คืนได้`)) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', password, target_id: id })
      });
      if (res.ok) {
        setGroups(groups.filter(g => g.id !== id));
        alert('ลบกลุ่มเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการลบ');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  const resetPassword = async (id, name) => {
    const newPass = prompt(`ตั้งรหัสผ่านใหม่ให้กับกลุ่ม "${name}":`);
    if (!newPass) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', password, target_id: id, target_password: newPass })
      });
      if (res.ok) {
        setGroups(groups.map(g => g.id === id ? { ...g, password: newPass } : g));
        alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      } else {
        alert('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container flex-center animate-fade-in" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
          <h1 className="text-gradient" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Admin Login</h1>
          <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>ระบบจัดการหลังบ้านสำหรับคุณครู</p>
          <form onSubmit={login}>
            <input 
              type="password" placeholder="Master Password..." className="input-field" 
              value={password} onChange={e => setPassword(e.target.value)} required 
            />
            {error && <p style={{ color: 'var(--danger)', marginTop: '0.5rem', textAlign: 'center' }}>{error}</p>}
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={isLoading}>
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; กลับหน้าหลัก</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2><span className="text-gradient">Teacher Dashboard</span></h2>
          <p style={{ color: 'var(--text-muted)' }}>จำนวนกลุ่มทั้งหมด: {groups.length} โปรเจกต์</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => setIsGlobalLimitsModalOpen(true)} className="btn-primary" style={{ background: 'var(--primary)' }}>⚙️ ตั้งค่าเพดานทุกกลุ่ม</button>
          <button onClick={() => window.location.reload()} className="btn-primary" style={{ background: 'var(--danger)' }}>ออกจากระบบ</button>
        </div>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', minHeight: '60vh' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '1rem', color: '#60a5fa' }}>ชื่อเกม / ชื่อกลุ่ม</th>
              <th style={{ padding: '1rem', color: '#60a5fa' }}>รหัสผ่าน</th>
              <th style={{ padding: '1rem', color: '#60a5fa' }}>จำนวนการ์ด</th>
              <th style={{ padding: '1rem', color: '#60a5fa' }}>สถานะ</th>
              <th style={{ padding: '1rem', color: '#60a5fa', textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 'bold' }}>{g.game_title || g.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{g.name}</div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <code style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: '4px' }}>{g.password}</code>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: g.card_count >= 30 ? '#34d399' : '#fbbf24', fontWeight: 'bold' }}>{g.card_count}</span> / 30
                </td>
                <td style={{ padding: '1rem' }}>
                  {g.is_published ? (
                    <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>เผยแพร่แล้ว</span>
                  ) : (
                    <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>กำลังสร้าง</span>
                  )}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <a href={`/play?group=${encodeURIComponent(g.name)}`} target="_blank" className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#3b82f6', textDecoration: 'none' }}>เล่นเกม</a>
                  <button onClick={() => fetchStats(g)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#8b5cf6' }}>สถิติ</button>
                  <button onClick={() => {
                    setEditingLimitsFor(g);
                    setLimitForm({ max_crisis_val: g.max_crisis_val || 20, max_resolution_val: g.max_resolution_val || 30 });
                  }} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#10b981' }}>ตั้งค่า</button>
                  <button onClick={() => resetPassword(g.id, g.name)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#f59e0b' }}>เปลี่ยนรหัส</button>
                  <button onClick={() => deleteGroup(g.id, g.name)} className="btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: '#ef4444' }}>ลบกลุ่ม</button>
                </td>
              </tr>
            ))}
            {groups.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>ยังไม่มีกลุ่มในระบบ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Limits Modal */}
      {editingLimitsFor && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
            <h2 style={{ marginBottom: '1rem', textAlign: 'center', color: '#60a5fa' }}>ตั้งค่าเพดานคะแนน</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>กลุ่ม: {editingLimitsFor.game_title || editingLimitsFor.name}</p>
            <form onSubmit={updateLimits}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>🔴 เพดานคะแนนการ์ดวิกฤต (Crisis)</label>
                <input 
                  type="number" min="5" max="100" className="input-field" 
                  value={limitForm.max_crisis_val} onChange={e => setLimitForm({...limitForm, max_crisis_val: parseInt(e.target.value) || 20})} required 
                />
              </div>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>🟡 เพดานคะแนนการ์ดโอกาส (Resolution)</label>
                <input 
                  type="number" min="5" max="100" className="input-field" 
                  value={limitForm.max_resolution_val} onChange={e => setLimitForm({...limitForm, max_resolution_val: parseInt(e.target.value) || 30})} required 
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setEditingLimitsFor(null)} className="btn-primary" style={{ background: 'var(--secondary)' }}>ยกเลิก</button>
                <button type="submit" className="btn-primary" style={{ flex: 1, background: '#10b981' }}>บันทึกค่า</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Limits Modal */}
      {isGlobalLimitsModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '2rem', overflowY: 'auto'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', background: '#1e293b' }}>
            <h3 style={{ marginBottom: '1rem', color: '#f87171' }}>⚠️ ตั้งค่าเพดานคะแนนสำหรับทุกกลุ่ม</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              การตั้งค่านี้จะเขียนทับค่าเพดานคะแนนของการ์ดวิกฤตและการ์ดทางออก ของ <strong>"ทุกโปรเจกต์ที่มีอยู่ในระบบ"</strong> พร้อมกัน!
            </p>
            <form onSubmit={updateGlobalLimits}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#fca5a5' }}>เพดานคะแนน การ์ดวิกฤต (Crisis)</label>
                <input 
                  type="number" className="input-field"
                  value={globalLimitsForm.max_crisis_val}
                  onChange={e => setGlobalLimitsForm({...globalLimitsForm, max_crisis_val: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#86efac' }}>เพดานคะแนน การ์ดทางออก (Resolution)</label>
                <input 
                  type="number" className="input-field"
                  value={globalLimitsForm.max_resolution_val}
                  onChange={e => setGlobalLimitsForm({...globalLimitsForm, max_resolution_val: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsGlobalLimitsModalOpen(false)}>ยกเลิก</button>
                <button type="submit" className="btn-primary" style={{ background: '#ef4444' }}>บันทึกทุกโปรเจกต์</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {statsFor && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000, padding: '2rem 1rem', overflowY: 'auto' }}
          onClick={() => setStatsFor(null)}
        >
          <div 
            className="glass-panel animate-fade-in" 
            style={{ width: '100%', maxWidth: '800px', minHeight: '60vh', padding: '2.5rem', display: 'flex', flexDirection: 'column', margin: '0 auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#8b5cf6', margin: 0 }}>📊 สถิติการเลือก</h2>
              <button onClick={() => setStatsFor(null)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '0.5rem' }}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>กลุ่ม: {statsFor.game_title || statsFor.name}</p>
            <div style={{ paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
              {loadingStats ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>กำลังโหลด...</p>
              ) : statsData.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ยังไม่มีสถิติการเล่น (ต้องมีคนเล่นเกมก่อน)</p>
              ) : (
                <div>
                  {statsData.map((card, index) => {
                    const total = (card.stats_a || 0) + (card.stats_b || 0);
                    const pctA = total > 0 ? Math.round((card.stats_a / total) * 100) : 0;
                    const pctB = total > 0 ? Math.round((card.stats_b / total) * 100) : 0;
                    return (
                      <div key={card.id || `card-${index}`} style={{ marginBottom: '1.2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: `3px solid ${card.card_type === 'crisis' ? '#ef4444' : '#eab308'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{card.title}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{total} ครั้ง</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                              <span style={{ color: '#60a5fa' }}>ซ้าย (A)</span>
                              <span>{pctA}% ({card.stats_a || 0})</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                              <div style={{ width: `${pctA}%`, height: '100%', background: '#60a5fa', borderRadius: '3px', transition: 'width 0.5s' }} />
                            </div>
                          </div>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                              <span style={{ color: '#a78bfa' }}>ขวา (B)</span>
                              <span>{pctB}% ({card.stats_b || 0})</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                              <div style={{ width: `${pctB}%`, height: '100%', background: '#a78bfa', borderRadius: '3px', transition: 'width 0.5s' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <button onClick={() => setStatsFor(null)} className="btn-primary" style={{ width: '100%', background: 'var(--secondary)' }}>ปิดหน้าต่าง</button>
          </div>
        </div>
      )}
    </div>
  );
}
