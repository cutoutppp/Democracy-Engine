import { neon } from '@neondatabase/serverless';
import Database from 'better-sqlite3';
import path from 'path';

const isPostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

let sqliteDb;
let sql;

if (isPostgres) {
  sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL);
} else {
  const dbPath = path.resolve(process.cwd(), 'democracy_engine.db');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  
  // Ensure tables exist for local SQLite
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE,
      password TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
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
      pillar_4_color TEXT
    );

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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
    );
  `);
}

const toPgQuery = (query) => {
  let i = 1;
  return query.replace(/\?/g, () => `$${i++}`);
};

const db = {
  get: async (query, params = []) => {
    if (isPostgres) {
      const res = await sql(toPgQuery(query), params);
      return res.length > 0 ? res[0] : undefined;
    } else {
      return sqliteDb.prepare(query).get(...params);
    }
  },
  all: async (query, params = []) => {
    if (isPostgres) {
      return await sql(toPgQuery(query), params);
    } else {
      return sqliteDb.prepare(query).all(...params);
    }
  },
  run: async (query, params = []) => {
    if (isPostgres) {
      await sql(toPgQuery(query), params);
      return { success: true };
    } else {
      return sqliteDb.prepare(query).run(...params);
    }
  },
  exec: async (query) => {
    if (isPostgres) {
      await sql(query);
    } else {
      sqliteDb.exec(query);
    }
  }
};

export default db;
