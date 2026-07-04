import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request) {
  try {
    const { card_id, choice } = await request.json();
    if (!card_id || !choice) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    if (choice === 'A') {
      await db.run('UPDATE cards SET stats_a = stats_a + 1 WHERE id = ?', [card_id]);
    } else if (choice === 'B') {
      await db.run('UPDATE cards SET stats_b = stats_b + 1 WHERE id = ?', [card_id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
