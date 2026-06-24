import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('請輸入帳號與密碼');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate('/collab', { replace: true });
    } catch (err) {
      setError((err as Error).message || '登入失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f4] px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <span className="inline-flex w-14 h-14 rounded-2xl bg-[#151922] items-center justify-center text-xl font-bold text-olive-400 mb-4">
            安
          </span>
          <h1 className="font-serif text-2xl font-semibold text-gray-900">安心整合</h1>
          <p className="text-sm text-gray-400 mt-1.5">設計協作板 · 登入</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-xs text-gray-500 mb-1.5 block">帳號</span>
            <input
              className="input w-full"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="請輸入帳號"
              autoComplete="username"
              autoFocus
            />
          </label>

          <label className="block">
            <span className="text-xs text-gray-500 mb-1.5 block">密碼</span>
            <div className="relative">
              <input
                className="input w-full pr-10"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPw(v => !v)}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="btn btn-primary w-full flex items-center justify-center gap-2"
            disabled={submitting}
          >
            <LogIn size={16} />
            {submitting ? '登入中...' : '登入'}
          </button>
        </form>
      </div>
    </div>
  );
}
