"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';

const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      );
      
      const maxW = 600;
      if (canvas.width > maxW) {
         const scaleCanvas = document.createElement('canvas');
         scaleCanvas.width = maxW;
         scaleCanvas.height = maxW * (canvas.height/canvas.width);
         const sctx = scaleCanvas.getContext('2d');
         sctx.drawImage(canvas, 0, 0, scaleCanvas.width, scaleCanvas.height);
         resolve(scaleCanvas.toDataURL('image/jpeg', 0.8));
      } else {
         resolve(canvas.toDataURL('image/jpeg', 0.8));
      }
    };
    image.onerror = reject;
  });
};

export default function Editor() {
  const [groupData, setGroupData] = useState(null);
  const [cardsCount, setCardsCount] = useState(0);
  const [cardsList, setCardsList] = useState([]);
  const [activeTab, setActiveTab] = useState('cards'); // 'cards', 'gallery'
  
  // Cropper State
  const [cropModal, setCropModal] = useState({ isOpen: false, imageSrc: null, fieldName: null });
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!cropModal.imageSrc || !croppedAreaPixels) return;
    try {
      const croppedImageBase64 = await getCroppedImg(cropModal.imageSrc, croppedAreaPixels);
      if (cropModal.fieldName) {
         setSettings(prev => ({ ...prev, [cropModal.fieldName]: croppedImageBase64 }));
      } else {
         setPreviewUrl(croppedImageBase64);
         setFormData(prev => ({ ...prev, image_url: croppedImageBase64 }));
      }
      setCropModal({ isOpen: false, imageSrc: null, fieldName: null });
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch(err) {
      console.error(err);
      alert('Error cropping image');
    }
  };

  // Login & Project Selection State
  const [allProjects, setAllProjects] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(null); // group obj
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [createData, setCreateData] = useState({ name: '', game_title: '', password: '' });

  // Fetch all projects on mount
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/groups?all=true');
      const data = await res.json();
      if (Array.isArray(data)) setAllProjects(data);
    } catch(err) { console.error(err); }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: showLoginModal.name, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'เกิดข้อผิดพลาด');
        return;
      }
      onLoginSuccess(data);
    } catch (err) {
      setLoginError('เซิร์ฟเวอร์มีปัญหา');
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData)
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'เกิดข้อผิดพลาด');
        return;
      }
      onLoginSuccess(data);
    } catch (err) {
      setLoginError('เซิร์ฟเวอร์มีปัญหา');
    }
  };

  const onLoginSuccess = (data) => {
    setGroupData(data);
    setSettings({
      game_title: data.game_title || data.name,
      end_leg_0: data.end_leg_0, end_leg_100: data.end_leg_100,
      end_exe_0: data.end_exe_0, end_exe_100: data.end_exe_100,
      end_jud_0: data.end_jud_0, end_jud_100: data.end_jud_100,
      end_mil_0: data.end_mil_0, end_mil_100: data.end_mil_100,
      end_victory: data.end_victory, credits: data.credits || '',
      pillar_1_name: data.pillar_1_name || 'สภา', pillar_1_icon: data.pillar_1_icon || '🏛️',
      pillar_2_name: data.pillar_2_name || 'บริหาร', pillar_2_icon: data.pillar_2_icon || '💼',
      pillar_3_name: data.pillar_3_name || 'ศาล', pillar_3_icon: data.pillar_3_icon || '⚖️',
      pillar_4_name: data.pillar_4_name || 'ทหาร', pillar_4_icon: data.pillar_4_icon || '🎖️',
      intro_title: data.intro_title || 'วันแรกของการรับตำแหน่ง',
      intro_desc: data.intro_desc || 'ยินดีด้วย! คุณได้รับเลือกให้เป็นผู้นำคนใหม่ บททดสอบกำลังจะเริ่มขึ้น คุณพร้อมหรือยัง?',
      intro_choice_a: data.intro_choice_a || 'เริ่มบริหารประเทศ',
      intro_choice_b: data.intro_choice_b || 'พร้อมลุย!',
      intro_image_url: data.intro_image_url || '',
      bg_image_url: data.bg_image_url || '',
      crisis_color: data.crisis_color || '#ef4444',
      resolution_color: data.resolution_color || '#eab308',
      pillar_1_color: data.pillar_1_color || '#60a5fa',
      pillar_2_color: data.pillar_2_color || '#a78bfa',
      pillar_3_color: data.pillar_3_color || '#fbbf24',
      pillar_4_color: data.pillar_4_color || '#34d399'
    });
    fetchCards(data.id);
    setShowLoginModal(null);
    setShowCreateModal(false);
  };

  // Card Form State
  const [editingCardId, setEditingCardId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', card_type: 'crisis', image_url: '',
    choice_a_text: '', choice_a_legislative: 0, choice_a_executive: 0, choice_a_judiciary: 0, choice_a_military: 0,
    choice_b_text: '', choice_b_legislative: 0, choice_b_executive: 0, choice_b_judiciary: 0, choice_b_military: 0,
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [errors, setErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Group Settings State (Endings & Credits)
  const [settings, setSettings] = useState({});
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingSuccess, setSettingSuccess] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchCards = async (id) => {
    try {
      const res = await fetch(`/api/cards?group_id=${id}`);
      const data = await res.json();
      setCardsList(data);
      setCardsCount(data.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const validateCard = () => {
    const errs = [];
    const maxSum = formData.card_type === 'resolution' ? 20 : 10;
    const maxIndividual = formData.card_type === 'resolution' ? (groupData?.max_resolution_val || 30) : (groupData?.max_crisis_val || 20); // จำกัดค่าสูงสุด/ต่ำสุดรายเสา

    const aValues = [formData.choice_a_legislative, formData.choice_a_executive, formData.choice_a_judiciary, formData.choice_a_military];
    const aSum = aValues.reduce((a,b) => a + Number(b), 0);
    if (!aValues.some(v => Number(v) < 0)) errs.push('ตัวเลือก A ต้องมีคนเสียผลประโยชน์ (มีค่าติดลบ)');
    if (aSum > maxSum) errs.push(`ผลรวมตัวเลขตัวเลือก A ต้องไม่เกิน +${maxSum} (ปัจจุบัน: ${aSum})`);
    if (aSum < -maxSum) errs.push(`ผลรวมตัวเลขตัวเลือก A ต้องไม่ต่ำกว่า -${maxSum} (ปัจจุบัน: ${aSum})`);
    if (aValues.some(v => Math.abs(Number(v)) > maxIndividual)) errs.push(`ตัวเลือก A ใส่ค่าเกินกำหนด! (ใส่ได้สูงสุดไม่เกิน +/- ${maxIndividual})`);

    const bValues = [formData.choice_b_legislative, formData.choice_b_executive, formData.choice_b_judiciary, formData.choice_b_military];
    const bSum = bValues.reduce((a,b) => a + Number(b), 0);
    if (!bValues.some(v => Number(v) < 0)) errs.push('ตัวเลือก B ต้องมีคนเสียผลประโยชน์ (มีค่าติดลบ)');
    if (bSum > maxSum) errs.push(`ผลรวมตัวเลขตัวเลือก B ต้องไม่เกิน +${maxSum} (ปัจจุบัน: ${bSum})`);
    if (bSum < -maxSum) errs.push(`ผลรวมตัวเลขตัวเลือก B ต้องไม่ต่ำกว่า -${maxSum} (ปัจจุบัน: ${bSum})`);
    if (bValues.some(v => Math.abs(Number(v)) > maxIndividual)) errs.push(`ตัวเลือก B ใส่ค่าเกินกำหนด! (ใส่ได้สูงสุดไม่เกิน +/- ${maxIndividual})`);

    setErrors(errs);
    return errs.length === 0;
  };

  useEffect(() => {
    validateCard();
  }, [formData]);



  const handleCardSubmit = async (e) => {
    e.preventDefault();
    if (!validateCard()) return;
    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const method = editingCardId ? 'PUT' : 'POST';
      const bodyPayload = { ...formData, group_id: groupData.id, image_url: formData.image_url };
      if (editingCardId) bodyPayload.id = editingCardId;

      const res = await fetch('/api/cards', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (res.ok) {
        setSuccessMsg(editingCardId ? 'อัปเดตการ์ดสำเร็จ!' : 'บันทึกการ์ดใหม่สำเร็จ!');
        if (!editingCardId) {
          resetCardForm();
          window.scrollTo(0,0);
        }
        fetchCards(groupData.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCardForm = () => {
    setEditingCardId(null);
    setFormData({
      title: '', description: '', card_type: 'crisis', image_url: '',
      choice_a_text: '', choice_a_legislative: 0, choice_a_executive: 0, choice_a_judiciary: 0, choice_a_military: 0,
      choice_b_text: '', choice_b_legislative: 0, choice_b_executive: 0, choice_b_judiciary: 0, choice_b_military: 0,
    });
    setImageFile(null);
    setPreviewUrl(null);
  };

  const editCard = (card) => {
    setEditingCardId(card.id);
    setFormData({
      title: card.title, description: card.description || '', card_type: card.card_type, image_url: card.image_url || '',
      choice_a_text: card.choice_a_text, 
      choice_a_legislative: card.choice_a_legislative, choice_a_executive: card.choice_a_executive, choice_a_judiciary: card.choice_a_judiciary, choice_a_military: card.choice_a_military,
      choice_b_text: card.choice_b_text, 
      choice_b_legislative: card.choice_b_legislative, choice_b_executive: card.choice_b_executive, choice_b_judiciary: card.choice_b_judiciary, choice_b_military: card.choice_b_military,
    });
    setPreviewUrl(card.image_url);
    setImageFile(null);
    setActiveTab('cards');
    window.scrollTo(0,0);
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingSuccess('');
    try {
      const res = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupData.id, ...settings, is_published: groupData.is_published })
      });
      if (res.ok) {
        setSettingSuccess('บันทึกการตั้งค่าเกมสำเร็จ!');
        setGroupData(prev => ({...prev, game_title: settings.game_title}));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const publishGame = async () => {
    const crisisCount = cardsList.filter(c => c.card_type === 'crisis').length;
    const resolutionCount = cardsList.filter(c => c.card_type === 'resolution').length;

    if (cardsCount < 30) {
      alert(`ต้องสร้างการ์ดรวมทั้งหมดอย่างน้อย 30 ใบ (ตอนนี้มี ${cardsCount} ใบ)`);
      return;
    }
    if (crisisCount < 20) {
      alert(`ต้องมี 🔴 การ์ดวิกฤต (Crisis) อย่างน้อย 20 ใบ (ตอนนี้มี ${crisisCount} ใบ)`);
      return;
    }
    if (resolutionCount < 10) {
      alert(`ต้องมี 🟡 การ์ดเหตุการณ์พลิกผัน (Game Changer) อย่างน้อย 10 ใบ (ตอนนี้มี ${resolutionCount} ใบ)`);
      return;
    }
    if (!confirm('คุณแน่ใจหรือไม่ว่าจะเผยแพร่เกมนี้? (เผยแพร่แล้วเพื่อนกลุ่มอื่นจะเห็นเกมของคุณ)')) return;

    setIsPublishing(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: groupData.id, ...settings, is_published: 1 })
      });
      if (res.ok) {
        setGroupData({ ...groupData, is_published: 1 });
        alert('เผยแพร่เกมสำเร็จ! ตอนนี้เกมของคุณอยู่ในหน้ารวมเกมแล้ว');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'image_url') {
      setPreviewUrl(value);
    }
  };

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingsImageChange = (e, fieldName) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropModal({ isOpen: true, imageSrc: event.target.result, fieldName });
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCropModal({ isOpen: true, imageSrc: event.target.result, fieldName: null });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (!groupData) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            // Check activeTab to know which image state to update
            if (activeTab === 'cards') {
              handleImageChange({ target: { files: [file] } });
              e.preventDefault();
            } else if (activeTab === 'settings') {
              // Usually we don't know which settings image field they are targeting,
              // but we can default to the background image if they paste in settings.
              // For simplicity, let's just support pasting in the cards tab.
            }
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [groupData, activeTab]);

  const renderBalanceBar = (choice) => {
    const maxAllowed = formData.card_type === 'resolution' ? 20 : 10;
    const prefix = choice === 'A' ? 'choice_a' : 'choice_b';
    const sum = Number(formData[`${prefix}_legislative`]) + Number(formData[`${prefix}_executive`]) + Number(formData[`${prefix}_judiciary`]) + Number(formData[`${prefix}_military`]);
    const isOver = sum > maxAllowed;
    const isUnder = sum < -maxAllowed;
    const hasNegative = [formData[`${prefix}_legislative`], formData[`${prefix}_executive`], formData[`${prefix}_judiciary`], formData[`${prefix}_military`]].some(v => Number(v) < 0);
    const barWidth = Math.min(Math.max((sum + 30) / 60 * 100, 0), 100);

    return (
      <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <span>ผลรวมคะแนนสุทธิ (Net Impact): <strong>{sum > 0 ? `+${sum}` : sum}</strong> (ลิมิต: -{maxAllowed} ถึง +{maxAllowed})</span>
          {!hasNegative && <span style={{ color: 'var(--danger)' }}>⚠️ ยังไม่มีค่าติดลบ</span>}
        </div>
        <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ width: `${barWidth}%`, height: '100%', background: (isOver || isUnder) ? 'var(--danger)' : (sum > 0 ? '#fbbf24' : '#34d399'), transition: 'width 0.3s' }}></div>
        </div>
        {isOver && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>เกินเพดานบวก! ต้องลากเสาอื่นให้ติดลบเพื่อชดเชยสมดุล</div>}
        {isUnder && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '0.5rem' }}>เกินเพดานติดลบ! ต้องลากเสาอื่นให้เป็นบวกเพื่อชดเชยสมดุล</div>}
      </div>
    );
  };

  const renderSlider = (label, name, color) => {
    const maxVal = formData.card_type === 'resolution' ? (groupData.max_resolution_val || 30) : (groupData.max_crisis_val || 20);
    return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.85rem', color, fontWeight: 'bold' }}>{label}</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button 
            type="button" 
            onClick={() => setFormData(prev => ({ ...prev, [name]: 0 }))}
            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', transition: 'background 0.2s' }}
            title="รีเซ็ตค่าเป็น 0"
          >
            🔄 รีเซ็ต
          </button>
          <span style={{ fontSize: '0.85rem', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px', minWidth: '40px', textAlign: 'center' }}>
            {formData[name] > 0 ? `+${formData[name]}` : formData[name]}
          </span>
        </div>
      </div>
      <input 
        type="range" min={`-${maxVal}`} max={maxVal} step="1" 
        name={name} value={formData[name]} onChange={handleInputChange} 
        style={{ width: '100%', accentColor: color }}
      />
    </div>
  )};

  if (!groupData) {
    return (
      <div className="container flex-center animate-fade-in" style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '900px' }}>
          <h1 className="text-gradient" style={{ textAlign: 'center', marginBottom: '1rem' }}>Democracy Engine: Editor</h1>
          <p style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--text-muted)' }}>เลือกโปรเจกต์ของคุณเพื่อเข้าสู่ห้องออกแบบ หรือสร้างโปรเจกต์ใหม่</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {/* Create New Project Button */}
            <button 
              onClick={() => { setShowCreateModal(true); setLoginError(''); setCreateData({name:'', game_title:'', password:''}); }}
              className="glass-panel flex-center"
              style={{ minHeight: '120px', border: '2px dashed var(--primary)', cursor: 'pointer', flexDirection: 'column', color: 'var(--primary)', background: 'rgba(37, 99, 235, 0.1)' }}
            >
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>+</span>
              <span style={{ fontWeight: 'bold' }}>สร้างโปรเจกต์ใหม่</span>
            </button>

            {/* Existing Projects */}
            {allProjects.map(proj => (
              <div 
                key={proj.id} 
                onClick={() => { setShowLoginModal(proj); setLoginPassword(''); setLoginError(''); }}
                className="glass-panel"
                style={{ padding: '1.2rem', cursor: 'pointer', transition: 'all 0.2s', border: proj.is_published ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)' }}
                onMouseOver={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
                onMouseOut={(e) => e.currentTarget.style.borderColor = proj.is_published ? '#10b981' : 'rgba(255,255,255,0.1)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', background: proj.is_published ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: proj.is_published ? '#34d399' : '#fbbf24', padding: '2px 8px', borderRadius: '12px' }}>
                    {proj.is_published ? 'เผยแพร่แล้ว' : 'กำลังดำเนินการ'}
                  </span>
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{proj.game_title || proj.name}</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>กลุ่ม: {proj.name}</p>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>&larr; กลับหน้าหลัก</a>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>เข้าสู่ระบบ</h2>
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>โปรเจกต์: {showLoginModal.game_title || showLoginModal.name}</p>
              <form onSubmit={handleLoginSubmit}>
                <input 
                  type="password" placeholder="ใส่รหัสผ่านกลุ่ม..." className="input-field" 
                  value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required 
                />
                {loginError && <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{loginError}</p>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowLoginModal(null)} className="btn-primary" style={{ background: 'var(--secondary)' }}>ยกเลิก</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>ยืนยัน</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '2.5rem' }}>
              <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>สร้างโปรเจกต์เกมใหม่</h2>
              <form onSubmit={handleCreateSubmit}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>ชื่อกลุ่มผู้พัฒนา</label>
                <input 
                  type="text" placeholder="เช่น กลุ่ม 1 ห้อง 6/1" className="input-field" style={{ marginBottom: '1.5rem' }}
                  value={createData.name} onChange={e => setCreateData({...createData, name: e.target.value})} required 
                />
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>ชื่อเกมของคุณ</label>
                <input 
                  type="text" placeholder="เช่น Democracy: The Crisis" className="input-field" style={{ marginBottom: '1.5rem' }}
                  value={createData.game_title} onChange={e => setCreateData({...createData, game_title: e.target.value})} required 
                />
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>ตั้งรหัสผ่าน</label>
                <input 
                  type="password" placeholder="เพื่อป้องกันกลุ่มอื่นเข้ามาแก้ไข" className="input-field" 
                  value={createData.password} onChange={e => setCreateData({...createData, password: e.target.value})} required 
                />
                
                {loginError && <p style={{ color: 'var(--danger)', marginTop: '0.5rem' }}>{loginError}</p>}
                
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-primary" style={{ background: 'var(--secondary)' }}>ยกเลิก</button>
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>สร้างโปรเจกต์</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="container animate-fade-in">
      {groupData && (
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --legislative-color: ${settings.pillar_1_color || '#60a5fa'};
            --executive-color: ${settings.pillar_2_color || '#a78bfa'};
            --judiciary-color: ${settings.pillar_3_color || '#fbbf24'};
            --military-color: ${settings.pillar_4_color || '#34d399'};
          }
        `}} />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2><span className="text-gradient">{groupData.game_title || groupData.name}</span></h2>
          <p style={{ color: 'var(--text-muted)' }}>กลุ่ม: {groupData.name} | จำนวนการ์ด: {cardsCount} / 30 ขั้นต่ำ</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary" style={{ background: 'var(--danger)' }}>ออกจากระบบ</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button onClick={() => {setActiveTab('cards'); resetCardForm();}} className={`btn-primary`} style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === 'cards' && !editingCardId ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
          ➕ สร้างการ์ด
        </button>
        <button onClick={() => {setActiveTab('gallery'); setEditingCardId(null);}} className={`btn-primary`} style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === 'gallery' && !editingCardId ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
          📚 คลังการ์ด
        </button>
        <button onClick={() => {setActiveTab('settings'); setEditingCardId(null);}} className={`btn-primary`} style={{ flex: 1, minWidth: '100px', padding: '10px 5px', fontSize: '0.85rem', background: activeTab === 'settings' ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}>
          ⚙️ ตั้งค่าเกม/เผยแพร่
        </button>
      </div>

      {activeTab === 'cards' ? (
        <div className="grid-2">
          {/* Editor Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            {editingCardId && (
              <div style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fcd34d', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontWeight: 'bold' }}>
                ✏️ กำลังแก้ไขการ์ดเดิม
              </div>
            )}
            <div style={{ background: 'rgba(37, 99, 235, 0.1)', borderLeft: '4px solid var(--primary)', padding: '1.5rem', marginBottom: '2rem', borderRadius: '8px' }}>
              <h3 style={{ marginBottom: '0.5rem', color: '#60a5fa' }}>💡 กฎการดึงหลอดสมดุล (Game Balance)</h3>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <li>ต้องมีลบเสมอ: ทุกตัวเลือกห้ามแจกแต้มฟรี ต้องมีหลอดที่ถูกดึงไปทางซ้าย (ค่าติดลบ) อย่างน้อย 1 อัน</li>
                <li>หลอดผลรวมต้องไม่แดง: ผลรวมสุทธิ (Net Impact) ของ 🔴 การ์ดวิกฤต ต้องไม่เกิน <strong>+10</strong> ส่วน 🟡 การ์ดเหตุการณ์พลิกผัน จะให้สิทธิพิเศษถึง <strong>+20</strong> ถ้าเกินเพดาน คุณต้องดึงหลอดอื่นให้ติดลบเพื่อชดเชย</li>
              </ul>
            </div>

            <form onSubmit={handleCardSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>ประเภทการ์ด</label>
                <select name="card_type" value={formData.card_type} onChange={handleInputChange} className="input-field" style={{ background: 'rgba(0,0,0,0.4)' }}>
                  <option value="crisis">🔴 การ์ดวิกฤต (Crisis)</option>
                  <option value="resolution">🟡 การ์ดเหตุการณ์พลิกผัน (Game Changer)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>หัวข้อเหตุการณ์</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input-field" required placeholder="เช่น ม็อบประท้วงเรียกร้องขึ้นค่าแรง" />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>รายละเอียด (Optional)</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} className="input-field" rows="3" placeholder="อธิบายสถานการณ์เพิ่มเติม..."></textarea>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>รูปภาพประกอบ {editingCardId && '(ปล่อยว่างถ้าไม่ต้องการเปลี่ยนรูป)'}</label>
                <input type="file" accept="image/*" onChange={handleImageChange} className="input-field" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>* ระบบจะทำการบีบอัดและฝังรูปภาพลงในเซิร์ฟเวอร์ให้อัตโนมัติ (ไม่ต้องไปฝากรูปที่อื่นแล้ว)</p>
                <p style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '0.2rem' }}>💡 <strong>เคล็ดลับ:</strong> คุณสามารถกด <strong>Ctrl+V</strong> เพื่อวางรูปภาพจาก Clipboard ในหน้านี้ได้ทันที</p>
              </div>

              <hr style={{ border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }} />

              {/* Choice A with Sliders */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <h3 style={{ color: '#60a5fa' }}>ตัวเลือก A (ปัดซ้าย)</h3>
                <input type="text" name="choice_a_text" value={formData.choice_a_text} onChange={handleInputChange} className="input-field" required placeholder="ข้อความตัวเลือก เช่น ใช้ความรุนแรงปราบปราม" style={{ marginBottom: '1.5rem' }} />
                {renderSlider(`${settings.pillar_1_icon || '🏛️'} ${settings.pillar_1_name || 'สภา'}`, 'choice_a_legislative', 'var(--legislative-color)')}
                {renderSlider(`${settings.pillar_2_icon || '💼'} ${settings.pillar_2_name || 'บริหาร'}`, 'choice_a_executive', 'var(--executive-color)')}
                {renderSlider(`${settings.pillar_3_icon || '⚖️'} ${settings.pillar_3_name || 'ศาล'}`, 'choice_a_judiciary', 'var(--judiciary-color)')}
                {renderSlider(`${settings.pillar_4_icon || '🎖️'} ${settings.pillar_4_name || 'ทหาร'}`, 'choice_a_military', 'var(--military-color)')}

                {renderBalanceBar('A')}
              </div>

              {/* Choice B with Sliders */}
              <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <h3 style={{ color: '#a78bfa' }}>ตัวเลือก B (ปัดขวา)</h3>
                <input type="text" name="choice_b_text" value={formData.choice_b_text} onChange={handleInputChange} className="input-field" required placeholder="ข้อความตัวเลือก เช่น ยอมเจรจาและเพิ่มค่าแรง" style={{ marginBottom: '1.5rem' }} />
                {renderSlider(`${settings.pillar_1_icon || '🏛️'} ${settings.pillar_1_name || 'สภา'}`, 'choice_b_legislative', 'var(--legislative-color)')}
                {renderSlider(`${settings.pillar_2_icon || '💼'} ${settings.pillar_2_name || 'บริหาร'}`, 'choice_b_executive', 'var(--executive-color)')}
                {renderSlider(`${settings.pillar_3_icon || '⚖️'} ${settings.pillar_3_name || 'ศาล'}`, 'choice_b_judiciary', 'var(--judiciary-color)')}
                {renderSlider(`${settings.pillar_4_icon || '🎖️'} ${settings.pillar_4_name || 'ทหาร'}`, 'choice_b_military', 'var(--military-color)')}

                {renderBalanceBar('B')}
              </div>

              {errors.length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--danger)' }}>
                  <strong style={{ color: 'var(--danger)' }}>⚠️ ผิดกฎ Game Balance:</strong>
                  <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#fca5a5' }}>
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}
              {successMsg && <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--success)', color: '#6ee7b7' }}>✅ {successMsg}</div>}

              <div style={{ display: 'flex', gap: '1rem' }}>
                {editingCardId && (
                  <button type="button" onClick={resetCardForm} className="btn-primary" style={{ background: 'var(--secondary)' }}>ยกเลิก</button>
                )}
                <button type="submit" className="btn-primary" style={{ flex: 1, fontSize: '1.2rem' }} disabled={errors.length > 0 || isSubmitting}>
                  {isSubmitting ? 'กำลังบันทึก...' : (editingCardId ? 'อัปเดตการ์ด' : 'บันทึกการ์ดใหม่')}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview */}
          <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Live Preview</h3>
            <div className="glass-panel" style={{ width: '320px', height: '480px', margin: '0 auto', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', border: formData.card_type === 'crisis' ? `2px solid ${settings.crisis_color || '#ef4444'}` : `2px solid ${settings.resolution_color || '#eab308'}` }}>
              <div style={{ flex: 1, minHeight: '150px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {previewUrl ? <img src={previewUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'var(--secondary)' }}>[ไม่มีรูปภาพ]</span>}
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--bg-dark)', flexShrink: 0 }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{formData.title || 'ชื่อเหตุการณ์...'}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{formData.description || 'คำอธิบายเหตุการณ์...'}</p>
              </div>
            </div>
            <div style={{ width: '320px', margin: '1.5rem auto 0', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ width: '48%', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center', borderLeft: '3px solid #60a5fa' }}>
                <div style={{ fontSize: '0.8rem', color: '#60a5fa', marginBottom: '0.5rem' }}>&larr; ปัดซ้าย</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{formData.choice_a_text || 'ตัวเลือก A'}</div>
              </div>
              <div style={{ width: '48%', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center', borderRight: '3px solid #a78bfa' }}>
                <div style={{ fontSize: '0.8rem', color: '#a78bfa', marginBottom: '0.5rem' }}>ปัดขวา &rarr;</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{formData.choice_b_text || 'ตัวเลือก B'}</div>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          
          {/* Top Actions: Test & Publish */}
          <div className="manage-header" style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>จัดการผลงานของคุณ</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>ทดลองเล่นเกมที่สร้างขึ้น และเผยแพร่ให้เพื่อนๆ เล่น</p>
            </div>
            <button 
              onClick={() => window.open('/play?group=' + encodeURIComponent(groupData.name), '_blank')} 
              className="btn-primary" 
              style={{ background: '#3b82f6' }}>
              🎮 ทดลองเล่นเกม
            </button>
            <button 
              onClick={() => {
                const url = window.location.origin + '/play?group=' + encodeURIComponent(groupData.name);
                navigator.clipboard.writeText(url);
                alert('คัดลอกลิงก์เกมเรียบร้อยแล้ว นำไปส่งให้เพื่อนเล่นได้เลยครับ!');
              }}
              className="btn-primary" 
              style={{ background: '#8b5cf6' }}>
              🔗 คัดลอกลิงก์เกม
            </button>
            {groupData.is_published ? (
              <button disabled className="btn-primary" style={{ background: '#10b981', cursor: 'default' }}>
                ✅ เผยแพร่แล้ว
              </button>
            ) : (
              <button 
                onClick={publishGame} 
                disabled={isPublishing || cardsCount < 30 || cardsList.filter(c => c.card_type === 'crisis').length < 20 || cardsList.filter(c => c.card_type === 'resolution').length < 10}
                className="btn-primary" 
                style={{ background: (cardsCount < 30 || cardsList.filter(c => c.card_type === 'crisis').length < 20 || cardsList.filter(c => c.card_type === 'resolution').length < 10) ? 'var(--secondary)' : '#f59e0b', color: (cardsCount < 30 || cardsList.filter(c => c.card_type === 'crisis').length < 20 || cardsList.filter(c => c.card_type === 'resolution').length < 10) ? '#666' : 'white' }}>
                🚀 เผยแพร่ผลงาน ({cardsCount}/30)
              </button>
            )}
          </div>

          {/* Group Settings: Title, Endings & Credits */}
          <div className="settings-panel" style={{ marginBottom: '3rem', padding: '2rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}>
            <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>ตั้งค่าเกม: ฉากจบและเครดิตผู้สร้าง</h2>
            {settingSuccess && <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--success)', color: '#6ee7b7' }}>✅ {settingSuccess}</div>}
            <form onSubmit={handleSettingsSubmit}>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: 'white' }}>🎮 ชื่อเกม (Game Title)</h3>
                <input type="text" name="game_title" value={settings.game_title} onChange={handleSettingChange} className="input-field" required />
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: 'white' }}>📝 เครดิตผู้สร้าง (Credits)</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>รายชื่อนักเรียนในกลุ่ม จะแสดงตอนจบเกม</p>
                <textarea name="credits" value={settings.credits} onChange={handleSettingChange} className="input-field" rows="2" placeholder="เช่น ด.ช.สมชาย ด.ญ.สมหญิง ชั้น ม.6/1" required></textarea>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ color: 'var(--success)' }}>🏆 ฉากจบชนะ (เล่นรอดครบ 20 เทิร์น)</h3>
                <input type="text" name="end_victory" value={settings.end_victory} onChange={handleSettingChange} className="input-field" required />
              </div>
              <hr style={{ border: '1px solid rgba(255,255,255,0.1)', marginBottom: '2rem' }} />
              <div className="grid-2">
                <div>
                  <h3 style={{ color: 'var(--legislative-color)' }}>{settings.pillar_1_icon || '🏛️'} {settings.pillar_1_name || 'นิติบัญญัติ (สภา)'}</h3>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_1_name || 'สภา'} เหลือ 0%</label><input type="text" name="end_leg_0" value={settings.end_leg_0} onChange={handleSettingChange} className="input-field" required /></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_1_name || 'สภา'} เต็ม 100%</label><input type="text" name="end_leg_100" value={settings.end_leg_100} onChange={handleSettingChange} className="input-field" required /></div>
                </div>
                <div>
                  <h3 style={{ color: 'var(--executive-color)' }}>{settings.pillar_2_icon || '💼'} {settings.pillar_2_name || 'บริหาร (รัฐบาล)'}</h3>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_2_name || 'บริหาร'} เหลือ 0%</label><input type="text" name="end_exe_0" value={settings.end_exe_0} onChange={handleSettingChange} className="input-field" required /></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_2_name || 'บริหาร'} เต็ม 100%</label><input type="text" name="end_exe_100" value={settings.end_exe_100} onChange={handleSettingChange} className="input-field" required /></div>
                </div>
                <div>
                  <h3 style={{ color: 'var(--judiciary-color)' }}>{settings.pillar_3_icon || '⚖️'} {settings.pillar_3_name || 'ตุลาการ (ศาล)'}</h3>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_3_name || 'ศาล'} เหลือ 0%</label><input type="text" name="end_jud_0" value={settings.end_jud_0} onChange={handleSettingChange} className="input-field" required /></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_3_name || 'ศาล'} เต็ม 100%</label><input type="text" name="end_jud_100" value={settings.end_jud_100} onChange={handleSettingChange} className="input-field" required /></div>
                </div>
                <div>
                  <h3 style={{ color: 'var(--military-color)' }}>{settings.pillar_4_icon || '🎖️'} {settings.pillar_4_name || 'ทหาร (กองทัพ)'}</h3>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_4_name || 'ทหาร'} เหลือ 0%</label><input type="text" name="end_mil_0" value={settings.end_mil_0} onChange={handleSettingChange} className="input-field" required /></div>
                  <div style={{ marginBottom: '1rem' }}><label style={{ fontSize: '0.85rem' }}>ค่า {settings.pillar_4_name || 'ทหาร'} เต็ม 100%</label><input type="text" name="end_mil_100" value={settings.end_mil_100} onChange={handleSettingChange} className="input-field" required /></div>
                </div>
              </div>

              <hr style={{ border: '1px solid rgba(255,255,255,0.1)', margin: '3rem 0 2rem 0' }} />
              <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: '#60a5fa' }}>ตั้งค่าการ์ดใบแรก (Intro Card)</h2>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>หัวข้อการ์ดใบแรก</h3>
                <input type="text" name="intro_title" value={settings.intro_title || ''} onChange={handleSettingChange} className="input-field" required />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>เนื้อเรื่องเกริ่นนำ</h3>
                <textarea name="intro_desc" value={settings.intro_desc || ''} onChange={handleSettingChange} className="input-field" rows="3" required></textarea>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>รูปภาพประกอบการ์ดใบแรก</h3>
                <input type="file" accept="image/*" onChange={(e) => handleSettingsImageChange(e, 'intro_image_url')} className="input-field" />
                {settings.intro_image_url && <img src={settings.intro_image_url} alt="intro preview" style={{ width: '100px', marginTop: '10px', borderRadius: '8px' }} />}
              </div>
              <div className="grid-2">
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ข้อความตัวเลือก A (ซ้าย)</h3>
                  <input type="text" name="intro_choice_a" value={settings.intro_choice_a || ''} onChange={handleSettingChange} className="input-field" required />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ข้อความตัวเลือก B (ขวา)</h3>
                  <input type="text" name="intro_choice_b" value={settings.intro_choice_b || ''} onChange={handleSettingChange} className="input-field" required />
                </div>
              </div>

              <hr style={{ border: '1px solid rgba(255,255,255,0.1)', margin: '3rem 0 2rem 0' }} />
              <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: '#f472b6' }}>🎨 การตกแต่งและธีม (Theme & Styling)</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>ออกแบบสีของการ์ดและเสาคะแนนให้เข้ากับเกมของคุณ และใส่ภาพพื้นหลังได้ตามใจชอบ</p>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>🖼️ รูปภาพพื้นหลังเกม (Background)</h3>
                <input type="file" accept="image/*" onChange={(e) => handleSettingsImageChange(e, 'bg_image_url')} className="input-field" />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>* อัปโหลดรูปภาพเพื่อใช้เป็นพื้นหลังตอนเล่นเกม</p>
                {settings.bg_image_url && <img src={settings.bg_image_url} alt="bg preview" style={{ width: '200px', marginTop: '10px', borderRadius: '8px' }} />}
              </div>

              <div className="grid-2" style={{ marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="color" name="crisis_color" value={settings.crisis_color || '#ef4444'} onChange={handleSettingChange} style={{ width: '40px', height: '40px', cursor: 'pointer', background: 'none', border: 'none' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>สีการ์ดวิกฤต (Crisis)</h3>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="color" name="resolution_color" value={settings.resolution_color || '#eab308'} onChange={handleSettingChange} style={{ width: '40px', height: '40px', cursor: 'pointer', background: 'none', border: 'none' }} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem' }}>สีการ์ดพลิกผัน (Game Changer)</h3>
                  </div>
                </div>
              </div>

              <div className="grid-2">
                <div className="settings-pillar-box" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderTop: `3px solid ${settings.pillar_1_color || 'var(--legislative-color)'}` }}>
                  <h3>เสาที่ 1</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="text" name="pillar_1_icon" value={settings.pillar_1_icon || ''} onChange={handleSettingChange} className="input-field" style={{ width: '60px', textAlign: 'center' }} placeholder="ไอคอน" />
                    <input type="text" name="pillar_1_name" value={settings.pillar_1_name || ''} onChange={handleSettingChange} className="input-field" style={{ flex: 1 }} placeholder="ชื่อเสาหลัก เช่น สภา" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="color" name="pillar_1_color" value={settings.pillar_1_color || '#60a5fa'} onChange={handleSettingChange} style={{ cursor: 'pointer', background: 'none', border: 'none' }} />
                    <span style={{ fontSize: '0.85rem' }}>สีประจำเสา</span>
                  </div>
                </div>
                <div className="settings-pillar-box" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderTop: `3px solid ${settings.pillar_2_color || 'var(--executive-color)'}` }}>
                  <h3>เสาที่ 2</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="text" name="pillar_2_icon" value={settings.pillar_2_icon || ''} onChange={handleSettingChange} className="input-field" style={{ width: '60px', textAlign: 'center' }} placeholder="ไอคอน" />
                    <input type="text" name="pillar_2_name" value={settings.pillar_2_name || ''} onChange={handleSettingChange} className="input-field" style={{ flex: 1 }} placeholder="ชื่อเสาหลัก เช่น บริหาร" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="color" name="pillar_2_color" value={settings.pillar_2_color || '#a78bfa'} onChange={handleSettingChange} style={{ cursor: 'pointer', background: 'none', border: 'none' }} />
                    <span style={{ fontSize: '0.85rem' }}>สีประจำเสา</span>
                  </div>
                </div>
                <div className="settings-pillar-box" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderTop: `3px solid ${settings.pillar_3_color || 'var(--judiciary-color)'}` }}>
                  <h3>เสาที่ 3</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="text" name="pillar_3_icon" value={settings.pillar_3_icon || ''} onChange={handleSettingChange} className="input-field" style={{ width: '60px', textAlign: 'center' }} placeholder="ไอคอน" />
                    <input type="text" name="pillar_3_name" value={settings.pillar_3_name || ''} onChange={handleSettingChange} className="input-field" style={{ flex: 1 }} placeholder="ชื่อเสาหลัก เช่น ศาล" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="color" name="pillar_3_color" value={settings.pillar_3_color || '#fbbf24'} onChange={handleSettingChange} style={{ cursor: 'pointer', background: 'none', border: 'none' }} />
                    <span style={{ fontSize: '0.85rem' }}>สีประจำเสา</span>
                  </div>
                </div>
                <div className="settings-pillar-box" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '8px', borderTop: `3px solid ${settings.pillar_4_color || 'var(--military-color)'}` }}>
                  <h3>เสาที่ 4</h3>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="text" name="pillar_4_icon" value={settings.pillar_4_icon || ''} onChange={handleSettingChange} className="input-field" style={{ width: '60px', textAlign: 'center' }} placeholder="ไอคอน" />
                    <input type="text" name="pillar_4_name" value={settings.pillar_4_name || ''} onChange={handleSettingChange} className="input-field" style={{ flex: 1 }} placeholder="ชื่อเสาหลัก เช่น ทหาร" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="color" name="pillar_4_color" value={settings.pillar_4_color || '#34d399'} onChange={handleSettingChange} style={{ cursor: 'pointer', background: 'none', border: 'none' }} />
                    <span style={{ fontSize: '0.85rem' }}>สีประจำเสา</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '3rem', fontSize: '1.2rem' }} disabled={isSavingSettings}>
                {isSavingSettings ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0 }}>คลังการ์ดทั้งหมด ({cardsList.length}/30 ขั้นต่ำ)</h2>
          </div>
          
          {cardsList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>ยังไม่มีการ์ดในคลัง ไปสร้างการ์ดใหม่ได้เลย!</p>
          ) : (
            <>
              <h3 style={{ color: '#ef4444', marginBottom: '1rem', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', paddingBottom: '0.5rem' }}>
                🔴 การ์ดวิกฤต (Crisis) - {cardsList.filter(c => c.card_type === 'crisis').length}/20 ใบ (ขั้นต่ำ)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                {cardsList.filter(c => c.card_type === 'crisis').map(card => (
                  <div key={card.id} className="glass-panel" style={{ padding: '1rem', cursor: 'pointer', border: '1px solid #ef4444' }} onClick={() => editCard(card)}>
                    <div style={{ aspectRatio: '3/2', width: '100%', background: 'rgba(0,0,0,0.5)', marginBottom: '1rem', borderRadius: '4px', overflow: 'hidden' }}>
                      {card.image_url ? <img src={card.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>[No Image]</div>}
                    </div>
                    <h4 style={{ margin: 0 }}>{card.title}</h4>
                    <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '0.5rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#60a5fa' }}>👈 เลือก A: {card.stats_a || 0}</span>
                        <span style={{ color: '#a78bfa' }}>เลือก B: {card.stats_b || 0} 👉</span>
                      </div>
                      <div style={{ display: 'flex', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${((card.stats_a || 0) / (((card.stats_a || 0) + (card.stats_b || 0)) || 1)) * 100}%`, background: '#60a5fa' }}></div>
                        <div style={{ width: `${((card.stats_b || 0) / (((card.stats_a || 0) + (card.stats_b || 0)) || 1)) * 100}%`, background: '#a78bfa' }}></div>
                      </div>
                    </div>
                    <button className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', marginTop: '1rem' }}>แก้ไขการ์ดนี้</button>
                  </div>
                ))}
                {cardsList.filter(c => c.card_type === 'crisis').length === 0 && <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีการ์ดวิกฤต</p>}
              </div>

              <h3 style={{ color: '#eab308', marginBottom: '1rem', borderBottom: '1px solid rgba(234, 179, 8, 0.3)', paddingBottom: '0.5rem' }}>
                🟡 การ์ดเหตุการณ์พลิกผัน (Game Changer) - {cardsList.filter(c => c.card_type === 'resolution').length}/10 ใบ (ขั้นต่ำ)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
                {cardsList.filter(c => c.card_type === 'resolution').map(card => (
                  <div key={card.id} className="glass-panel" style={{ padding: '1rem', cursor: 'pointer', border: '1px solid #eab308' }} onClick={() => editCard(card)}>
                    <div style={{ aspectRatio: '3/2', width: '100%', background: 'rgba(0,0,0,0.5)', marginBottom: '1rem', borderRadius: '4px', overflow: 'hidden' }}>
                      {card.image_url ? <img src={card.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>[No Image]</div>}
                    </div>
                    <h4 style={{ margin: 0 }}>{card.title}</h4>
                    <div style={{ marginTop: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', padding: '0.5rem', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: '#60a5fa' }}>👈 เลือก A: {card.stats_a || 0}</span>
                        <span style={{ color: '#a78bfa' }}>เลือก B: {card.stats_b || 0} 👉</span>
                      </div>
                      <div style={{ display: 'flex', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${((card.stats_a || 0) / (((card.stats_a || 0) + (card.stats_b || 0)) || 1)) * 100}%`, background: '#60a5fa' }}></div>
                        <div style={{ width: `${((card.stats_b || 0) / (((card.stats_a || 0) + (card.stats_b || 0)) || 1)) * 100}%`, background: '#a78bfa' }}></div>
                      </div>
                    </div>
                    <button className="btn-primary" style={{ width: '100%', padding: '0.5rem', fontSize: '0.9rem', marginTop: '1rem' }}>แก้ไขการ์ดนี้</button>
                  </div>
                ))}
                {cardsList.filter(c => c.card_type === 'resolution').length === 0 && <p style={{ color: 'var(--text-muted)' }}>ยังไม่มีการ์ดเหตุการณ์พลิกผัน</p>}
              </div>
            </>
          )}
        </div>
      )}
      {cropModal.isOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" style={{ width: '90%', maxWidth: '600px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary)' }}>ครอบตัดรูปภาพ</h2>
              <button onClick={() => setCropModal({ isOpen: false, imageSrc: null, fieldName: null })} className="icon-btn" style={{ fontSize: '1.5rem' }}>✕</button>
            </div>
            
            <div style={{ position: 'relative', flex: 1, backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden' }}>
              <Cropper
                image={cropModal.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropModal.fieldName === 'bg_image_url' ? 16/9 : 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ซูม:</span>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
              <button onClick={handleCropSave} className="btn-primary" style={{ padding: '0.5rem 1.5rem' }}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
