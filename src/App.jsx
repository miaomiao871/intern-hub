import { useState, useCallback, useEffect } from 'react';
import StudentView from './components/StudentView';
import AdminDashboard from './components/AdminDashboard';
import initialData from './data/initialData';

// Cute icons
const IconSettings = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2.2"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconArrowLeft = (props) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const STORAGE_KEY = 'internhub_data';
const API_URL = '/api/data';

// 将旧版数据（{settings,tabs}）迁移到新版 cities 结构
function migrateData(raw) {
  if (!raw) return initialData;

  // 已经是新版 cities 结构
  if (raw.cities && raw.activeCity) {
    return raw;
  }

  // 兼容旧版：有 settings 和 tabs 的旧结构
  const oldData = raw.tabs ? raw : (() => {
    // 更旧的结构（todos/members/guides/handovers）
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
    return { settings: raw.settings || initialData.cities.wuhan.settings, tabs };
  })();

  return {
    activeCity: 'wuhan',
    cities: {
      wuhan: {
        settings: oldData.settings || initialData.cities.wuhan.settings,
        tabs: oldData.tabs || initialData.cities.wuhan.tabs,
      },
      changsha: {
        settings: { ...initialData.cities.changsha.settings },
        tabs: [],
      },
    },
  };
}

function loadLocal() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrateData(JSON.parse(saved));
  } catch {}
  return null;
}

const CITY_NAMES = {
  wuhan: '武汉',
  changsha: '长沙',
};

export default function App() {
  const [data, setData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [backupType, setBackupType] = useState('local');

  // 启动时加载数据
  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          const d = migrateData(res.data);
          setData(d);
          setBackupType(res.backup || 'local');
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

  // 持久化完整数据结构
  const persist = useCallback((fn) => {
    setData((prev) => {
      const next = fn(prev);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: next }),
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.backup === 'github') setBackupType('github');
        })
        .catch(() => {});
      return next;
    });
  }, []);

  // 切换城市
  const switchCity = useCallback((city) => {
    persist((prev) => ({
      ...prev,
      activeCity: city,
    }));
  }, [persist]);

  // 获取当前城市数据
  const currentCity = data?.activeCity || 'wuhan';
  const isChangsha = currentCity === 'changsha';
  const currentCityData = data?.cities?.[currentCity];

  // AdminDashboard 的 setter：只更新当前城市的数据
  const setCurrentCityData = useCallback((updater) => {
    persist((prev) => ({
      ...prev,
      cities: {
        ...prev.cities,
        [prev.activeCity]: updater(prev.cities[prev.activeCity]),
      },
    }));
  }, [persist]);

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
    <div className="min-h-screen font-cute" style={{ background: isChangsha ? '#F9F8FC' : '#FFFFFF' }}>
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-brand-100">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-2">
          {/* 左侧：Logo + 城市切换 */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-slate-700">InternHub</span>
            {/* 城市切换按钮 */}
            <div className="flex bg-slate-100 rounded-3xl p-0.5">
              {Object.entries(CITY_NAMES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => switchCity(key)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                    currentCity === key
                      ? `${isChangsha ? 'bg-sky-500' : 'bg-brand-500'} text-white shadow-sm scale-105`
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">v3.0</span>
          </div>
          {/* 右侧：备份状态 + Admin */}
          <div className="flex items-center gap-2">
            {backupType === 'github' ? (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full" title="数据自动备份到 GitHub">☁️ 已备份</span>
            ) : (
              <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">云同步</span>
            )}
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-3xl transition-colors"
            >
              {isAdmin ? (<><IconArrowLeft /> 返回前台</>) : (<><IconSettings /> 设置</>)}
            </button>
          </div>
        </div>
      </header>
      <main>
        {isAdmin ? (
          <AdminDashboard data={currentCityData} setData={setCurrentCityData} onBack={() => setIsAdmin(false)} activeCity={currentCity} />
        ) : (
          <StudentView data={currentCityData} activeCity={currentCity} />
        )}
      </main>
    </div>
  );
}
