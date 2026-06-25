import { useState, useMemo } from 'react';

// ─── Cute SVG Icons ───
const IconSearch = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <circle cx="10.5" cy="10.5" r="7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
);
const IconExternal = (props) => (
  <svg width="11" height="11" viewBox="0 0 18 18" fill="none" {...props}>
    <path d="M15 10.5v4a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 013 14.5v-9A1.5 1.5 0 014.5 4H9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11 3h4v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 12l7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconHash = (props) => (
  <svg width="12" height="12" viewBox="0 0 18 18" fill="none" {...props}>
    <path d="M6.5 3l-1.5 12M12.5 3l-1.5 12M3.5 7h11.5M3 12h11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);
const IconChevronDown = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconChevronUp = (props) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
    <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

// 武汉暖调标签 / 长沙标签
const MORANDI_TAGS_WARM = [
  'bg-cream-100 text-[#C47825] border-cream-300',
  'bg-card-pink/30 text-[#D48A8A] border-card-pink/40',
  'bg-card-blue/30 text-[#5A9BB8] border-card-blue/40',
  'bg-card-success/40 text-[#7AA83A] border-card-success/50',
];
const MORANDI_TAGS_BLUE = [
  'bg-card-activity/30 text-card-activity border-card-activity/40',
  'bg-card-mood/20 text-card-mood border-card-mood/30',
  'bg-card-food/30 text-amber-700 border-card-food/40',
  'bg-card-sleep/20 text-card-sleep border-card-sleep/30',
];

export default function StudentView({ data, activeCity }) {
  const tabs = data.tabs || [];
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : null);
  const [search, setSearch] = useState('');
  const [doneSet, setDoneSet] = useState(new Set());
  const [expandedItem, setExpandedItem] = useState(null);

  const isChangsha = activeCity === 'changsha';
  const MORANDI_TAGS = isChangsha ? MORANDI_TAGS_BLUE : MORANDI_TAGS_WARM;
  // 武汉暖杏 / 长沙薰衣草紫
  const tabAccent = isChangsha ? 'border-lavender-500 text-lavender-600' : 'border-cream-500 text-[#C47825]';
  const tabBadge = isChangsha ? 'bg-lavender-100' : 'bg-cream-100';
  // Card theme colors
  const personBg = isChangsha
    ? 'bg-white rounded-2xl border border-lavender-100'
    : 'bg-[#FFFBF0] rounded-2xl border border-cream-100';
  const personAvatar = isChangsha ? 'bg-[#F7CFCD]/40 text-[#D48A8A]' : 'bg-card-pink/40 text-[#D48A8A]';
  const personRole = isChangsha ? 'text-[#E87A7A]' : 'text-[#D48A8A]';
  const personTag = isChangsha ? 'text-lavender-400 bg-lavender-50' : 'text-[#9A9690] bg-cream-50';
  const foldBg = isChangsha
    ? 'bg-white rounded-2xl border border-lavender-100'
    : 'bg-[#FFFBF0] rounded-2xl border border-cream-100';
  const foldStep = isChangsha ? 'bg-lavender-200 text-lavender-700' : 'bg-card-blue/40 text-[#5A9BB8]';
  const foldChevron = isChangsha ? 'text-lavender-400' : 'text-cream-400';

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
    <div style={{ background: isChangsha ? '#F9F8FC' : '#FFF8E8' }} className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-10">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl md:text-2xl font-extrabold text-[#2D2A26] tracking-tight">
              {settings.siteTitle || '🐣 平台导航'}
            </h1>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              isChangsha ? 'bg-lavender-100 text-lavender-600' : 'bg-cream-100 text-[#2D2A26]'
            }`}>
              {isChangsha ? '长沙' : '武汉'}
            </span>
          </div>
          <p className="text-sm text-[#6B6863] ml-1">{settings.siteSubtitle}</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9690]" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="text-[#9A9690]" placeholder="搜一下——找人、问流程、查事项..."
            className={`w-full pl-11 pr-4 py-3 bg-white border rounded-2xl text-sm focus:outline-none focus:ring-2 shadow-sm transition-all ${
              isChangsha
                ? 'border-lavender-100 focus:ring-lavender-300/40 focus:border-lavender-400'
                : 'border-cream-200 focus:ring-cream-300/40 focus:border-cream-400'
            }`}
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
                <IconHash className="inline mr-0.5" />{tag}
              </button>
            );
          })}
          {search && (
            <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-cream-200 text-[#2D2A26] hover:bg-cream-300 transition-colors">
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
                      : 'border-transparent text-[#9A9690] hover:text-[#2D2A26]'
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
          <div className="mb-4 text-sm text-[#6B6863]">
            找到 <span className="font-semibold text-[#2D2A26]">{searchResults.length}</span> 个结果
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
                  <div className="flex items-center gap-1.5 mb-2.5 text-[11px] font-semibold text-[#6B6863] uppercase tracking-wider">{group.label}</div>
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
            <p className="text-[#9A9690] text-sm">这个板块还没有内容</p>
            <p className="text-[#9A9690] text-xs mt-1">点击右上角「设置」来添加</p>
          </div>
        )}
        {hasSearch && searchResults.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-[#9A9690] text-sm">没找到相关内容，试试其他关键词</p>
            <button onClick={() => { setSearch(''); setActiveTab(tabs.length > 0 ? tabs[0].id : null); window.scrollTo(0, 0); }}
              className="mt-3 text-xs font-semibold text-[#2D2A26] hover:text-[#2D2A26]">返回首页</button>
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
          <h3 className="text-sm font-bold text-[#2D2A26]">{item.title}</h3>
          <p className={`text-[11px] font-semibold ${personRole} mt-0.5`}>{item.role}</p>
          <p className="text-xs text-[#6B6863] mt-2 leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
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
            <span className="text-sm font-bold text-[#2D2A26]">{item.title}</span>
            {isExpanded ? <IconChevronUp className={`${foldChevron} shrink-0`} /> : <IconChevronDown className={`${foldChevron} shrink-0`} />}
          </button>
          <div className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[800px]' : 'max-h-0'}`}>
            <div className="px-4 pb-4 space-y-3">
              <p className="text-xs text-[#6B6863] leading-relaxed" style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
              {hasSteps && (
                <ol className="space-y-2">
                  {(item.steps || []).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-[#2D2A26]">
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
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2D2A26] hover:text-[#2D2A26]">{link.text}<IconExternal /></a>
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
            : `${isChangsha ? 'bg-white border-lavender-100' : 'bg-[#FFFBF0] border-cream-100'} hover:shadow-md hover:-translate-y-0.5 cursor-pointer`
        }`}>
        <div className="flex items-start gap-3">
          {!isSearchResult && (
            done
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7A9473" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 animate-pop"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8D5C4" strokeWidth="1.5" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/></svg>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-bold ${done ? 'text-[#9A9690] line-through' : 'text-[#2D2A26]'}`}>{item.title}</h3>
            <p className={`text-xs mt-1 leading-relaxed ${done ? 'text-[#9A9690]' : 'text-[#6B6863]'}`} style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
            {hasSteps && (
              <ol className="space-y-1.5 mt-2">
                {(item.steps || []).map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px] text-[#6B6863]">
                    <span className="w-4 h-4 rounded-lg bg-cream-100 text-[#2D2A26] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
            {item.links && item.links.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {item.links.map((link, idx) => link.url ? (
                  <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D2A26] bg-cream-50 hover:bg-cream-100 px-2.5 py-1 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                    {link.text}<IconExternal /></a>
                ) : (
                  <span key={idx} className="inline-flex items-center gap-1 text-[11px] text-[#9A9690] bg-cream-50 px-2 py-1 rounded-lg">{link.text}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
