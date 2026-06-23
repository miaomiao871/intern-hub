// ============================================================
// GitHub 数据备份模块
// 将 data.json 备份到 GitHub 仓库的 _backup/ 目录中
// 服务启动时从 GitHub 恢复，保存时同步到 GitHub
// ============================================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'miaomiao871';
const REPO = 'intern-hub';
const FILE_PATH = '_backup/data.json';
const BRANCH = 'main';
const API_BASE = 'https://api.github.com';

/**
 * 从 GitHub 备份加载数据
 * @returns {object|null} 数据对象，失败则返回 null
 */
export async function loadFromGitHub() {
  if (!GITHUB_TOKEN) {
    console.log('ℹ️ 未配置 GITHUB_TOKEN，跳过 GitHub 恢复');
    return null;
  }
  try {
    const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    console.log('📥 正在从 GitHub 恢复数据...');
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) {
      if (res.status === 404) {
        console.log('ℹ️ GitHub 上暂无备份文件，将使用本地数据');
      } else {
        console.warn(`⚠️ GitHub API 错误: ${res.status} ${res.statusText}`);
      }
      return null;
    }
    const json = await res.json();
    const decoded = Buffer.from(json.content, 'base64').toString('utf-8');
    const data = JSON.parse(decoded);
    console.log('✅ 从 GitHub 成功恢复数据');
    return data;
  } catch (e) {
    console.warn('⚠️ 从 GitHub 加载备份失败:', e.message);
    return null;
  }
}

/**
 * 保存数据到 GitHub（自动创建或更新文件）
 * @param {object} data - 要备份的数据
 * @returns {boolean} 是否成功
 */
export async function saveToGitHub(data) {
  if (!GITHUB_TOKEN) return false;
  try {
    const url = `${API_BASE}/repos/${OWNER}/${REPO}/contents/${FILE_PATH}`;

    // 第一步：获取当前文件 SHA（如果存在需要用它来更新）
    let sha;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (getRes.ok) {
      const existing = await getRes.json();
      sha = existing.sha;
    }

    // 第二步：创建或更新备份文件
    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const body = {
      message: `🔄 自动备份 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`,
      content,
      branch: BRANCH,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (putRes.ok) {
      console.log('✅ 数据已备份到 GitHub');
      return true;
    } else {
      const err = await putRes.json();
      console.warn('⚠️ GitHub 备份失败:', err.message || JSON.stringify(err));
      return false;
    }
  } catch (e) {
    console.warn('⚠️ GitHub 备份异常:', e.message);
    return false;
  }
}

/**
 * 检查 GitHub 备份是否已配置
 */
export function isBackupConfigured() {
  return !!GITHUB_TOKEN;
}
