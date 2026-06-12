import { NextResponse } from 'next/server';
import db from '@/lib/db';

const MASTER_PASSWORD = 'cutout067'; // Set by the user

export async function POST(request) {
  try {
    const { action, password, target_id, target_password } = await request.json();

    if (password !== MASTER_PASSWORD) {
      return NextResponse.json({ error: 'รหัสผ่าน Admin ไม่ถูกต้อง' }, { status: 401 });
    }

    if (action === 'get_all') {
      const groups = await db.all('SELECT * FROM groups ORDER BY created_at DESC');
      
      const enhancedGroups = await Promise.all(groups.map(async g => {
        const row = await db.get('SELECT COUNT(*) as count FROM cards WHERE group_id = ?', [g.id]);
        return { ...g, card_count: row ? row.count : 0 };
      }));

      return NextResponse.json({ groups: enhancedGroups });
    }

    if (action === 'delete') {
      if (!target_id) return NextResponse.json({ error: 'Missing target_id' }, { status: 400 });
      await db.run('DELETE FROM cards WHERE group_id = ?', [target_id]);
      await db.run('DELETE FROM groups WHERE id = ?', [target_id]);
      return NextResponse.json({ success: true });
    }

    if (action === 'reset_password') {
      if (!target_password || !target_id) return NextResponse.json({ error: 'Missing target_password or target_id' }, { status: 400 });
      await db.run('UPDATE groups SET password = ? WHERE id = ?', [target_password, target_id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
