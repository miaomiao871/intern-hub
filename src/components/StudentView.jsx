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

export default function StudentView({ data }) {
  const tabs = data.tabs || [];
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : null);
  const [search, setSearch] = useState('');
  const [doneSet, setDoneSet] = useState(new Set());
  const [expandedItem, setExpandedItem] = useState(null);

  const itemKey = (tabId, itemId) => `${tabId}-${itemId}`;

  const settings = data.settings || {};
  const quickTags = settings.quickTags || [];

  // 搜索所有 tab 的内容
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
          {settings.siteTitle || '🚀 平台导航'}
          <span className="ml-2 text-sm font-normal text-slate-400">InternHub</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">{settings.siteSubtitle}</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜一下——找人、问流程、查事项..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 shadow-sm transition-shadow"
        />
      </div>

      {/* Quick tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {quickTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setSearch(tag)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              search === tag
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            <Hash size={12} className="inline mr-0.5" />
            {tag}
          </button>
        ))}
        {search && (
          <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }} className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
            返回首页
          </button>
        )}
      </div>

      {/* Dynamic Tabs (hidden when searching) */}
      {!hasSearch && tabs.length > 0 && (
        <div className="flex gap-1 mb-5 bg-white rounded-xl border border-slate-200 p-1 shadow-sm overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 min-w-0 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                activeTab === t.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === t.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {t.items.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search results info */}
      {hasSearch && (
        <div className="mb-4 text-sm text-slate-500">
          找到 <span className="font-semibold text-slate-700">{searchResults.length}</span> 个结果
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
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
          {/* 人物卡片（带 role）用网格布局，一行三列 */}
          {currentItems.filter((item) => item.role).length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
              {currentItems.filter((item) => item.role).map((item) => renderItem(item, false, currentTab.id))}
            </div>
          )}
          {/* 其他卡片用列表布局 */}
          {currentItems.filter((item) => !item.role).length > 0 && (
            <div className="space-y-3">
              {currentItems.filter((item) => !item.role).map((item) => renderItem(item, false, currentTab.id))}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasSearch && currentTab && currentItems.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">这个板块还没有内容，请联系管理员添加。</div>
      )}

      {hasSearch && searchResults.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-500 text-sm">没找到相关的内容，试试其他关键词？</p>
          <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }} className="mt-3 text-xs text-brand-600 font-medium hover:text-brand-700">
            返回首页
          </button>
        </div>
      )}
    </div>
  );

  function renderItem(item, isSearchResult, tabId) {
    const key = itemKey(tabId, item.id);
    const done = doneSet.has(key);
    const hasSteps = item.steps && item.steps.length > 0;
    const isExpanded = expandedItem === key;

    // 人员卡片风格（如果 item 有 role 字段）
    if (item.role && !isSearchResult) {
      return (
        <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-brand-200 transition-all">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold mb-3">
            {item.title ? item.title[0] : '?'}
          </div>
          <h3 className="text-sm font-semibold text-slate-800">{item.title}</h3>
          <p className="text-xs font-medium text-brand-600 mt-0.5">{item.role}</p>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
          {item.links && item.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.links.map((link, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{link.text}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 带步骤的展开卡片（支持勾选 + 展开，互不干扰）
    if (hasSteps) {
      return (
        <div key={item.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${done ? 'border-green-200 bg-green-50/40' : 'border-slate-200 hover:border-brand-200'}`}>
          <div className="flex items-start gap-3 px-4 py-3.5">
            {/* 勾选圆圈 */}
            {!isSearchResult && (
              <div onClick={() => toggleDone(tabId, item.id)} className="cursor-pointer shrink-0 mt-0.5">
                {done
                  ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/></svg>
                }
              </div>
            )}
            {/* 标题 + 展开区 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3
                  className={`text-sm font-semibold cursor-pointer ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                  onClick={() => !isSearchResult && toggleDone(tabId, item.id)}
                >{item.title}</h3>
                <button
                  onClick={(e) => { e.stopPropagation(); setExpandedItem(isExpanded ? null : key); }}
                  className="shrink-0 p-0.5 rounded hover:bg-slate-100 text-slate-400"
                >
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[800px] mt-3' : 'max-h-0'}`}>
                <div className="space-y-3">
                  <p className="text-xs text-slate-500 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
                  <ol className="space-y-2">
                    {(item.steps || []).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                        <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                  {item.links && item.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.links.map((link, idx) => link.url ? (
                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700" onClick={(e) => e.stopPropagation()}>{link.text}<ExternalLink size={11} /></a>
                      ) : null)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 默认卡片（可勾选待办、交接工作等）
    return (
      <div
        key={item.id}
        className={`bg-white rounded-xl border ${done ? 'border-green-200 bg-green-50/40' : 'border-slate-200'} p-4 transition-all hover:shadow-sm ${!isSearchResult ? 'cursor-pointer' : ''}`}
        onClick={() => !isSearchResult && toggleDone(tabId, item.id)}
      >
        <div className="flex items-start gap-3">
          {!isSearchResult && (
            done
              ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/></svg>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{item.title}</h3>
            <p className={`text-xs mt-1 leading-relaxed ${done ? 'text-slate-400' : 'text-slate-500'}`} style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
            {item.links && item.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.links.map((link, idx) => link.url ? (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                    {link.text}<ExternalLink size={11} />
                  </a>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{link.text}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
