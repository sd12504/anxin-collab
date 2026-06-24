import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, X, Plus, ShieldCheck } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useAuth, getAuthToken } from '../hooks/useAuth';

interface UserRecord {
  id: string;
  username: string;
  role: string;
  display_name: string;
  created_at: string;
}

const ROLES = ['管理員', '設計師', '攝影', '剪輯', '外部協作者'];

function getProxyUrl() {
  return (import.meta.env.VITE_AI_PROXY_URL || '').replace(/\/$/, '');
}

async function fetchUsers(): Promise<UserRecord[]> {
  const url = getProxyUrl();
  if (!url) return [];
  const token = getAuthToken();
  const res = await fetch(`${url}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('讀取使用者失敗');
  return res.json();
}

async function createUserApi(data: { username: string; password: string; role: string; displayName: string }) {
  const url = getProxyUrl();
  const token = getAuthToken();
  const res = await fetch(`${url}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: '建立失敗' }));
    throw new Error(err.error || '建立失敗');
  }
}

async function updateUserApi(id: string, data: { role?: string; displayName?: string; password?: string }) {
  const url = getProxyUrl();
  const token = getAuthToken();
  const res = await fetch(`${url}/api/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('更新失敗');
}

async function deleteUserApi(id: string) {
  const url = getProxyUrl();
  const token = getAuthToken();
  const res = await fetch(`${url}/api/users/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('刪除失敗');
}

export default function SystemSettings() {
  const { cases, assets } = useStore();
  const { user } = useAuth();
  const [cleared, setCleared] = useState(false);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const isAdmin = user?.role === '管理員';

  const loadUsers = useCallback(async () => {
    if (!isAdmin) { setUsersLoading(false); return; }
    try {
      setUsers(await fetchUsers());
      setUsersError('');
    } catch (err) {
      setUsersError((err as Error).message);
    } finally {
      setUsersLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleClearData = () => {
    if (!confirm('確定要清除所有資料嗎？此操作無法復原。')) return;
    localStorage.removeItem('anxin_collab_v2');
    localStorage.removeItem('anxin_collab_v3');
    localStorage.removeItem('anxin_collab_v4');
    localStorage.removeItem('anxin_hidden_demo_assets_v1');
    localStorage.removeItem('anxin_ai_config');
    setCleared(true);
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="max-w-screen-lg mx-auto px-4 lg:px-8 py-5 lg:py-7">
      <h2 className="font-serif text-xl mb-5">系統設定</h2>

      {/* System info */}
      <div className="card p-5 lg:p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">系統資訊</h3>
        <div className="text-sm space-y-2">
          <div className="flex gap-4"><span className="text-gray-400 w-24">案件總數</span><span>{cases.length}</span></div>
          <div className="flex gap-4"><span className="text-gray-400 w-24">素材總數</span><span>{assets.length}</span></div>
          <div className="flex gap-4"><span className="text-gray-400 w-24">版本</span><span>1.0.0 MVP</span></div>
          <div className="flex gap-4"><span className="text-gray-400 w-24">資料儲存</span><span>Postgres 同步 + localStorage 快取</span></div>
          <div className="flex gap-4"><span className="text-gray-400 w-24">技術棧</span><span>React + TypeScript + Tailwind CSS</span></div>
        </div>
      </div>

      {/* User Management */}
      <div className="card p-5 lg:p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-semibold">使用者管理</h3>
          {isAdmin && (
            <button className="btn btn-primary btn-sm flex items-center gap-1" onClick={() => setNewUserOpen(true)}>
              <Plus size={14} /> 新增使用者
            </button>
          )}
        </div>

        {!isAdmin ? (
          <p className="text-sm text-gray-400">僅管理員可管理使用者。</p>
        ) : usersLoading ? (
          <p className="text-sm text-gray-400">載入中...</p>
        ) : usersError ? (
          <p className="text-sm text-red-500">{usersError}</p>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">顯示名稱</th>
                  <th className="pb-2 font-medium">帳號</th>
                  <th className="pb-2 font-medium">角色</th>
                  <th className="pb-2 font-medium w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id}>
                    <td className="py-2.5 font-medium">{u.display_name}</td>
                    <td className="py-2.5 text-gray-500">{u.username}</td>
                    <td className="py-2.5"><span className="badge bg-olive-50 text-olive-700">{u.role}</span></td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <button
                          className="w-7 h-7 rounded text-gray-400 hover:text-olive-600 hover:bg-olive-50 inline-flex items-center justify-center"
                          onClick={() => setEditUser(u)}
                          title="編輯"
                        >
                          <Pencil size={13} />
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            className="w-7 h-7 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 inline-flex items-center justify-center"
                            onClick={async () => {
                              if (!confirm(`確定刪除使用者「${u.display_name}」嗎？`)) return;
                              try { await deleteUserApi(u.id); await loadUsers(); } catch { alert('刪除失敗'); }
                            }}
                            title="刪除"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-gray-400">尚無使用者</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data structure */}
      <div className="card p-5 lg:p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">資料架構</h3>
        <div className="text-sm text-gray-500 space-y-1">
          <p>• 案件資料：完整案場資訊、企劃欄位、拍攝限制、團隊成員</p>
          <p>• 素材庫：依類型分類（Before、施工中、完工、設計圖、參考圖、訪談素材、Shorts片段）</p>
          <p>• AI Service 架構：generatePlanningDraft / generateProductionContent / generateSocialCopy / generateEditingBrief</p>
          <p>• 匯出格式：Markdown（未來擴充 PDF）</p>
        </div>
      </div>

      {/* Data management */}
      <div className="card p-5 lg:p-6">
        <h3 className="font-serif font-semibold mb-4 text-red-600">資料管理</h3>
        <p className="text-sm text-gray-500 mb-4">此操作會清除本機快取與設定；Postgres 雲端案件不會被刪除。</p>
        <button className="btn btn-danger" onClick={handleClearData}>
          {cleared ? '已清除，重整中...' : '清除所有資料'}
        </button>
      </div>

      {/* Edit User Modal */}
      {editUser && (
        <UserFormModal
          title="編輯使用者"
          initial={{ role: editUser.role, displayName: editUser.display_name }}
          onSave={async (data) => {
            await updateUserApi(editUser.id, data);
            setEditUser(null);
            await loadUsers();
          }}
          onClose={() => setEditUser(null)}
          showPassword={false}
        />
      )}

      {/* New User Modal */}
      {newUserOpen && (
        <UserFormModal
          title="新增使用者"
          onSave={async (data) => {
            await createUserApi(data as any);
            setNewUserOpen(false);
            await loadUsers();
          }}
          onClose={() => setNewUserOpen(false)}
          showPassword={true}
        />
      )}
    </div>
  );
}

function UserFormModal({
  title,
  initial,
  onSave,
  onClose,
  showPassword,
}: {
  title: string;
  initial?: { role?: string; displayName?: string };
  onSave: (data: { role: string; displayName: string; username?: string; password?: string }) => Promise<void>;
  onClose: () => void;
  showPassword: boolean;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initial?.role || '攝影');
  const [displayName, setDisplayName] = useState(initial?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (showPassword && (!username.trim() || !password.trim())) {
      setError('帳號與密碼為必填'); return;
    }
    if (!displayName.trim()) { setError('顯示名稱為必填'); return; }
    setSaving(true);
    try {
      await onSave({ username: username.trim() || undefined, password: password || undefined, role, displayName: displayName.trim() });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/35 px-4 py-6 flex items-center justify-center" onClick={onClose}>
      <div className="card w-full max-w-sm p-5 shadow-2xl" onClick={e => e.stopPropagation()} role="dialog">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-semibold">{title}</h3>
          <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 inline-flex items-center justify-center" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}

          {showPassword && (
            <>
              <label className="block">
                <span className="text-xs text-gray-500 mb-1 block">帳號</span>
                <input className="input w-full" value={username} onChange={e => setUsername(e.target.value)} placeholder="英文或數字" autoFocus />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 mb-1 block">密碼</span>
                <input className="input w-full" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少 6 碼" />
              </label>
            </>
          )}

          {!showPassword && (
            <label className="block">
              <span className="text-xs text-gray-500 mb-1 block">新密碼</span>
              <input className="input w-full" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="留空表示不更改" />
            </label>
          )}

          <label className="block">
            <span className="text-xs text-gray-500 mb-1 block">顯示名稱</span>
            <input className="input w-full" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="例如：陳攝影師" />
          </label>

          <label className="block">
            <span className="text-xs text-gray-500 mb-1 block">角色</span>
            <div className="flex gap-1 flex-wrap">
              {ROLES.map(r => (
                <button
                  key={r}
                  type="button"
                  className={`btn btn-sm ${role === r ? 'bg-olive-100 border-olive-400 text-olive-700' : ''}`}
                  onClick={() => setRole(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-sm" onClick={onClose}>取消</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? '儲存中...' : '儲存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
