"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { initAudio, playSwipe, playGameOver, playVictory } from '@/lib/audio';

// Simple swipe logic could use Framer Motion, but we'll use a simpler approach 
// with buttons or basic CSS transform for now to keep it lightweight.

export default function Play() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [cards, setCards] = useState([]);
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameover, victory
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const [pillars, setPillars] = useState({
    legislative: 50,
    executive: 50,
    judiciary: 50,
    military: 50
  });
  const [isClient, setIsClient] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [isHardMode, setIsHardMode] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [endReason, setEndReason] = useState('');

  // Fetch published games on mount
  const [publishedGroups, setPublishedGroups] = useState([]);
  useEffect(() => {
    // Check if there's a group query param for auto-start (e.g. from Test Button)
    const urlParams = new URLSearchParams(window.location.search);
    const testGroup = urlParams.get('group');
    
    if (testGroup) {
      setSelectedGroup(testGroup);
      // Wait a tick for state to settle, then simulate submit
      setTimeout(() => {
        document.getElementById('start-btn')?.click();
      }, 100);
    }

    // Fetch published catalog
    fetch('/api/groups?published=true')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setPublishedGroups(data);
      })
      .catch(err => console.error(err));
  }, []);

  const [groupData, setGroupData] = useState(null);

  const startGame = async (e) => {
    if(e) e.preventDefault();
    const targetGroup = selectedGroup;
    if (!targetGroup) return;

    try {
      initAudio();
      const resGroup = await fetch(`/api/groups?name=${encodeURIComponent(targetGroup)}`);
      if (!resGroup.ok) {
        alert('ไม่พบข้อมูลกลุ่มนี้');
        return;
      }
      const groupInfo = await resGroup.json();
      setGroupData(groupInfo);

      const resCards = await fetch(`/api/cards?group_id=${groupInfo.id}`);
      const cardsData = await resCards.json();

      if (cardsData.length === 0) {
        alert('กลุ่มนี้ยังไม่มีการ์ดเลย ให้นักเรียนไปสร้างการ์ดก่อนนะ!');
        return;
      }

      const shuffled = [...cardsData].sort(() => 0.5 - Math.random());
      
      // Universal Mode Selection Card (Challenge)
      const modeSelectCard = {
        id: 'mode_select',
        title: 'เลือกระดับความท้าทาย',
        description: 'ก่อนเริ่มการบริหารประเทศ กรุณาเลือกระดับความท้าทาย (จะมีผลต่อตัวช่วยในเกม):',
        card_type: 'resolution',
        image_url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e3a8a"/><stop offset="100%" stop-color="%233b82f6"/></linearGradient></defs><rect width="600" height="600" fill="url(%23g)"/><text x="300" y="300" font-family="sans-serif" font-size="120" text-anchor="middle" dominant-baseline="middle">🎮</text></svg>',
        choice_a_text: '🟢 ความท้าทายปกติ (Normal)',
        choice_a_legislative: 0, choice_a_executive: 0, choice_a_judiciary: 0, choice_a_military: 0,
        choice_b_text: '🔥 ความท้าทายระดับสูง (Hard Mode)',
        choice_b_legislative: 0, choice_b_executive: 0, choice_b_judiciary: 0, choice_b_military: 0
      };

      // Story Intro Card (From group settings)
      const introCard = {
        id: 'intro',
        title: groupInfo.intro_title || 'วันแรกของการรับตำแหน่ง',
        description: groupInfo.intro_desc || 'ยินดีด้วย! คุณได้รับเลือกให้เป็นผู้นำคนใหม่ บททดสอบกำลังจะเริ่มขึ้น คุณพร้อมหรือยัง?',
        card_type: 'resolution',
        image_url: groupInfo.intro_image_url || groupInfo.bg_image_url || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23831843"/><stop offset="100%" stop-color="%23db2777"/></linearGradient></defs><rect width="600" height="600" fill="url(%23g)"/><text x="300" y="300" font-family="sans-serif" font-size="120" text-anchor="middle" dominant-baseline="middle">👑</text></svg>',
        choice_a_text: groupInfo.intro_choice_a || 'เริ่มบริหารประเทศ',
        choice_a_legislative: 0, choice_a_executive: 0, choice_a_judiciary: 0, choice_a_military: 0,
        choice_b_text: groupInfo.intro_choice_b || 'พร้อมลุย!',
        choice_b_legislative: 0, choice_b_executive: 0, choice_b_judiciary: 0, choice_b_military: 0
      };

      // Play max 20 cards total (1 mode select + 1 intro + 18 random)
      const gameCards = [modeSelectCard, introCard, ...shuffled.slice(0, 18)];
      setCards(gameCards);
      
      // Preload images in the background
      setTimeout(() => {
        gameCards.forEach(c => {
          if (c.image_url && c.image_url.startsWith('http')) {
            const img = new window.Image();
            img.src = c.image_url;
          }
        });
      }, 500);

      setPillars({ legislative: 50, executive: 50, judiciary: 50, military: 50 });
      setIsHardMode(false);
      setCurrentCardIndex(0);
      setGameState('playing');

    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    }
  };

  const [hoverChoice, setHoverChoice] = useState(null);
  const [animateDir, setAnimateDir] = useState('');

  const handleChoice = (choice) => {
    if (gameState !== 'playing') return;
    if (animateDir !== '') return; // Prevent double-clicks during animation
    
    const card = cards[currentCardIndex];
    if (!card) return; // Safety check
    
    let p = { ...pillars };

    // Set difficulty on mode select card
    if (card.id === 'mode_select') {
      setIsHardMode(choice === 'B');
    }

    // Ping API (silently)
    if (card.id !== 'intro' && card.id !== 'mode_select') {
      fetch('/api/cards/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_id: card.id, choice })
      }).catch(e => console.error(e));
    }

    if (choice === 'A') {
      p.legislative += card.choice_a_legislative;
      p.executive += card.choice_a_executive;
      p.judiciary += card.choice_a_judiciary;
      p.military += card.choice_a_military;
    } else {
      p.legislative += card.choice_b_legislative;
      p.executive += card.choice_b_executive;
      p.judiciary += card.choice_b_judiciary;
      p.military += card.choice_b_military;
    }

    Object.keys(p).forEach(k => {
      if (p[k] > 100) p[k] = 100;
      if (p[k] < 0) p[k] = 0;
    });

    setAnimateDir(choice === 'A' ? 'slide-left' : 'slide-right');
    playSwipe();
    setTimeout(() => {
      setPillars(p);
      checkGameOver(p);
      setAnimateDir('');
      setHoverChoice(null);
    }, 300);
  };

  const handleDragStart = (e) => {
    if (gameState !== 'playing') return;
    setIsDragging(true);
    setDragStartX(e.type.includes('mouse') ? e.clientX : e.touches[0].clientX);
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const currentX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const offset = currentX - dragStartX;
    setDragOffset(offset);

    // Auto-update impact preview
    if (offset < -50) setHoverChoice('A');
    else if (offset > 50) setHoverChoice('B');
    else setHoverChoice(null);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragOffset < -100) {
      handleChoice('A');
    } else if (dragOffset > 100) {
      handleChoice('B');
    } else {
      setHoverChoice(null);
    }
    setDragOffset(0);
  };

  const checkGameOver = (p) => {
    const pillar1 = groupData?.pillar_1_name || 'สภา';
    const pillar2 = groupData?.pillar_2_name || 'บริหาร';
    const pillar3 = groupData?.pillar_3_name || 'ศาล';
    const pillar4 = groupData?.pillar_4_name || 'ทหาร';

    if (p.legislative <= 0) { setEndReason(groupData.end_leg_0 || `${pillar1}ล่มสลาย อำนาจนิติบัญญัติหมดสิ้น`); setGameState('gameover'); playGameOver(); return; }
    if (p.legislative >= 100) { setEndReason(groupData.end_leg_100 || `${pillar1}ครองอำนาจเบ็ดเสร็จ ประชาธิปไตยสิ้นสุด`); setGameState('gameover'); playGameOver(); return; }
    
    if (p.executive <= 0) { setEndReason(groupData.end_exe_0 || `${pillar2}ล้มเหลว รัฐบาลไม่อาจดำเนินการได้`); setGameState('gameover'); playGameOver(); return; }
    if (p.executive >= 100) { setEndReason(groupData.end_exe_100 || `${pillar2}เผด็จการ รัฐบาลกุมอำนาจทั้งหมด`); setGameState('gameover'); playGameOver(); return; }

    if (p.judiciary <= 0) { setEndReason(groupData.end_jud_0 || `${pillar3}ล่มสลาย กฎหมายไร้ความหมาย`); setGameState('gameover'); playGameOver(); return; }
    if (p.judiciary >= 100) { setEndReason(groupData.end_jud_100 || `${pillar3}ครองอำนาจ ตุลาการภิวัฒน์สุดขีด`); setGameState('gameover'); playGameOver(); return; }

    if (p.military <= 0) { setEndReason(groupData.end_mil_0 || `${pillar4}แตกกำลังใจ ประเทศไร้การป้องกัน`); setGameState('gameover'); playGameOver(); return; }
    if (p.military >= 100) { setEndReason(groupData.end_mil_100 || `${pillar4}ยึดอำนาจ รัฐประหารเกิดขึ้น`); setGameState('gameover'); playGameOver(); return; }

    if (currentCardIndex + 1 >= cards.length) {
      setEndReason(groupData.end_victory || 'คุณผ่านพ้นทุกวิกฤตได้อย่างยอดเยี่ยม! ประเทศยังคงดำรงอยู่ด้วยความสมดุล');
      setGameState('victory');
      playVictory();
    } else {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  if (gameState === 'menu') {
    return (
      <div className="container flex-center animate-fade-in" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '700px', textAlign: 'center' }}>
          <h1 className="text-gradient" style={{ marginBottom: '0.5rem' }}>Democracy Engine: Play</h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-muted)' }}>เลือกผลงานของเพื่อนๆ ที่เผยแพร่แล้ว หรือทดสอบเกมของตัวเอง</p>
          
          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '1rem', textAlign: 'left', color: '#60a5fa' }}>
              🌟 เกมที่เผยแพร่ล่าสุด
            </h3>
            {publishedGroups.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีเกมที่ถูกเผยแพร่</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                {publishedGroups.map(g => (
                  <button 
                    key={g.id} 
                    onClick={() => { setSelectedGroup(g.name); setTimeout(() => document.getElementById('start-btn')?.click(), 50); }}
                    className="glass-panel"
                    style={{ padding: '1rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                  >
                    <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.1rem' }}>{g.game_title || g.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>กลุ่ม: {g.name}</p>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g.credits ? 'โดย: ' + g.credits : 'ผู้สร้างนิรนาม'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '1rem', textAlign: 'left' }}>🔍 ค้นหากลุ่ม (สำหรับโหมดทดสอบ)</h4>
            <form onSubmit={startGame} style={{ display: 'flex', gap: '1rem' }}>
              <input 
                type="text" 
                className="input-field" 
                placeholder="พิมพ์ชื่อกลุ่มที่ต้องการทดสอบ..." 
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                style={{ flex: 1, margin: 0 }}
                required
              />
              <button id="start-btn" type="submit" className="btn-primary" style={{ width: 'auto' }}>เริ่มเกม</button>
            </form>
          </div>

          <a href="/" style={{ display: 'inline-block', marginTop: '2rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            &larr; กลับหน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  if (gameState === 'gameover' || gameState === 'victory') {
    return (
      <div className="container flex-center animate-fade-in" style={{ 
        minHeight: '100vh', padding: '2rem',
        background: groupData?.bg_image_url ? `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95)), url(${groupData.bg_image_url}) no-repeat center center fixed` : undefined,
        backgroundSize: 'cover'
      }}>
        {groupData && (
          <style dangerouslySetInnerHTML={{__html: `
            :root {
              --legislative-color: ${groupData.pillar_1_color || '#60a5fa'} !important;
              --executive-color: ${groupData.pillar_2_color || '#a78bfa'} !important;
              --judiciary-color: ${groupData.pillar_3_color || '#fbbf24'} !important;
              --military-color: ${groupData.pillar_4_color || '#34d399'} !important;
            }
          `}} />
        )}
        <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
          {gameState === 'victory' ? (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>🏆</div>
              <h1 style={{ color: 'var(--success)', fontSize: '3rem', marginBottom: '0.5rem' }}>VICTORY!</h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#86efac', lineHeight: 1.6 }}>{endReason}</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>💀</div>
              <h1 style={{ color: 'var(--danger)', fontSize: '3rem', marginBottom: '0.5rem' }}>GAME OVER</h1>
              <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: '#fca5a5', lineHeight: 1.6 }}>{endReason}</p>
            </>
          )}

          {/* Final Pillar Scores */}
          {(() => {
            const pillarData = [
              { name: groupData?.pillar_1_name || 'สภา', val: pillars.legislative, color: 'var(--legislative-color)', icon: groupData?.pillar_1_icon || '🏛️' },
              { name: groupData?.pillar_2_name || 'บริหาร', val: pillars.executive, color: 'var(--executive-color)', icon: groupData?.pillar_2_icon || '💼' },
              { name: groupData?.pillar_3_name || 'ศาล', val: pillars.judiciary, color: 'var(--judiciary-color)', icon: groupData?.pillar_3_icon || '⚖️' },
              { name: groupData?.pillar_4_name || 'ทหาร', val: pillars.military, color: 'var(--military-color)', icon: groupData?.pillar_4_icon || '🎖️' },
            ];
            const best = [...pillarData].sort((a,b) => b.val - a.val)[0];
            const worst = [...pillarData].sort((a,b) => a.val - b.val)[0];
            return (
              <div style={{ margin: '1.5rem 0', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem' }}>
                  {pillarData.map(p => (
                    <div key={p.name} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{p.icon}</div>
                      <div style={{ color: p.color, fontSize: '0.8rem', marginBottom: '0.3rem' }}>{p.name}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.3rem', color: p.val <= 15 ? '#ef4444' : p.val >= 85 ? '#f59e0b' : 'white' }}>{p.val}%</div>
                      <div style={{ width: '40px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0.3rem auto 0' }}>
                        <div style={{ width: `${p.val}%`, height: '100%', background: p.color, borderRadius: '2px' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', fontSize: '0.8rem' }}>
                  <span style={{ background: 'rgba(16,185,129,0.2)', color: '#6ee7b7', padding: '2px 10px', borderRadius: '12px' }}>🌟 ดีที่สุด: {best.icon} {best.name}</span>
                  <span style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '2px 10px', borderRadius: '12px' }}>⚠️ อ่อนแอสุด: {worst.icon} {worst.name}</span>
                </div>
              </div>
            );
          })()}

          {/* Credits Section */}
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem 1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>ผู้สร้างสรรค์ผลงาน</p>
            <p style={{ color: 'white', whiteSpace: 'pre-line', margin: 0 }}>
              {groupData?.credits || groupData?.name}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', width: '100%' }}>
            <button onClick={() => startGame()} className="btn-primary" style={{ flex: 1, background: '#3b82f6', padding: '10px' }}>🔄 เล่นอีกครั้ง</button>
            <button onClick={() => setGameState('menu')} className="btn-primary" style={{ flex: 1, background: 'var(--secondary)', padding: '10px' }}>🏠 เล่นเกมอื่น</button>
          </div>
          <a href="/" style={{ display: 'block', color: 'var(--text-muted)', textDecoration: 'none' }}>
            &larr; กลับหน้าหลัก
          </a>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];

  return (
    <div className="container animate-fade-in" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '1rem',
      height: '100vh',
      overflow: 'hidden',
      background: groupData?.bg_image_url ? `linear-gradient(rgba(15, 23, 42, 0.8), rgba(15, 23, 42, 0.95)), url(${groupData.bg_image_url}) no-repeat center center fixed` : undefined,
      backgroundSize: 'cover',
      position: 'relative'
    }}>
      {/* Exit Button */}
      <button 
        onClick={() => { if(confirm('ต้องการออกจากเกมและกลับสู่เมนูหลักหรือไม่?')) setGameState('menu'); }}
        style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', zIndex: 10 }}
      >
        &larr; ออกจากเกม
      </button>

      {groupData && (
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --legislative-color: ${groupData.pillar_1_color || '#60a5fa'} !important;
            --executive-color: ${groupData.pillar_2_color || '#a78bfa'} !important;
            --judiciary-color: ${groupData.pillar_3_color || '#fbbf24'} !important;
            --military-color: ${groupData.pillar_4_color || '#34d399'} !important;
          }
        `}} />
      )}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideLeft {
          to { transform: translateX(-200px) rotate(-15deg); opacity: 0; }
        }
        @keyframes slideRight {
          to { transform: translateX(200px) rotate(15deg); opacity: 0; }
        }
        .slide-left { animation: slideLeft 0.3s forwards; pointer-events: none; }
        .slide-right { animation: slideRight 0.3s forwards; pointer-events: none; }
        @keyframes pulseIcon {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}} />

      {/* 4 Pillars Header */}
      <div className="glass-panel pillars-container" style={{ width: '100%', maxWidth: '600px', padding: '1rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '1rem', flexShrink: 0 }}>
        <PillarBar name={groupData?.pillar_1_name || 'สภา'} value={pillars.legislative} color="var(--legislative-color)" icon={groupData?.pillar_1_icon || '🏛️'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_legislative : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_legislative : 0} />
        <PillarBar name={groupData?.pillar_2_name || 'บริหาร'} value={pillars.executive} color="var(--executive-color)" icon={groupData?.pillar_2_icon || '💼'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_executive : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_executive : 0} />
        <PillarBar name={groupData?.pillar_3_name || 'ศาล'} value={pillars.judiciary} color="var(--judiciary-color)" icon={groupData?.pillar_3_icon || '⚖️'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_judiciary : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_judiciary : 0} />
        <PillarBar name={groupData?.pillar_4_name || 'ทหาร'} value={pillars.military} color="var(--military-color)" icon={groupData?.pillar_4_icon || '🎖️'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_military : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_military : 0} />
      </div>

      <div style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', flexShrink: 0 }}>เทิร์นที่ {currentCardIndex + 1} / {cards.length}</div>

      {/* The Card */}
      <div 
        className={`glass-panel play-card-container ${animateDir}`} 
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        style={{ 
          width: '100%', 
          maxWidth: '400px', 
          flex: 1,
          minHeight: 0,
          maxHeight: '55vh',
          position: 'relative',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          border: currentCard?.card_type === 'crisis' ? `2px solid ${groupData?.crisis_color || '#ef4444'}` : `2px solid ${groupData?.resolution_color || '#eab308'}`,
          transformOrigin: 'bottom center',
          transition: isDragging ? 'none' : 'transform 0.2s',
          transform: animateDir ? undefined : 
                     isDragging ? `translateX(${dragOffset}px) rotate(${dragOffset * 0.05}deg)` :
                     hoverChoice === 'A' ? 'rotate(-3deg)' : 
                     hoverChoice === 'B' ? 'rotate(3deg)' : 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'pan-y'
        }}
      >
        <div style={{ aspectRatio: '3/2', width: '100%', flexShrink: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {currentCard?.image_url ? (
            <img src={currentCard?.image_url} alt="card image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'var(--secondary)', fontSize: '4rem' }}>❓</span>
          )}
        </div>

        <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{currentCard?.title}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{currentCard?.description}</p>
        </div>
      </div>

      {/* Choices Buttons (Simulating Swipe) */}
      <div className="play-choices-container" style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '100%', maxWidth: '600px', flexShrink: 0 }}>
        <button 
          onClick={() => handleChoice('A')}
          onMouseEnter={() => setHoverChoice('A')}
          onMouseLeave={() => setHoverChoice(null)}
          className="glass-panel play-choice-btn"
          style={{ flex: 1, padding: '1.5rem', borderLeft: '4px solid #60a5fa', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', color: 'white', background: hoverChoice === 'A' ? 'rgba(96, 165, 250, 0.2)' : 'rgba(15, 23, 42, 0.6)' }}
        >
          <div style={{ color: '#60a5fa', marginBottom: '0.5rem', fontSize: '0.8rem' }}>&larr; ปัดซ้าย</div>
          <div className="choice-text" style={{ fontWeight: 'bold' }}>{currentCard?.choice_a_text}</div>
        </button>

        <button 
          onClick={() => handleChoice('B')}
          onMouseEnter={() => setHoverChoice('B')}
          onMouseLeave={() => setHoverChoice(null)}
          className="glass-panel play-choice-btn"
          style={{ flex: 1, padding: '1.5rem', borderRight: '4px solid #a78bfa', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', color: 'white', background: hoverChoice === 'B' ? 'rgba(167, 139, 250, 0.2)' : 'rgba(15, 23, 42, 0.6)' }}
        >
          <div style={{ color: '#a78bfa', marginBottom: '0.5rem', fontSize: '0.8rem' }}>ปัดขวา &rarr;</div>
          <div className="choice-text" style={{ fontWeight: 'bold' }}>{currentCard?.choice_b_text}</div>
        </button>
      </div>

    </div>
  );
}

function PillarBar({ name, value, color, icon, impact }) {
  return (
    <div className="pillar-bar" style={{ display: 'flex', alignItems: 'center', width: '48%', marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '12px' }}>
      <div className="pillar-icon" style={{ fontSize: '1.5rem', marginRight: '0.8rem', position: 'relative' }}>
        {icon}
        {impact !== 0 && impact !== undefined && impact !== null && (
          <div style={{
            position: 'absolute', top: '-8px', right: '-8px',
            background: impact > 0 ? '#10b981' : '#ef4444',
            color: 'white', borderRadius: '50%', width: '18px', height: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem',
            boxShadow: '0 0 5px rgba(0,0,0,0.5)', animation: 'pulseIcon 1s infinite'
          }}>
            {impact > 0 ? '🔼' : '🔽'}
          </div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <span className="pillar-name" style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{name}</span>
          <span className="pillar-value" style={{ fontSize: '0.85rem', color: color }}>{value}%</span>
        </div>
        <div style={{ 
          width: '100%', 
          height: '12px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '6px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            height: '100%',
            width: `${value}%`,
            background: color,
            transition: 'width 0.3s ease'
          }}></div>
        </div>
      </div>
    </div>
  );
}
