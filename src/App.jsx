import { useState, useCallback, useEffect } from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import StudentView from './components/StudentView';
import AdminDashboard from './components/AdminDashboard';
import initialData from './data/initialData';

const STORAGE_KEY = 'internhub_data';
const API_URL = '/api/data';

// 将旧版数据迁移到新版 tabs 结构
function migrateData(raw) {
  if (raw.tabs) {
    if (!raw.settings) raw.settings = initialData.settings;
    return raw;
  }
  const tabs = [];
  let nextId = 1;
  if (raw.todos?.length) {
    tabs.push({ id: nextId++, label: '📋 第一天干什么', items: raw.todos.map((t) => ({ id: t.id, title: t.title, content: t.content, links: t.linkText && t.linkUrl ? [{ text: t.linkText, url: t.linkUrl }] : [] })) });
  }
  if (raw.members?.length) {
    tabs.push({ id: nextId++, label: '👥 找谁办', items: raw.members.map((m) => ({ id: m.id, title: m.name || m.title, role: m.role || '', content: m.description || '', links: m.contact ? [{ text: m.contact, url: '' }] : [] })) });
  }
  if (raw.guides?.length) {
    tabs.push({ id: nextId++, label: '📖 怎么办', items: raw.guides.map((g) => ({ id: g.id, title: g.title, content: g.content, steps: g.steps || [], links: g.linkText && g.linkUrl ? [{ text: g.linkText, url: g.linkUrl }] : [] })) });
  }
  if (raw.handovers?.length) {
    tabs.push({ id: nextId++, label: '🤝 交接工作', items: raw.handovers.map((h) => ({ id: h.id, title: h.title, content: h.content, links: h.links || [] })) });
  }
  return { settings: raw.settings || initialData.settings, tabs };
}

function loadLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrateData(JSON.parse(saved));
  } catch {}
  return null;
}

export default function App() {
  const [data, setData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // 启动时从 API 获取数据，失败则 fallback 到 localStorage 或初始数据
  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const d = migrateData(res.data);
          setData(d);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
        } else {
          const local = loadLocal();
          setData(local || initialData);
        }
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        const local = loadLocal();
        setData(local || initialData);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // 持久化：同时写 API 和 localStorage
  const persist = useCallback((fn) => {
    setData((prev) => {
      const next = fn(prev);
      // 写 localStorage（离线备用）
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      // 写 API（服务端同步）
      fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  const setDataAndPersist = useCallback((updater) => persist(updater), [persist]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-brand-700">InternHub</span>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">v3.0</span>
          </div>
          <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">云同步</span>
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isAdmin ? (<><ArrowLeft size={14} /> 返回前台</>) : (<><Settings size={14} /> Admin</>)}
          </button>
        </div>
      </header>
      <main>
        {isAdmin ? (
          <AdminDashboard data={data} setData={setDataAndPersist} onBack={() => setIsAdmin(false)} />
        ) : (
          <StudentView data={data} />
        )}
      </main>
    </div>
  );
}
