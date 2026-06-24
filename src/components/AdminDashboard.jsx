import { useState, useRef, useCallback } from 'react';

export default function AdminDashboard({ data, setData, onBack, activeCity }) {
  const tabs = data.tabs || [];
  const [activeTabId, setActiveTabId] = useState(tabs.length > 0 ? tabs[0].id : null);
  const [editingTab, setEditingTab] = useState(null);
  const [tabNameInput, setTabNameInput] = useState('');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [undoInfo, setUndoInfo] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
  const saveTimerRef = useRef(null);

  const defaultItem = { title: '', content: '', role: '', steps: '', links: [] };
  const [itemForm, setItemForm] = useState(defaultItem);

  // 页面设置表单
  const [settingsForm, setSettingsForm] = useState({
    siteTitle: data.settings?.siteTitle || '',
    siteSubtitle: data.settings?.siteSubtitle || '',
    quickTags: (data.settings?.quickTags || []).join('，'),
  });

  const UNDO_TIMEOUT = 10000;

  const showToast = (msg) => {
    setToast(msg);
    if (msg.includes('保存')) markSaving();
    setTimeout(() => setToast(null), 2500);
  };

  // 保存时显示状态
  const markSaving = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveStatus('saved'), 600);
  }, []);

  const currentTab = tabs.find((t) => t.id === activeTabId);
  const currentItems = currentTab ? currentTab.items : [];

  // 根据板块类型决定编辑表单显示哪些字段
  const tabLabel = currentTab?.label || '';
  const showRoleField = !tabLabel.includes('第一天干什么') && !tabLabel.includes('怎么办');
  const showStepsField = !tabLabel.includes('第一天干什么');

  // ─── Tab CRUD ───

  const startNewTab = () => {
    setEditingTab('new');
    setTabNameInput('');
  };

  const startRenameTab = (tab) => {
    setEditingTab(tab.id);
    setTabNameInput(tab.label);
  };

  const saveTabName = () => {
    const name = tabNameInput.trim();
    if (!name) return;
    const newId = Date.now();
    setData((prev) => {
      const list = [...prev.tabs];
      if (editingTab === 'new') {
        list.push({ id: newId, label: name, items: [] });
      } else {
        const idx = list.findIndex((t) => t.id === editingTab);
        if (idx >= 0) list[idx] = { ...list[idx], label: name };
      }
      return { ...prev, tabs: list };
    });
    if (editingTab === 'new') {
      setActiveTabId(newId);
    }
    setEditingTab(null);
    showToast('✅ Tab 已保存');
  };

  const deleteTab = (id) => {
    const tab = tabs.find((t) => t.id === id);
    if (!tab) return;
    // 保存备份用于撤销
    const backup = { type: 'tab', data: JSON.parse(JSON.stringify(tab)), index: tabs.findIndex((t) => t.id === id) };
    // 执行删除
    setData((prev) => ({
      ...prev,
      tabs: prev.tabs.filter((t) => t.id !== id),
    }));
    if (activeTabId === id) {
      const remaining = tabs.filter((t) => t.id !== id);
      setActiveTabId(remaining.length > 0 ? remaining[0].id : null);
    }
    markSaving();
    // 显示撤销
    clearTimeout(undoInfo?.timeoutId);
    const timeoutId = setTimeout(() => setUndoInfo(null), UNDO_TIMEOUT);
    setUndoInfo({ message: `已删除「${tab.label}」`, backup, timeoutId });
  };

  const undoDelete = () => {
    if (!undoInfo) return;
    clearTimeout(undoInfo.timeoutId);
    const { backup } = undoInfo;
    if (backup.type === 'tab') {
      setData((prev) => {
        const list = [...prev.tabs];
        list.splice(backup.index, 0, backup.data);
        return { ...prev, tabs: list };
      });
    } else if (backup.type === 'item') {
      setData((prev) => {
        const list = [...prev.tabs];
        const tabIdx = list.findIndex((t) => t.id === backup.tabId);
        if (tabIdx < 0) return prev;
        const items = [...list[tabIdx].items];
        items.splice(backup.index, 0, backup.data);
        list[tabIdx] = { ...list[tabIdx], items };
        return { ...prev, tabs: list };
      });
    }
    setUndoInfo(null);
    showToast('✅ 已恢复');
  };

  const moveTab = (id, dir) => {
    const idx = tabs.findIndex((t) => t.id === id);
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= tabs.length) return;
    setData((prev) => {
      const list = [...prev.tabs];
      [list[idx], list[target]] = [list[target], list[idx]];
      return { ...prev, tabs: list };
    });
  };

  // ─── Item CRUD ───

  const openNewItem = () => {
    setItemForm({ title: '', content: '', role: '', steps: '', links: [] });
    setEditingItem(null);
    setShowItemForm(true);
  };

  const openEditItem = (item) => {
    setItemForm({
      title: item.title || '',
      content: item.content || '',
      role: item.role || '',
      steps: (item.steps || []).join('\n'),
      links: item.links || [],
    });
    setEditingItem(item.id);
    setShowItemForm(true);
  };

  const addLink = () => {
    setItemForm((prev) => ({ ...prev, links: [...(prev.links || []), { text: '', url: '' }] }));
  };

  const removeLink = (idx) => {
    setItemForm((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== idx) }));
  };

  const updateLink = (idx, field, value) => {
    setItemForm((prev) => {
      const links = [...(prev.links || [])];
      links[idx] = { ...links[idx], [field]: value };
      return { ...prev, links };
    });
  };

  const saveItem = () => {
    if (!activeTabId) return;
    const newItem = {
      id: editingItem || Date.now(),
      title: itemForm.title,
      content: itemForm.content,
      role: itemForm.role || undefined,
      steps: itemForm.steps ? itemForm.steps.split('\n').filter(Boolean) : undefined,
      links: (itemForm.links || []).filter((l) => l.text || l.url),
    };
    // 清理空字段
    if (!newItem.role) delete newItem.role;
    if (!newItem.steps || newItem.steps.length === 0) delete newItem.steps;
    if (!newItem.links || newItem.links.length === 0) delete newItem.links;

    setData((prev) => {
      const list = [...prev.tabs];
      const tabIdx = list.findIndex((t) => t.id === activeTabId);
      if (tabIdx < 0) return prev;
      const tab = { ...list[tabIdx], items: [...list[tabIdx].items] };
      if (editingItem) {
        const itemIdx = tab.items.findIndex((i) => i.id === editingItem);
        if (itemIdx >= 0) tab.items[itemIdx] = newItem;
      } else {
        tab.items.push(newItem);
      }
      list[tabIdx] = tab;
      return { ...prev, tabs: list };
    });
    setShowItemForm(false);
    showToast('✅ 卡片已保存');
  };

  const deleteItem = (itemId) => {
    if (!activeTabId) return;
    const tab = tabs.find((t) => t.id === activeTabId);
    if (!tab) return;
    const item = tab.items.find((i) => i.id === itemId);
    if (!item) return;
    // 保存备份
    const backup = { type: 'item', data: JSON.parse(JSON.stringify(item)), tabId: activeTabId, index: tab.items.findIndex((i) => i.id === itemId) };
    // 执行删除
    setData((prev) => {
      const list = [...prev.tabs];
      const tabIdx = list.findIndex((t) => t.id === activeTabId);
      if (tabIdx < 0) return prev;
      const tab = { ...list[tabIdx], items: list[tabIdx].items.filter((i) => i.id !== itemId) };
      list[tabIdx] = tab;
      return { ...prev, tabs: list };
    });
    markSaving();
    // 显示撤销
    clearTimeout(undoInfo?.timeoutId);
    const timeoutId = setTimeout(() => setUndoInfo(null), UNDO_TIMEOUT);
    setUndoInfo({ message: `已删除「${item.title || item.name || '无标题'}」`, backup, timeoutId });
  };

  const moveItem = (index, dir) => {
    if (!activeTabId) return;
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentItems.length) return;
    setData((prev) => {
      const list = [...prev.tabs];
      const tabIdx = list.findIndex((t) => t.id === activeTabId);
      if (tabIdx < 0) return prev;
      const items = [...list[tabIdx].items];
      [items[index], items[target]] = [items[target], items[index]];
      list[tabIdx] = { ...list[tabIdx], items };
      return { ...prev, tabs: list };
    });
  };

  const handleSettingsChange = (field, value) => {
    setSettingsForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSettingsSave = () => {
    const tags = settingsForm.quickTags
      .split(/[，,、\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    setData((prev) => ({
      ...prev,
      settings: { siteTitle: settingsForm.siteTitle, siteSubtitle: settingsForm.siteSubtitle, quickTags: tags },
    }));
    showToast('✅ 保存成功');
  };

  return (
    <div className="flex flex-col md:flex-row gap-0 h-[calc(100vh-72px)] bg-slate-50">
      {/* ─── Left: Tab Manager ─── */}
      <div className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">板块管理</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">{activeCity === 'wuhan' ? '武汉' : '长沙'}</span>
            <button onClick={onBack} className="text-xs text-brand-600 hover:text-brand-800 font-medium">返回前台 →</button>
          </div>
        </div>
        <button onClick={startNewTab} className="w-full mb-3 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-full hover:bg-brand-700 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新增板块
        </button>

        {/* 新增板块输入框 */}
        {editingTab === 'new' && (
          <div className="mb-3 bg-brand-50 rounded-2xl p-3 border border-brand-200">
            <input
              type="text" value={tabNameInput}
              onChange={(e) => setTabNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveTabName()}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 mb-2"
              placeholder="输入板块名称..."
              autoFocus
            />
            <div className="flex gap-1.5">
              <button onClick={saveTabName} className="flex-1 px-2 py-1 text-xs font-medium bg-brand-600 text-white rounded-3xl hover:bg-brand-700">确定</button>
              <button onClick={() => setEditingTab(null)} className="flex-1 px-2 py-1 text-xs font-medium border border-slate-200 rounded-3xl text-slate-500 hover:bg-slate-50">取消</button>
            </div>
          </div>
        )}

        <div className="space-y-1">
          {tabs.map((t, idx) => (
            <div key={t.id} className={`rounded-2xl ${activeTabId === t.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50'}`}>
              {editingTab === t.id ? (
                <div className="p-2 space-y-2">
                  <input
                    type="text" value={tabNameInput}
                    onChange={(e) => setTabNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveTabName()}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-3xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
                    placeholder="Tab 名称"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <button onClick={saveTabName} className="flex-1 px-2 py-1 text-xs font-medium bg-brand-600 text-white rounded-3xl hover:bg-brand-700">确定</button>
                    <button onClick={() => setEditingTab(null)} className="flex-1 px-2 py-1 text-xs font-medium border border-slate-200 rounded-3xl text-slate-500 hover:bg-slate-50">取消</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-2">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moveTab(t.id, 'up')} disabled={idx === 0} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20 disabled:cursor-not-allowed leading-none" title="上移">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button onClick={() => moveTab(t.id, 'down')} disabled={idx === tabs.length - 1} className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-20 disabled:cursor-not-allowed leading-none" title="下移">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </div>
                  <button onClick={() => setActiveTabId(t.id)} className="flex-1 text-left text-sm font-medium text-slate-700 truncate">{t.label}</button>
                  <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full shrink-0">{t.items.length}</span>
                  <button onClick={() => startRenameTab(t)} className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 shrink-0" title="重命名">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deleteTab(t.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 shrink-0" title="删除">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {tabs.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">暂无板块，点击上方新增</div>
        )}

        {/* 页面设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-full mt-4 px-3 py-2 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
            showSettings ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          ⚙ 页面设置
        </button>
      </div>

      {/* ─── Right: Content ─── */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">

        {/* 页面设置面板 */}
        {showSettings && (
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4">⚙ 页面设置</h3>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-5 max-w-xl">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">网站标题</label>
                <input type="text" value={settingsForm.siteTitle} onChange={(e) => handleSettingsChange('siteTitle', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300" placeholder="如：🚀 华中平台实习生导航" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">网站副标题</label>
                <input type="text" value={settingsForm.siteSubtitle} onChange={(e) => handleSettingsChange('siteSubtitle', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300" placeholder="如：别焦虑，第一天该干啥都给你整明白了 👇" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">快捷标签（用中文逗号或换行分隔）</label>
                <textarea rows={4} value={settingsForm.quickTags} onChange={(e) => handleSettingsChange('quickTags', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 resize-none" placeholder="发快递，考勤补单，打印，VPN安装，大文件传输，忘带工卡" />
                <p className="text-xs text-slate-400 mt-1.5">当前 {settingsForm.quickTags.split(/[，,、\n]/).filter(Boolean).length} 个标签</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setSettingsForm({ siteTitle: data.settings?.siteTitle || '', siteSubtitle: data.settings?.siteSubtitle || '', quickTags: (data.settings?.quickTags || []).join('，') })} className="px-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">重置</button>
                <button onClick={handleSettingsSave} className="px-5 py-2.5 bg-brand-600 text-white rounded-2xl text-sm font-medium hover:bg-brand-700 hover:-translate-y-0.5 transition-all duration-200">保存设置</button>
              </div>
            </div>

          </div>
        )}

        {/* Tab 内容管理 */}
        {!showSettings && activeTabId && currentTab ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">{currentTab.label} <span className="text-sm font-normal text-slate-400">({currentItems.length} 条内容)</span></h3>
              <button onClick={openNewItem} className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-2xl hover:bg-brand-700 hover:-translate-y-0.5 transition-all duration-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                新增卡片
              </button>
            </div>

            <div className="space-y-2">
              {currentItems.map((item, idx) => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3 flex items-start justify-between gap-3 hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed" title="上移">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button onClick={() => moveItem(idx, 'down')} disabled={idx === currentItems.length - 1} className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-20 disabled:cursor-not-allowed" title="下移">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.title || '(无标题)'}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {item.role ? `[${item.role}] ` : ''}{item.content || ''}{(item.links && item.links.length > 0) ? ` | ${item.links.length} 个链接` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEditItem(item)} className="px-3 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-3xl transition-colors">编辑</button>
                    <button onClick={() => deleteItem(item.id)} className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-3xl transition-colors">删除</button>
                  </div>
                </div>
              ))}
              {currentItems.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm">暂无卡片，点击上方「新增卡片」添加</div>
              )}
            </div>
          </>
        ) : !showSettings ? (
          <div className="text-center py-16 text-slate-400 text-sm">请先在左侧选择或新增一个板块</div>
        ) : null}
      </div>

      {/* ─── Item Modal ─── */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-800">{editingItem ? '编辑' : '新增'}卡片</h2>
              <button onClick={() => setShowItemForm(false)} className="p-1 rounded-3xl hover:bg-slate-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* 标题 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">标题 / 姓名</label>
                <input
                  type="text" value={itemForm.title}
                  onChange={(e) => setItemForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
                  placeholder="卡片标题"
                />
              </div>

              {/* 角色（用于人员卡片） */}
              {showRoleField && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">角色 / 职务 <span className="text-slate-300 font-normal">（填写后前台显示为人名卡片风格）</span></label>
                <input
                  type="text" value={itemForm.role}
                  onChange={(e) => setItemForm((p) => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300"
                  placeholder="如：团队领导（留空则显示为通用卡片）"
                />
              </div>
              )}

              {/* 内容 */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">正文内容</label>
                <textarea
                  rows={3} value={itemForm.content}
                  onChange={(e) => setItemForm((p) => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 resize-none"
                  placeholder="描述文字..."
                />
              </div>

              {/* 操作步骤 */}
              {showStepsField && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">操作步骤（每行一步，可选） <span className="text-slate-300 font-normal">填写后前台显示为可展开的手风琴</span></label>
                <textarea
                  rows={4} value={itemForm.steps}
                  onChange={(e) => setItemForm((p) => ({ ...p, steps: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300 resize-none"
                  placeholder="第一步...&#10;第二步..."
                />
              </div>
              )}

              {/* 多链接编辑器 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-slate-500">超链接列表（可选）</label>
                  <button onClick={addLink} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    添加链接
                  </button>
                </div>
                <div className="space-y-2">
                  {(itemForm.links || []).map((link, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 rounded-3xl p-2.5">
                      <div className="flex-1 space-y-1.5">
                        <input type="text" value={link.text} onChange={(e) => updateLink(idx, 'text', e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-3xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300" placeholder="链接文字" />
                        <input type="text" value={link.url} onChange={(e) => updateLink(idx, 'url', e.target.value)} className="w-full px-2.5 py-1.5 border border-slate-200 rounded-3xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-300" placeholder="https://..." />
                      </div>
                      <button onClick={() => removeLink(idx)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 shrink-0 mt-0.5">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                  {(!itemForm.links || itemForm.links.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-3">暂无链接，点击上方「添加链接」</p>
                  )}
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowItemForm(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">取消</button>
                <button onClick={saveItem} className="flex-1 px-5 py-2.5 bg-brand-600 text-white rounded-full text-sm font-medium hover:bg-brand-700 hover:-translate-y-0.5 transition-all duration-200">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 底部状态栏 */}
      <div className="fixed bottom-4 right-4 z-[999] flex flex-col items-end gap-2">
        {/* 撤销提示 */}
        {undoInfo && (
          <div className="bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-sm shadow-lg flex items-center gap-4 animate-fade-in">
            <span>{undoInfo.message}</span>
            <button onClick={undoDelete} className="font-bold underline whitespace-nowrap hover:text-amber-100">撤销</button>
          </div>
        )}
        {/* 保存状态 */}
        {saveStatus !== 'idle' && (
          <div className={`px-4 py-1.5 rounded-2xl text-xs shadow-lg ${
            saveStatus === 'saving' ? 'bg-slate-700 text-slate-300' : 'bg-emerald-600 text-white'
          }`}>
            {saveStatus === 'saving' ? '保存中...' : '已保存 ✓'}
          </div>
        )}
        {/* Toast */}
        {toast && (
          <div className="bg-slate-800 text-white px-5 py-2.5 rounded-2xl text-sm shadow-lg animate-fade-in">{toast}</div>
        )}
      </div>
    </div>
  );
}
