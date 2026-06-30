import pkg from 'pg';
const { Pool } = pkg;

const HAS_DB = !!process.env.DATABASE_URL;
function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) return '';
  const url = new URL(process.env.DATABASE_URL);
  url.searchParams.delete('sslmode');
  return url.toString();
}

const pool = HAS_DB ? new Pool({
  connectionString: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
}) : null;
const memStore = new Map();
const userStore = new Map();

// ===== Init =====
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '攝影',
      display_name TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('PostgreSQL connected, tables ready.');
}

// ===== Cases =====
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

// ===== Users =====
export async function getUserByUsername(username) {
  if (!pool) return userStore.get(username.toLowerCase()) || null;
  const { rows } = await pool.query(
    'SELECT id, username, password_hash, role, display_name FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  return rows[0] || null;
}

export async function getAllUsers() {
  if (!pool) return Array.from(userStore.values()).map(u => ({ ...u, password_hash: undefined }));
  const { rows } = await pool.query(
    'SELECT id, username, role, display_name, created_at, updated_at FROM users ORDER BY created_at ASC'
  );
  return rows;
}

export async function createUser({ id, username, passwordHash, role, displayName }) {
  const user = { id, username: username.toLowerCase(), password_hash: passwordHash, role, display_name: displayName };
  if (!pool) {
    if (userStore.has(user.username)) throw new Error('帳號已存在');
    userStore.set(user.username, user);
    return user;
  }
  await pool.query(
    'INSERT INTO users (id, username, password_hash, role, display_name) VALUES ($1, $2, $3, $4, $5)',
    [id, user.username, user.password_hash, user.role, user.display_name]
  );
  return user;
}

export async function updateUser(id, { username, passwordHash, role, displayName }) {
  if (!pool) {
    let found = null;
    for (const [key, u] of userStore) {
      if (u.id === id) { found = u; break; }
    }
    if (!found) throw new Error('使用者不存在');
    if (username !== undefined) found.username = username.toLowerCase();
    if (passwordHash !== undefined) found.password_hash = passwordHash;
    if (role !== undefined) found.role = role;
    if (displayName !== undefined) found.display_name = displayName;
    return;
  }
  const sets = [];
  const vals = [];
  let idx = 1;
  if (username !== undefined) { sets.push(`username = $${idx++}`); vals.push(username.toLowerCase()); }
  if (passwordHash !== undefined) { sets.push(`password_hash = $${idx++}`); vals.push(passwordHash); }
  if (role !== undefined) { sets.push(`role = $${idx++}`); vals.push(role); }
  if (displayName !== undefined) { sets.push(`display_name = $${idx++}`); vals.push(displayName); }
  if (sets.length === 0) return;
  sets.push(`updated_at = NOW()`);
  vals.push(id);
  await pool.query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
}

export async function deleteUser(id) {
  if (!pool) {
    for (const [key, u] of userStore) {
      if (u.id === id) { userStore.delete(key); return; }
    }
    return;
  }
  await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

// ===== Assets =====
const assetStore = new Map();

export async function getAllAssets() {
  if (!pool) return Array.from(assetStore.values());
  const { rows } = await pool.query('SELECT data FROM assets ORDER BY updated_at DESC');
  return rows.map(r => r.data);
}

export async function getAssetsByCaseId(caseId) {
  if (!pool) return Array.from(assetStore.values()).filter(a => a.caseId === caseId);
  const { rows } = await pool.query('SELECT data FROM assets WHERE case_id = $1 ORDER BY updated_at DESC', [caseId]);
  return rows.map(r => r.data);
}

export async function upsertAsset(id, caseId, data) {
  if (!pool) { assetStore.set(id, data); return; }
  await pool.query(
    'INSERT INTO assets (id, case_id, data, updated_at) VALUES ($1, $2, $3, NOW()) ON CONFLICT (id) DO UPDATE SET case_id = $2, data = $3, updated_at = NOW()',
    [id, caseId, JSON.stringify(data)]
  );
}

export async function deleteAssetById(id) {
  if (!pool) { assetStore.delete(id); return; }
  await pool.query('DELETE FROM assets WHERE id = $1', [id]);
}

export async function seedDefaultAdmin() {
  const existing = await getUserByUsername('admin');
  if (existing) return;
  const bcrypt = (await import('bcryptjs')).default;
  const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'anxin2024', 10);
  try {
    await createUser({
      id: 'user-admin',
      username: process.env.ADMIN_USERNAME || 'admin',
      passwordHash: hash,
      role: '管理員',
      displayName: '管理員',
    });
    console.log('Default admin user created.');
  } catch (e) {
    console.log('Default admin user already exists or failed:', e.message);
  }
}
