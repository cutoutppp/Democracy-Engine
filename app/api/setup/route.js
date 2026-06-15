import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        password TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        game_title TEXT,
        is_published INTEGER DEFAULT 0,
        end_leg_0 TEXT, end_leg_100 TEXT,
        end_exe_0 TEXT, end_exe_100 TEXT,
        end_jud_0 TEXT, end_jud_100 TEXT,
        end_mil_0 TEXT, end_mil_100 TEXT,
        end_victory TEXT,
        pillar_1_name TEXT, pillar_1_icon TEXT,
        pillar_2_name TEXT, pillar_2_icon TEXT,
        pillar_3_name TEXT, pillar_3_icon TEXT,
        pillar_4_name TEXT, pillar_4_icon TEXT,
        intro_title TEXT, intro_desc TEXT,
        intro_image_url TEXT, intro_choice_a TEXT, intro_choice_b TEXT,
        credits TEXT,
        bg_image_url TEXT,
        crisis_color TEXT,
        resolution_color TEXT,
        pillar_1_color TEXT,
        pillar_2_color TEXT,
        pillar_3_color TEXT,
        pillar_4_color TEXT,
        max_crisis_val INTEGER DEFAULT 20,
        max_resolution_val INTEGER DEFAULT 30
      );
    `);

    // Auto-migration for existing databases
    try { await db.exec(`ALTER TABLE groups ADD COLUMN max_crisis_val INTEGER DEFAULT 20;`); } catch (e) {}
    try { await db.exec(`ALTER TABLE groups ADD COLUMN max_resolution_val INTEGER DEFAULT 30;`); } catch (e) {}

    await db.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY,
        group_id TEXT,
        card_type TEXT,
        title TEXT,
        description TEXT,
        image_url TEXT,
        choice_a_text TEXT,
        choice_a_legislative INTEGER,
        choice_a_executive INTEGER,
        choice_a_judiciary INTEGER,
        choice_a_military INTEGER,
        choice_b_text TEXT,
        choice_b_legislative INTEGER,
        choice_b_executive INTEGER,
        choice_b_judiciary INTEGER,
        choice_b_military INTEGER,
        stats_a INTEGER DEFAULT 0,
        stats_b INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
      );
    `);

    return NextResponse.json({ success: true, message: 'Database initialized successfully!' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
