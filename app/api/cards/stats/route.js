import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET /api/cards/stats?group_id=xxx — returns per-card stats for a group
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const group_id = searchParams.get('group_id');
    if (!group_id) return NextResponse.json({ error: 'Missing group_id' }, { status: 400 });

    const [cards, group] = await Promise.all([
      db.all(
        'SELECT id, title, card_type, stats_a, stats_b FROM cards WHERE group_id = ? ORDER BY created_at ASC',
        [group_id]
      ),
      db.get('SELECT play_count FROM groups WHERE id = ?', [group_id])
    ]);

    return NextResponse.json({ cards, play_count: group?.play_count || 0 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cards/stats — increment card choice stats OR group play count
export async function POST(request) {
  try {
    const { card_id, choice, group_id, game_start } = await request.json();

    // Increment play count when a new game session starts
    if (game_start && group_id) {
      await db.run('UPDATE groups SET play_count = play_count + 1 WHERE id = ?', [group_id]);
      return NextResponse.json({ success: true });
    }

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
