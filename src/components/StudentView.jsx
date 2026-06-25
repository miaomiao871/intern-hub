import { useState, useMemo } from 'react';
import { Search, ExternalLink, ChevronDown, ChevronUp, Hash } from 'lucide-react';

function fuzzyMatch(text, keyword) {
  if (!keyword) return true;
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase();
  let ki = 0;
  for (let i = 0; i < lower.length && ki < kw.length; i++) {
    if (lower[i] === kw[ki]) ki++;
  }
  return ki === kw.length;
}

const CUTE_TAG_COLORS = [
  'bg-brand-50 text-brand-700 border-brand-200',
  'bg-sky-50 text-sky-600 border-sky-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-pink-50 text-pink-600 border-pink-200',
  'bg-indigo-50 text-indigo-600 border-indigo-200',
];

export default function StudentView({ data, activeCity }) {
  const tabs = data.tabs || [];
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : null);
  const [search, setSearch] = useState('');
  const [doneSet, setDoneSet] = useState(new Set());
  const [expandedItem, setExpandedItem] = useState(null);

  const isChangsha = activeCity === 'changsha';
  const accentLight = isChangsha ? 'border-sky-300' : 'border-brand-300';
  const accentBg = isChangsha ? 'bg-sky-500' : 'bg-brand-500';
  const accentText = isChangsha ? 'text-sky-600' : 'text-brand-600';

  const itemKey = (tabId, itemId) => `${tabId}-${itemId}`;

  const settings = data.settings || {};
  const quickTags = settings.quickTags || [];

  const searchResults = useMemo(() => {
    if (!search) return [];
    const results = [];
    tabs.forEach((tab) => {
      tab.items.forEach((item) => {
        const text = (item.title || '') + (item.content || '') + (item.links || []).map((l) => l.text).join('');
        if (fuzzyMatch(text, search)) {
          results.push({ tabId: tab.id, tabLabel: tab.label, item });
        }
      });
    });
    return results;
  }, [search, tabs]);

  const hasSearch = search.trim().length > 0;
  const currentTab = tabs.find((t) => t.id === activeTab);
  const currentItems = currentTab ? currentTab.items : [];

  const toggleDone = (tabId, itemId) => {
    const key = itemKey(tabId, itemId);
    setDoneSet((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  function isFoldableTab(tabId) {
    const itemTab = tabs.find((t) => String(t.id) === String(tabId));
    return itemTab && (itemTab.label.includes('怎么办') || itemTab.label.includes('📖'));
  }

  return (
    <div className="min-h-screen bg-fresh">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{isChangsha ? '🌿' : '🍃'}</span>
            <h1 className="text-xl md:text-2xl font-extrabold text-brand-800 tracking-tight">
              {settings.siteTitle || '🚀 平台导航'}
            </h1>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              isChangsha ? 'bg-sky-100 text-sky-700' : 'bg-brand-100 text-brand-700'
            }`}>
              {isChangsha ? '长沙' : '武汉'}
            </span>
          </div>
          <p className="text-sm text-slate-500 ml-2">{settings.siteSubtitle}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜一下——找人、问流程、查事项..."
            className="w-full pl-11 pr-4 py-3 glass-input border border-brand-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-300/30 focus:border-brand-300 shadow-sm transition-all"
          />
        </div>

        {/* Quick tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quickTags.map((tag, idx) => {
            const color = CUTE_TAG_COLORS[idx % CUTE_TAG_COLORS.length];
            const isActive = search === tag;
            return (
              <button
                key={tag}
                onClick={() => setSearch(isActive ? '' : tag)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  isActive ? 'bg-brand-500 text-white border-brand-500 scale-105' : color + ' hover:scale-105'
                }`}
              >
                <Hash size={11} className="inline mr-0.5" />
                {tag}
              </button>
            );
          })}
          {search && (
            <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              返回首页
            </button>
          )}
        </div>

        {/* Dynamic Tabs — underline style */}
        {!hasSearch && tabs.length > 0 && (
          <div className="flex gap-0 mb-5 border-b border-slate-200 overflow-x-auto">
            {tabs.map((t) => {
              const doneCount = t.items.filter(item => doneSet.has(itemKey(t.id, item.id))).length;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === t.id
                      ? `${isChangsha ? 'border-sky-500 text-sky-600' : 'border-brand-500 text-brand-600'}`
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {t.label}
                  <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                    activeTab === t.id
                      ? (isChangsha ? 'bg-sky-100' : 'bg-brand-100')
                      : 'bg-slate-100'
                  }`}>
                    {doneCount > 0 ? `${doneCount}/${t.items.length}` : t.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search results info */}
        {hasSearch && (
          <div className="mb-4 text-sm text-slate-500">
            找到 <span className="font-semibold text-brand-600">{searchResults.length}</span> 个结果
          </div>
        )}

        {/* Search results */}
        {hasSearch && searchResults.length > 0 && (
          <div className="space-y-4">
            {(() => {
              const groups = {};
              searchResults.forEach((r) => {
                if (!groups[r.tabId]) groups[r.tabId] = { label: r.tabLabel, items: [] };
                groups[r.tabId].items.push(r.item);
              });
              return Object.entries(groups).map(([tabId, group]) => (
                <div key={tabId}>
                  <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {group.label}
                  </div>
                  <div className="space-y-3">
                    {group.items.map((item) => renderItem(item, true, tabId))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Tab content */}
        {!hasSearch && currentTab && (
          <div>
            {currentItems.filter((item) => item.role).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                {currentItems.filter((item) => item.role).map((item) => renderItem(item, false, currentTab.id))}
              </div>
            )}
            {currentItems.filter((item) => !item.role).length > 0 && (
              <div className="space-y-3">
                {currentItems.filter((item) => !item.role).map((item) => renderItem(item, false, currentTab.id))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasSearch && currentTab && currentItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-slate-400 text-sm">这个板块还没有内容</p>
            <p className="text-slate-300 text-xs mt-1">点击右上角「设置」来添加 ~</p>
          </div>
        )}

        {hasSearch && searchResults.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-slate-500 text-sm">没找到相关的内容，试试其他关键词？</p>
            <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }}
              className="mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700">
              返回首页
            </button>
          </div>
        )}
      </div>
    </div>
  );

  function renderItem(item, isSearchResult, tabId) {
    const key = itemKey(tabId, item.id);
    const done = doneSet.has(key);
    const foldable = isFoldableTab(tabId);
    const hasSteps = item.steps && item.steps.length > 0;
    const isExpanded = expandedItem === key;

    // Person card (has role)
    if (item.role && !isSearchResult) {
      return (
        <div key={item.id}
          className="bg-white rounded-2xl border-l-4 border-sky-300 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          style={{ borderTop: '0.5px solid #e5e7eb', borderRight: '0.5px solid #e5e7eb', borderBottom: '0.5px solid #e5e7eb' }}>
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-sm font-bold mb-3">
            {item.title ? item.title[0] : '?'}
          </div>
          <h3 className="text-sm font-bold text-slate-800">{item.title}</h3>
          <p className="text-[11px] font-semibold text-sky-500 mt-0.5">{item.role}</p>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
          {item.links && item.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.links.map((link, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{link.text}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Foldable card (怎么办板块)
    if (foldable) {
      return (
        <div key={item.id}
          className="bg-white rounded-2xl border-l-4 border-amber-300 overflow-hidden hover:shadow-md transition-all duration-200"
          style={{ borderTop: '0.5px solid #e5e7eb', borderRight: '0.5px solid #e5e7eb', borderBottom: '0.5px solid #e5e7eb' }}>
          <button onClick={() => setExpandedItem(isExpanded ? null : key)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left">
            <span className="text-sm font-bold text-slate-800">{item.title}</span>
            {isExpanded ? <ChevronUp size={18} className="text-amber-400 shrink-0" /> : <ChevronDown size={18} className="text-amber-400 shrink-0" />}
          </button>
          <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
              {hasSteps && (
                <ol className="space-y-2">
                  {(item.steps || []).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <span className="w-5 h-5 rounded-lg bg-amber-100 text-amber-700 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {item.links && item.links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.links.map((link, idx) => link.url ? (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700">{link.text}<ExternalLink size={11} /></a>
                  ) : null)}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default checklist card
    return (
      <div key={item.id}
        onClick={() => !isSearchResult && toggleDone(tabId, item.id)}
        className={`bg-white rounded-2xl border-l-4 p-4 transition-all duration-200 ${
          done
            ? 'border-l-green-300 bg-green-50/30'
            : 'border-l-brand-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
        }`}
        style={{
          borderTop: '0.5px solid #e5e7eb',
          borderRight: '0.5px solid #e5e7eb',
          borderBottom: '0.5px solid #e5e7eb',
        }}
      >
        <div className="flex items-start gap-3">
          {!isSearchResult && (
            done
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 animate-pop"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/></svg>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</h3>
            <p className={`text-xs mt-1 leading-relaxed ${done ? 'text-slate-400' : 'text-slate-500'}`} style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
            {hasSteps && (
              <ol className="space-y-1.5 mt-2">
                {(item.steps || []).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-500">
                    <span className="w-4 h-4 rounded-lg bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {item.links && item.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.links.map((link, idx) => link.url ? (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors"
                    onClick={(e) => e.stopPropagation()}>
                    {link.text}<ExternalLink size={11} />
                  </a>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{link.text}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
