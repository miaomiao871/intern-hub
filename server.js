import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadFromGitHub, saveToGitHub, isBackupConfigured } from './src/githubBackup.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, 'data.json');
const PORT = process.env.PORT || 3000;

// 默认初始数据（首次启动时写入）
const DEFAULT_DATA = {
  settings: {
    siteTitle: '🚀 华中平台实习生导航',
    siteSubtitle: '别焦虑，第一天该干啥都给你整明白了 👇',
    quickTags: ['发快递', '考勤补单', '打印', 'VPN安装', '大文件传输', '忘带工卡'],
  },
  tabs: [
    { id: 1, label: '📋 第一天干什么', items: [
      { id: 1, title: '找吴家霞（00069539）办理报道，注册 iCenter 账号', content: '去 HR 区域找吴家霞办理入职报道手续，她会协助注册 iCenter 账号，激活后即可使用考勤打卡、空间传输等功能。', links: [] },
      { id: 2, title: '找许涛（10346617）重装系统 & 装办公软件', content: '去 8 楼 8-3 办公室找许涛，重装公司系统，确认安装以下必备软件：UDS VPN（远程办公必备）、zMail 企业邮箱客户端、办公套件等。', links: [] },
      { id: 3, title: '找阿的尼色莫（00208372）修改下班考勤时间', content: '下班打卡时间需要调整为 17:30，避免被系统记为早退。去 8 楼找阿的尼色莫，她会帮你修改考勤时间配置。', links: [] },
      { id: 4, title: '牢记信息安全守则 🚨', content: '公司电脑禁止登录微信 / QQ 等个人社交软件。严禁插拔个人 U 盘。禁止将内部资料上传到任何个人网盘。违反规定将面临严肃处理。', links: [{ text: '查看详细信息安全规定', url: 'https://todo.zte.com.cn/IOA/index.aspx' }] },
    ]},
    { id: 2, label: '👥 找谁办', items: [
      { id: 1, title: '李济杨', role: '团队领导', content: '常驻南京，负责请假审批、考勤补单审批、快递审批等管理事务。', links: [{ text: '企业微信：李济杨', url: '' }] },
      { id: 2, title: '方韦波', role: '带教老师', content: '实习工作各项事宜的直接对接人，负责工作分配、权限审批确认、日常指导。', links: [{ text: '企业微信：方韦波', url: '' }] },
      { id: 3, title: '许涛', role: 'IT 支持', content: '负责电脑重装系统、办公软件安装、IT 相关问题处理。', links: [{ text: '8楼 8-3 办公室 / 企业微信：许涛', url: '' }] },
      { id: 4, title: '吴家霞', role: 'HR 报道负责人', content: '处理实习生入职报道、iCenter 账号注册等入职手续。', links: [{ text: '工号：00069539', url: '' }] },
      { id: 5, title: '阿的尼色莫', role: '考勤管理员', content: '负责考勤时间配置修改，处理考勤相关的系统设置问题。', links: [{ text: '工号：00208372', url: '' }] },
      { id: 6, title: '赵继旺', role: '快递受理人', content: '快递寄送业务的受理对接人，处理寄件审批后的实际收发。', links: [{ text: '企业微信：赵继旺', url: '' }] },
    ]},
    { id: 3, label: '📖 怎么办', items: [
      { id: 1, title: '📦 邮寄快递', content: '公司寄快递的完整操作流程：IT 网站提单 → 审批 → 顺丰下单。', steps: ['IT 网站提单，审批人选择「李济杨」，受理人选择「赵继旺」', '审批通过后，去 1 楼收发室找顺丰快递员下单', '寄付方式选择「月结」，快递类型选「标快」'], links: [{ text: '前往 IT 网站提单', url: 'https://todo.zte.com.cn/IOA/index.aspx' }] },
      { id: 2, title: '⏰ 考勤补单', content: '忘记打卡或出差需要补单时的操作步骤。', steps: ['打开手机端 iCenter 应用', '依次进入：工作台 → 我的 → 补单', '缺哪次打卡选「单次」，全天未到选「双次」', '类型选择「市内公差」，审批人选择「李济杨」'], links: [] },
      { id: 3, title: '🪪 忘带工卡怎么办', content: '上班忘带工卡也能顺利打卡进门和吃饭。', steps: ['进公司：去 1 楼前台报工号，让前台帮忙打卡', '吃午饭：找 mentor 借卡刷卡，或者先赊账第二天刷还给别人'], links: [] },
      { id: 4, title: '🖨️ 打印文件', content: '使用公司打印机需要先开通权限，再刷卡操作。', steps: ['先开通「打印审计」权限（联系 IT 支持处理）', '去 8 楼电梯口的打印机处，刷工卡登录打印机', '选择要打印的文件，等待打印完成', '打印完成后记得再刷一次工卡锁屏，保护信息安全'], links: [] },
      { id: 5, title: '📎 传超大文件', content: 'zMail 附件大小有限制，超大文件用内部空间传输。', steps: ['打开手机端或电脑端 iCenter', '进入「空间」→「华中平台」→「文档」目录', '上传文件到该目录作为中间传输', '通知接收方去同一位置下载，下载完后删除文件'], links: [] },
    ]},
    { id: 4, label: '🤝 交接工作', items: [
      { id: 1, title: '📊 日报周报填写规范', content: '每天下班前在 iCenter 填写工作日报，每周五下班前提交周报。日报需包含今日完成、明日计划、遇到问题三项。', links: [{ text: 'iCenter 日报入口', url: 'https://icenter.zte.com.cn/daily' }, { text: '周报模板下载', url: 'https://share.zte.com.cn/weekly-template' }] },
      { id: 2, title: '🗂️ 项目文档归档规范', content: '项目文档需统一归档到 Confluence 对应目录，命名规则：<项目名>_<文档类型>_<日期>。设计稿和需求文档必须经 review 后才能归档。', links: [{ text: 'Confluence 文档目录', url: 'https://wiki.zte.com.cn/projects' }, { text: '文档命名规范说明', url: 'https://wiki.zte.com.cn/naming-guide' }] },
      { id: 3, title: '🔑 系统权限移交清单', content: '实习结束前需将以下系统权限移交回导师或指定同事：GitLab 仓库权限、JIRA 项目权限、测试环境账号。请填写权限移交申请表。', links: [{ text: '权限移交申请表', url: 'https://it.zte.com.cn/permission-transfer' }] },
    ]},
  ],
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 提供前端静态文件
app.use(express.static(join(__dirname, 'dist')));

// 读取数据：GitHub 备份优先 → 本地文件 → 默认数据
async function loadData() {
  // 如果有 GITHUB_TOKEN，优先从 GitHub 恢复
  if (isBackupConfigured()) {
    const githubData = await loadFromGitHub();
    if (githubData) {
      // 同时写入本地，后续读取更快
      saveDataSync(githubData);
      console.log('📦 已从 GitHub 恢复数据并缓存到本地');
      return githubData;
    }
  }

  // GitHub 恢复失败 → 尝试本地文件
  if (existsSync(DATA_FILE)) {
    try {
      const local = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
      console.log('📦 从本地文件加载数据');
      return local;
    } catch {
      console.warn('⚠️ 本地数据损坏，将使用默认数据');
    }
  }

  // 本地也没有 → 默认数据
  saveDataSync(DEFAULT_DATA);
  console.log('📦 使用默认初始数据');
  return DEFAULT_DATA;
}

// 同步保存到本地文件
function saveDataSync(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 保存数据：本地 + GitHub 备份
async function saveData(data) {
  // 先写本地（必须成功）
  saveDataSync(data);

  // 再异步推送 GitHub（不阻塞返回）
  if (isBackupConfigured()) {
    saveToGitHub(data).then(ok => {
      if (ok) console.log('✅ GitHub 备份完成');
    });
  }
}

// GET /api/data — 获取全部数据
app.get('/api/data', async (req, res) => {
  const data = await loadData();
  if (data) {
    res.json({ success: true, data, backup: isBackupConfigured() ? 'github' : 'local' });
  } else {
    res.json({ success: false, message: '暂无数据' });
  }
});

// GET /api/health — 健康检查 & 备份状态
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    backup: isBackupConfigured() ? 'github' : 'local-only',
    message: isBackupConfigured()
      ? '✅ GitHub 自动备份已启用'
      : '⚠️ 未配置 GitHub 备份（设置 GITHUB_TOKEN 环境变量即可启用）',
  });
});

// PUT /api/data — 保存全部数据
app.put('/api/data', async (req, res) => {
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ success: false, message: '缺少 data 字段' });
  }
  await saveData(data);
  res.json({ success: true, backup: isBackupConfigured() ? 'github' : 'local' });
});

// 所有其他路由返回 index.html（SPA 支持）
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 InternHub 服务已启动: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/data`);
});
