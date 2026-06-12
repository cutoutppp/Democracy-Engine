import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, password, game_title } = data;
    if (!name || !password) return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });

    const existing = await db.get('SELECT * FROM groups WHERE name = ?', [name]);
    if (existing) {
      if (existing.password !== password) {
        return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้องสำหรับกลุ่มนี้' }, { status: 401 });
      }
      return NextResponse.json(existing);
    }
    
    const id = Date.now().toString(); // Basic unique ID since uuid is removed from my snippet
    await db.run('INSERT INTO groups (id, name, password, game_title) VALUES (?, ?, ?, ?)', [id, name, password, game_title || name]);
    const newGroup = await db.get('SELECT * FROM groups WHERE id = ?', [id]);
    
    return NextResponse.json(newGroup);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { 
      id, end_leg_0, end_leg_100, end_exe_0, end_exe_100, end_jud_0, end_jud_100, end_mil_0, end_mil_100, end_victory, credits, is_published, game_title,
      pillar_1_name, pillar_1_icon, pillar_2_name, pillar_2_icon, pillar_3_name, pillar_3_icon, pillar_4_name, pillar_4_icon,
      intro_title, intro_desc, intro_choice_a, intro_choice_b, intro_image_url,
      bg_image_url, crisis_color, resolution_color, pillar_1_color, pillar_2_color, pillar_3_color, pillar_4_color
    } = data;

    if (!id) return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });

    await db.run(`
      UPDATE groups SET
        end_leg_0 = ?, end_leg_100 = ?,
        end_exe_0 = ?, end_exe_100 = ?,
        end_jud_0 = ?, end_jud_100 = ?,
        end_mil_0 = ?, end_mil_100 = ?,
        end_victory = ?, credits = ?, is_published = ?, game_title = ?,
        pillar_1_name = ?, pillar_1_icon = ?, pillar_2_name = ?, pillar_2_icon = ?,
        pillar_3_name = ?, pillar_3_icon = ?, pillar_4_name = ?, pillar_4_icon = ?,
        intro_title = ?, intro_desc = ?, intro_choice_a = ?, intro_choice_b = ?, intro_image_url = ?,
        bg_image_url = ?, crisis_color = ?, resolution_color = ?, 
        pillar_1_color = ?, pillar_2_color = ?, pillar_3_color = ?, pillar_4_color = ?
      WHERE id = ?
    `, [
      end_leg_0, end_leg_100,
      end_exe_0, end_exe_100,
      end_jud_0, end_jud_100,
      end_mil_0, end_mil_100,
      end_victory, credits || '', is_published ? 1 : 0, game_title || '',
      pillar_1_name, pillar_1_icon, pillar_2_name, pillar_2_icon,
      pillar_3_name, pillar_3_icon, pillar_4_name, pillar_4_icon,
      intro_title, intro_desc, intro_choice_a, intro_choice_b, intro_image_url,
      bg_image_url || '', crisis_color || '#ef4444', resolution_color || '#eab308',
      pillar_1_color || '#60a5fa', pillar_2_color || '#a78bfa', pillar_3_color || '#fbbf24', pillar_4_color || '#34d399',
      id
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const published = searchParams.get('published');
  const all = searchParams.get('all');
  
  try {
    if (all === 'true') {
      const groups = await db.all('SELECT id, name, game_title, is_published, credits FROM groups ORDER BY created_at DESC');
      return NextResponse.json(groups);
    }
    
    if (published === 'true') {
      const groups = await db.all('SELECT id, name, game_title, credits FROM groups WHERE is_published = 1 ORDER BY created_at DESC');
      return NextResponse.json(groups);
    }
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const group = await db.get('SELECT * FROM groups WHERE name = ?', [name]);
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
