"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { initAudio, playSwipe, playGameOver, playVictory } from '@/lib/audio';

export default function Play() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [cards, setCards] = useState([]);
  const [gameState, setGameState] = useState('menu'); 
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  
  const [pillars, setPillars] = useState({
    legislative: 50,
    executive: 50,
    judiciary: 50,
    military: 50
  });
  const [isHardMode, setIsHardMode] = useState(false);

  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const [endReason, setEndReason] = useState('');

  const [publishedGroups, setPublishedGroups] = useState([]);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const testGroup = urlParams.get('group');
    
    if (testGroup) {
      setSelectedGroup(testGroup);
      setTimeout(() => {
        document.getElementById('start-btn')?.click();
      }, 100);
    }

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
      
      const introCard = {
        id: 'intro',
        title: groupInfo.intro_title || 'วันแรกของการรับตำแหน่ง',
        description: groupInfo.intro_desc || 'เลือกโหมดการเล่น: ปัดซ้าย (ปกติ) / ปัดขวา (ยาก)',
        card_type: 'resolution',
        image_url: groupInfo.intro_image_url || '',
        choice_a_text: groupInfo.intro_choice_a || 'โหมดปกติ',
        choice_a_legislative: 0, choice_a_executive: 0, choice_a_judiciary: 0, choice_a_military: 0,
        choice_b_text: groupInfo.intro_choice_b || 'โหมดยาก (Hard Mode)',
        choice_b_legislative: 0, choice_b_executive: 0, choice_b_judiciary: 0, choice_b_military: 0
      };

      setCards([introCard, ...shuffled.slice(0, 19)]);
      
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
    
    const card = cards[currentCardIndex];
    let p = { ...pillars };

    if (card.id === 'intro') {
      setIsHardMode(choice === 'B');
    }

    if (card.id !== 'intro') {
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
    if (p.legislative <= 0) { setEndReason(groupData.end_leg_0); setGameState('gameover'); playGameOver(); return; }
    if (p.legislative >= 100) { setEndReason(groupData.end_leg_100); setGameState('gameover'); playGameOver(); return; }
    
    if (p.executive <= 0) { setEndReason(groupData.end_exe_0); setGameState('gameover'); playGameOver(); return; }
    if (p.executive >= 100) { setEndReason(groupData.end_exe_100); setGameState('gameover'); playGameOver(); return; }

    if (p.judiciary <= 0) { setEndReason(groupData.end_jud_0); setGameState('gameover'); playGameOver(); return; }
    if (p.judiciary >= 100) { setEndReason(groupData.end_jud_100); setGameState('gameover'); playGameOver(); return; }

    if (p.military <= 0) { setEndReason(groupData.end_mil_0); setGameState('gameover'); playGameOver(); return; }
    if (p.military >= 100) { setEndReason(groupData.end_mil_100); setGameState('gameover'); playGameOver(); return; }

    if (currentCardIndex + 1 >= cards.length) {
      setEndReason(groupData.end_victory);
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

          <Link href="/" style={{ display: 'inline-block', marginTop: '2rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
            &larr; กลับหน้าหลัก
          </Link>
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
              <h1 style={{ color: 'var(--success)', fontSize: '3.5rem', marginBottom: '0.5rem' }}>VICTORY</h1>
              <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: 'white' }}>คุณสามารถประคองประเทศรอดพ้นได้ครบเทิร์น!</p>
            </>
          ) : (
            <>
              <h1 style={{ color: 'var(--danger)', fontSize: '3.5rem', marginBottom: '0.5rem' }}>GAME OVER</h1>
              <p style={{ fontSize: '1.5rem', marginBottom: '2rem', color: 'white' }}>{endReason}</p>
            </>
          )}
          
          <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <div style={{ color: 'var(--legislative-color)', marginBottom: '0.5rem' }}>{groupData?.pillar_1_name || 'สภา'}</div>
              <h2 style={{ margin: 0 }}>{pillars.legislative}%</h2>
            </div>
            <div>
              <div style={{ color: 'var(--executive-color)', marginBottom: '0.5rem' }}>{groupData?.pillar_2_name || 'บริหาร'}</div>
              <h2 style={{ margin: 0 }}>{pillars.executive}%</h2>
            </div>
            <div>
              <div style={{ color: 'var(--judiciary-color)', marginBottom: '0.5rem' }}>{groupData?.pillar_3_name || 'ศาล'}</div>
              <h2 style={{ margin: 0 }}>{pillars.judiciary}%</h2>
            </div>
            <div>
              <div style={{ color: 'var(--military-color)', marginBottom: '0.5rem' }}>{groupData?.pillar_4_name || 'ทหาร'}</div>
              <h2 style={{ margin: 0 }}>{pillars.military}%</h2>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>Credits / ผู้สร้างสรรค์ผลงาน</h3>
            <p style={{ color: 'white', whiteSpace: 'pre-line', margin: 0, fontSize: '1.1rem' }}>
              {groupData?.credits || groupData?.name}
            </p>
          </div>

          <button onClick={() => setGameState('menu')} className="btn-primary" style={{ width: '100%', marginBottom: '1.5rem', fontSize: '1.2rem' }}>เล่นเกมอื่น / เล่นอีกครั้ง</button>
          <Link href="/" style={{ display: 'block', color: 'var(--text-muted)', textDecoration: 'none' }}>
            &larr; กลับหน้าหลัก
          </Link>
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
      paddingTop: '2rem',
      minHeight: '100vh',
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
      <div className="glass-panel pillars-container" style={{ width: '100%', maxWidth: '600px', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <PillarBar name={groupData?.pillar_1_name || 'สภา'} value={pillars.legislative} color="var(--legislative-color)" icon={groupData?.pillar_1_icon || '🏛️'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_legislative : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_legislative : 0} />
        <PillarBar name={groupData?.pillar_2_name || 'บริหาร'} value={pillars.executive} color="var(--executive-color)" icon={groupData?.pillar_2_icon || '💼'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_executive : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_executive : 0} />
        <PillarBar name={groupData?.pillar_3_name || 'ศาล'} value={pillars.judiciary} color="var(--judiciary-color)" icon={groupData?.pillar_3_icon || '⚖️'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_judiciary : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_judiciary : 0} />
        <PillarBar name={groupData?.pillar_4_name || 'ทหาร'} value={pillars.military} color="var(--military-color)" icon={groupData?.pillar_4_icon || '🎖️'} impact={(!isHardMode && hoverChoice === 'A') ? currentCard?.choice_a_military : (!isHardMode && hoverChoice === 'B') ? currentCard?.choice_b_military : 0} />
      </div>

      <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>เทิร์นที่ {currentCardIndex + 1} / {cards.length}</div>

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
          height: 'calc(100vh - 280px)',
          minHeight: '300px',
          maxHeight: '500px',
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
          touchAction: 'none'
        }}
      >
        <div style={{ 
          background: currentCard?.card_type === 'crisis' ? (groupData?.crisis_color || '#ef4444') : (groupData?.resolution_color || '#eab308'),
          color: currentCard?.card_type === 'crisis' ? 'white' : 'black',
          padding: '8px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          {currentCard?.card_type === 'crisis' ? 'วิกฤต (Crisis)' : 'โอกาส (Resolution)'}
        </div>

        <div style={{ flex: 1, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {currentCard?.image_url ? (
            <img src={currentCard.image_url} alt="card image" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: 'var(--secondary)', fontSize: '4rem' }}>❓</span>
          )}
        </div>

        <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', minHeight: '35%' }}>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{currentCard?.title}</h2>
          <p style={{ color: 'var(--text-muted)' }}>{currentCard?.description}</p>
        </div>
      </div>

      {/* Choices Buttons (Simulating Swipe) */}
      <div className="play-choices-container" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', width: '100%', maxWidth: '600px' }}>
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
