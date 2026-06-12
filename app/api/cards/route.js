import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const data = await request.json();
    const id = uuidv4();
    
    await db.run(`
      INSERT INTO cards (
        id, group_id, title, description, image_url, card_type,
        choice_a_text, choice_a_legislative, choice_a_executive, choice_a_judiciary, choice_a_military,
        choice_b_text, choice_b_legislative, choice_b_executive, choice_b_judiciary, choice_b_military
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `, [
      id, data.group_id, data.title, data.description || null, data.image_url || null, data.card_type,
      data.choice_a_text, data.choice_a_legislative, data.choice_a_executive, data.choice_a_judiciary, data.choice_a_military,
      data.choice_b_text, data.choice_b_legislative, data.choice_b_executive, data.choice_b_judiciary, data.choice_b_military
    ]);
    
    return NextResponse.json({ id, ...data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get('group_id');
  
  try {
    let cards = [];
    if (groupId) {
      cards = await db.all('SELECT * FROM cards WHERE group_id = ? ORDER BY created_at DESC', [groupId]);
    } else {
      cards = await db.all('SELECT * FROM cards ORDER BY created_at DESC');
    }

    return NextResponse.json({ cards });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id } = data;
    if (!id) return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });

    await db.run(`
      UPDATE cards SET
        title = ?, description = ?, image_url = ?, card_type = ?,
        choice_a_text = ?, choice_a_legislative = ?, choice_a_executive = ?, choice_a_judiciary = ?, choice_a_military = ?,
        choice_b_text = ?, choice_b_legislative = ?, choice_b_executive = ?, choice_b_judiciary = ?, choice_b_military = ?
      WHERE id = ?
    `, [
      data.title, data.description || null, data.image_url || null, data.card_type,
      data.choice_a_text, data.choice_a_legislative, data.choice_a_executive, data.choice_a_judiciary, data.choice_a_military,
      data.choice_b_text, data.choice_b_legislative, data.choice_b_executive, data.choice_b_judiciary, data.choice_b_military,
      id
    ]);
    
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
