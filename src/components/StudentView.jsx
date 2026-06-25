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

// 莫兰迪柔和彩色标签
const MORANDI_TAGS_WARM = [
  'bg-cream-200 text-cream-700 border-cream-300',
  'bg-dust-100 text-dust-600 border-dust-200',
  'bg-sage-100 text-sage-600 border-sage-200',
  'bg-lavender-100 text-lavender-600 border-lavender-200',
];
const MORANDI_TAGS_BLUE = [
  'bg-lake-100 text-lake-600 border-lake-200',
  'bg-lake-200 text-lake-700 border-lake-300',
  'bg-sage-100 text-sage-600 border-sage-200',
  'bg-lavender-100 text-lavender-600 border-lavender-200',
];

export default function StudentView({ data, activeCity }) {
  const tabs = data.tabs || [];
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : null);
  const [search, setSearch] = useState('');
  const [doneSet, setDoneSet] = useState(new Set());
  const [expandedItem, setExpandedItem] = useState(null);

  const isChangsha = activeCity === 'changsha';
  const MORANDI_TAGS = isChangsha ? MORANDI_TAGS_BLUE : MORANDI_TAGS_WARM;
  const tabAccent = isChangsha ? 'border-lake-500 text-lake-600' : 'border-cream-500 text-cream-600';
  const tabBadge = isChangsha ? 'bg-lake-100' : 'bg-cream-100';
  // Card theme colors
  const personBg = isChangsha ? 'bg-lake-50/60 rounded-2xl border border-lake-200' : 'bg-dust-50/60 rounded-2xl border border-dust-200';
  const personAvatar = isChangsha ? 'bg-lake-200 text-lake-700' : 'bg-dust-200 text-dust-700';
  const personRole = isChangsha ? 'text-lake-500' : 'text-dust-500';
  const personTag = isChangsha ? 'text-lake-400 bg-lake-50' : 'text-dust-400 bg-dust-50';
  const foldBg = isChangsha ? 'bg-lake-50/60 rounded-2xl border border-lake-200' : 'bg-sage-50/60 rounded-2xl border border-sage-200';
  const foldStep = isChangsha ? 'bg-lake-200 text-lake-700' : 'bg-sage-200 text-sage-700';
  const foldChevron = isChangsha ? 'text-lake-400' : 'text-sage-400';

  const itemKey = (tabId, itemId) => `${tabId}-${itemId}`;
  const settings = data.settings || {};
  const quickTags = settings.quickTags || [];

  const searchResults = useMemo(() => {
    if (!search) return [];
    const results = [];
    tabs.forEach((tab) => {
      tab.items.forEach((item) => {
        const text = (item.title || '') + (item.content || '') + (item.links || []).map((l) => l.text).join('');
        if (fuzzyMatch(text, search)) results.push({ tabId: tab.id, tabLabel: tab.label, item });
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
    <div style={{ background: isChangsha ? '#F4F7FA' : '#FFFBF5' }} className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-cream-900 tracking-tight">
              {settings.siteTitle || '🐣 平台导航'}
            </h1>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              isChangsha ? 'bg-lake-100 text-lake-600' : 'bg-cream-100 text-cream-700'
            }`}>
              {isChangsha ? '长沙' : '武汉'}
            </span>
          </div>
          <p className="text-sm text-cream-700/60 ml-1">{settings.siteSubtitle}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-cream-400" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜一下——找人、问流程、查事项..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-cream-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-cream-300/40 focus:border-cream-400 shadow-sm transition-all"
          />
        </div>

        {/* Quick tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {quickTags.map((tag, idx) => {
            const color = MORANDI_TAGS[idx % MORANDI_TAGS.length];
            const isActive = search === tag;
            return (
              <button key={tag} onClick={() => setSearch(isActive ? '' : tag)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                  isActive
                    ? 'bg-cream-500 text-white border-cream-500 scale-105'
                    : color + ' hover:scale-105'
                }`}>
                <Hash size={11} className="inline mr-0.5" />{tag}
              </button>
            );
          })}
          {search && (
            <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-cream-200 text-cream-700 hover:bg-cream-300 transition-colors">
              返回首页
            </button>
          )}
        </div>

        {/* Tabs — underline */}
        {!hasSearch && tabs.length > 0 && (
          <div className="flex gap-0 mb-6 border-b border-cream-200 overflow-x-auto">
            {tabs.map((t) => {
              const doneCount = t.items.filter(item => doneSet.has(itemKey(t.id, item.id))).length;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 -mb-px ${
                    activeTab === t.id
                      ? tabAccent
                      : 'border-transparent text-cream-700/50 hover:text-cream-700'
                  }`}>
                  {t.label}
                  <span className={`ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full ${
                    activeTab === t.id ? tabBadge : 'bg-cream-50'
                  }`}>
                    {doneCount > 0 ? `${doneCount}/${t.items.length}` : t.items.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search results */}
        {hasSearch && (
          <div className="mb-4 text-sm text-cream-700/60">
            找到 <span className="font-semibold text-cream-700">{searchResults.length}</span> 个结果
          </div>
        )}
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
                  <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-cream-500 uppercase tracking-wider">{group.label}</div>
                  <div className="space-y-3">{group.items.map((item) => renderItem(item, true, tabId))}</div>
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

        {/* Empty */}
        {!hasSearch && currentTab && currentItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-cream-700/50 text-sm">这个板块还没有内容</p>
            <p className="text-cream-700/30 text-xs mt-1">点击右上角「设置」来添加</p>
          </div>
        )}
        {hasSearch && searchResults.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-cream-700/50 text-sm">没找到相关内容，试试其他关键词</p>
            <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }}
              className="mt-3 text-xs font-semibold text-cream-600 hover:text-cream-700">返回首页</button>
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

    // Person card — 粉色底(武汉)/蓝色底(长沙)
    if (item.role && !isSearchResult) {
      return (
        <div key={item.id} className={`${personBg} p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
          <div className={`w-9 h-9 rounded-xl ${personAvatar} flex items-center justify-center text-sm font-bold mb-3`}>
            {item.title ? item.title[0] : '?'}
          </div>
          <h3 className="text-sm font-bold text-cream-900">{item.title}</h3>
          <p className={`text-[11px] font-semibold ${personRole} mt-0.5`}>{item.role}</p>
          <p className="text-xs text-cream-700/60 mt-2 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
          {item.links && item.links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {item.links.map((link, idx) => (
                <span key={idx} className={`inline-flex items-center gap-1 text-[11px] ${personTag} px-2 py-1 rounded-lg`}>{link.text}</span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Foldable card — 绿色底(武汉)/蓝色底(长沙)
    if (foldable) {
      return (
        <div key={item.id} className={`${foldBg} overflow-hidden hover:shadow-md transition-all duration-200`}>
          <button onClick={() => setExpandedItem(isExpanded ? null : key)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left">
            <span className="text-sm font-bold text-cream-900">{item.title}</span>
            {isExpanded ? <ChevronUp size={18} className={`${foldChevron} shrink-0`} /> : <ChevronDown size={18} className={`${foldChevron} shrink-0`} />}
          </button>
          <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-cream-700/60 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
              {hasSteps && (
                <ol className="space-y-2">
                  {(item.steps || []).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-cream-800">
                      <span className={`w-5 h-5 rounded-lg ${foldStep} text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5`}>{idx + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              )}
              {item.links && item.links.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {item.links.map((link, idx) => link.url ? (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-cream-600 hover:text-cream-700">{link.text}<ExternalLink size={11} /></a>
                  ) : null)}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Checklist card — 白色底
    return (
      <div key={item.id} onClick={() => !isSearchResult && toggleDone(tabId, item.id)}
        className={`rounded-2xl border p-4 transition-all duration-200 ${
          done
            ? 'bg-cream-100/50 border-cream-200'
            : 'bg-white border-cream-100 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
        }`}>
        <div className="flex items-start gap-3">
          {!isSearchResult && (
            done
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A9473" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 animate-pop"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8D5C4" strokeWidth="1.5" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/></svg>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold ${done ? 'text-cream-300 line-through' : 'text-cream-900'}`}>{item.title}</h3>
            <p className={`text-xs mt-1 leading-relaxed ${done ? 'text-cream-300' : 'text-cream-700/60'}`} style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
            {hasSteps && (
              <ol className="space-y-1.5 mt-2">
                {(item.steps || []).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px] text-cream-700/60">
                    <span className="w-4 h-4 rounded-lg bg-cream-100 text-cream-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {item.links && item.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.links.map((link, idx) => link.url ? (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-cream-600 bg-cream-50 hover:bg-cream-100 px-2.5 py-1 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                    {link.text}<ExternalLink size={11} /></a>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-cream-400 bg-cream-50 px-2 py-1 rounded-lg">{link.text}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
