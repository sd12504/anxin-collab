import { useState } from 'react';
import { useStore } from '../hooks/useStore';

export default function SystemSettings() {
  const { cases, assets } = useStore();
  const [cleared, setCleared] = useState(false);

  const handleClearData = () => {
    if (!confirm('確定要清除所有資料嗎？此操作無法復原。')) return;
    localStorage.removeItem('anxin_collab_v2');
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
          <div className="flex gap-4"><span className="text-gray-400 w-24">資料儲存</span><span>瀏覽器 localStorage</span></div>
          <div className="flex gap-4"><span className="text-gray-400 w-24">技術棧</span><span>React + TypeScript + Tailwind CSS</span></div>
        </div>
      </div>

      {/* Roles */}
      <div className="card p-5 lg:p-6 mb-5">
        <h3 className="font-serif font-semibold mb-4">角色規劃</h3>
        <p className="text-sm text-gray-500 mb-3">未來版本將支援多角色登入。目前以單一使用者模式運作。</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-sm">
          {['管理員', '設計師', '攝影', '剪輯', '外部協作者'].map(role => (
            <div key={role} className="border border-warm-200 rounded p-3 text-center">
              <div className="text-lg mb-1">{role === '管理員' ? '👤' : role === '設計師' ? '✏️' : role === '攝影' ? '📷' : role === '剪輯' ? '✂️' : '🔗'}</div>
              <div className="font-medium text-xs">{role}</div>
            </div>
          ))}
        </div>
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
        <p className="text-sm text-gray-500 mb-4">所有資料儲存在瀏覽器 localStorage。清除後無法復原。</p>
        <button className="btn btn-danger" onClick={handleClearData}>
          {cleared ? '已清除，重整中...' : '清除所有資料'}
        </button>
      </div>
    </div>
  );
}
