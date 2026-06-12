"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
        <button onClick={() => window.location.reload()} className="btn-primary" style={{ background: 'var(--danger)' }}>ออกจากระบบ</button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
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
    </div>
  );
}
