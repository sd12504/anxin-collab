import pkg from 'pg';
const { Pool } = pkg;

const HAS_DB = !!process.env.DATABASE_URL;
const pool = HAS_DB ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
const memStore = new Map();

export async function initDB() {
  if (!pool) {
    console.log('No DATABASE_URL set, using in-memory store.');
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('PostgreSQL connected, cases table ready.');
}

export async function getAllCases() {
  if (!pool) return Array.from(memStore.values());
  const { rows } = await pool.query('SELECT data FROM cases ORDER BY updated_at DESC');
  return rows.map(r => r.data);
}

export async function getCaseById(id) {
  if (!pool) return memStore.get(id) || null;
  const { rows } = await pool.query('SELECT data FROM cases WHERE id = $1', [id]);
  return rows[0]?.data || null;
}

export async function upsertCase(id, data) {
  if (!pool) { memStore.set(id, data); return; }
  await pool.query(
    'INSERT INTO cases (id, data, updated_at) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = NOW()',
    [id, JSON.stringify(data)]
  );
}

export async function deleteCaseById(id) {
  if (!pool) { memStore.delete(id); return; }
  await pool.query('DELETE FROM cases WHERE id = $1', [id]);
}
