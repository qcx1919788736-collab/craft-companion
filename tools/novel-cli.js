#!/usr/bin/env node

/**
 * Craft Companion CLI 工具
 * 管理章节创作流程、归档和知识库一致性检查
 */

const fs = require('fs');
const path = require('path');

const WORK_DIR = path.join(process.cwd(), '工作区');
const ARCHIVE_DIR = path.join(process.cwd(), '_归档', '已完成章节');
const KB_DIR = path.join(process.cwd(), '知识库');
const CORE_DIR = path.join(KB_DIR, '00_核心上下文');
const SCAFFOLD_ROOT = path.join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function newChapter(num) {
  if (!num || isNaN(num)) {
    log('错误：请提供章节编号', 'red');
    log('用法：craft-companion new-chapter <编号>', 'yellow');
    return;
  }

  if (!fs.existsSync(WORK_DIR)) fs.mkdirSync(WORK_DIR, { recursive: true });

  const files = [
    `第${num}章_章纲草案_版本A.md`,
    `第${num}章_章纲草案_版本B.md`,
    `第${num}章_章纲草案_版本C.md`
  ];

  log(`\n创建第${num}章工作文件...`, 'cyan');
  files.forEach(file => {
    const filePath = path.join(WORK_DIR, file);
    if (fs.existsSync(filePath)) {
      log(`  - ${file} 已存在，跳过`, 'yellow');
    } else {
      fs.writeFileSync(filePath, `# 第${num}章章纲草案\n\n待生成...\n`);
      log(`  + ${file}`, 'green');
    }
  });
  log('\n完成。下一步：生成章纲并选择方向。', 'green');
}

function archiveChapter(num) {
  if (!num || isNaN(num)) return log('错误：请提供章节编号', 'red');
  if (!fs.existsSync(WORK_DIR)) return log('工作区目录不存在', 'red');

  const allFiles = fs.readdirSync(WORK_DIR);
  const chapterFiles = allFiles.filter(f => f.startsWith(`第${num}章_`));
  if (chapterFiles.length === 0) return log(`未找到第${num}章的文件`, 'yellow');

  const archiveDir = path.join(ARCHIVE_DIR, `第${num}章`);
  fs.mkdirSync(archiveDir, { recursive: true });

  chapterFiles.forEach(file => {
    if (file.includes('终版')) {
      log(`  保留 ${file}`, 'blue');
    } else {
      fs.renameSync(path.join(WORK_DIR, file), path.join(archiveDir, file));
      log(`  归档 ${file}`, 'green');
    }
  });
}

function check() {
  log('\n检查知识库一致性...\n', 'cyan');
  let issues = 0;

  const corePath = CORE_DIR;
  if (!fs.existsSync(corePath)) {
    log('  [缺失] 知识库/00_核心上下文/', 'red');
    issues++;
  } else {
    ['当前状态.md'].forEach(f => {
      if (fs.existsSync(path.join(corePath, f))) log(`  [OK] 00_核心上下文/${f}`, 'green');
      else {
        log(`  [缺失] 00_核心上下文/${f}`, 'red');
        issues++;
      }
    });
  }

  const refPath = path.join(KB_DIR, '04_写作参考', '错题集_完整版.md');
  if (fs.existsSync(refPath)) log('  [OK] 04_写作参考/错题集_完整版.md', 'green');
  else log('  [可选] 04_写作参考/错题集_完整版.md', 'yellow');

  log(issues === 0 ? '\n知识库状态良好' : `\n发现 ${issues} 个问题，请补齐缺失文件`, issues === 0 ? 'green' : 'red');
}

function bootstrapEntry() {
  log('\n补齐统一入口文件...\n', 'cyan');

  // 为旧项目补齐基础模板和指引文件
  ensureFromScaffold('提示模板', true);
  ensureFromScaffold('docs', true);
  ensureClaudeTemplate();

  const filesToEnsure = [
    {
      file: 'START_HERE.md',
      content: renderStartHere()
    },
    {
      file: 'AI入口_统一指令.md',
      content: renderAiEntry()
    },
    {
      file: path.join('知识库', '00_核心上下文', '当前状态.md'),
      content: renderCurrentState()
    },
    {
      file: path.join('知识库', '00_核心上下文', '最近章节梗概.md'),
      content: '# 最近章节梗概\n\n- 尚无已完成章节。\n'
    },
    {
      file: path.join('知识库', '00_核心上下文', '伏笔追踪表_完整版.md'),
      content: '# 伏笔追踪表\n\n| 伏笔 | 状态 | 埋设章节 | 预计收束 |\n|---|---|---|---|\n| （待补充） | 已埋 | - | - |\n'
    },
    {
      file: path.join('知识库', '04_写作参考', '错题集_完整版.md'),
      content: '# 错题集\n\n暂无内容。\n'
    }
  ];

  fs.mkdirSync(CORE_DIR, { recursive: true });
  fs.mkdirSync(path.join(WORK_DIR, '检查点'), { recursive: true });

  let created = 0;
  let upgraded = 0;

  filesToEnsure.forEach(({ file, content }) => {
    const filePath = path.join(process.cwd(), file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf-8');
      log(`  + 新建 ${file}`, 'green');
      created++;
      return;
    }

    if (file.endsWith('当前状态.md')) {
      const oldContent = fs.readFileSync(filePath, 'utf-8');
      const shouldUpgrade = oldContent.includes('初始化中') || oldContent.trim().length < 30;
      if (shouldUpgrade) {
        fs.writeFileSync(filePath, content, 'utf-8');
        log(`  ~ 升级 ${file}（接力格式）`, 'yellow');
        upgraded++;
      } else {
        log(`  = 保留 ${file}`, 'blue');
      }
      return;
    }

    log(`  = 保留 ${file}`, 'blue');
  });

  log(`\n完成：新建 ${created} 个，升级 ${upgraded} 个。`, 'green');
  log('建议下一步：让 AI 先读取 START_HERE.md 与 AI入口_统一指令.md。', 'cyan');
}

function ensureFromScaffold(relativePath, recursive = false) {
  const source = path.join(SCAFFOLD_ROOT, relativePath);
  const target = path.join(process.cwd(), relativePath);
  if (fs.existsSync(target) || !fs.existsSync(source)) return;

  if (recursive) {
    fs.cpSync(source, target, { recursive: true });
    log(`  + 补齐 ${relativePath}/`, 'green');
    return;
  }

  fs.copyFileSync(source, target);
  log(`  + 补齐 ${relativePath}`, 'green');
}

function ensureClaudeTemplate() {
  const target = path.join(process.cwd(), 'CLAUDE.md');
  if (fs.existsSync(target)) return;

  const source = path.join(SCAFFOLD_ROOT, 'CLAUDE.md');
  if (!fs.existsSync(source)) return;

  const projectName = path.basename(process.cwd());
  const content = fs.readFileSync(source, 'utf-8').replace(/\{\{project_name\}\}/g, projectName);
  fs.writeFileSync(target, content, 'utf-8');
  log('  + 补齐 CLAUDE.md', 'green');
}

function doctor() {
  log('\n运行项目健康检查（doctor）...\n', 'cyan');

  const checks = [
    { label: 'CLAUDE.md', path: 'CLAUDE.md', required: true },
    { label: 'START_HERE.md', path: 'START_HERE.md', required: true },
    { label: 'AI入口_统一指令.md', path: 'AI入口_统一指令.md', required: true },
    { label: '提示模板/从零开始', path: path.join('提示模板', '从零开始'), required: true },
    { label: '提示模板/导入已有小说', path: path.join('提示模板', '导入已有小说'), required: true },
    { label: '提示模板/通用流程', path: path.join('提示模板', '通用流程'), required: true },
    { label: '知识库/00_核心上下文/当前状态.md', path: path.join('知识库', '00_核心上下文', '当前状态.md'), required: true },
    { label: '知识库/04_写作参考/错题集_完整版.md', path: path.join('知识库', '04_写作参考', '错题集_完整版.md'), required: true },
    { label: '工作区', path: '工作区', required: true },
    { label: '工作区/检查点', path: path.join('工作区', '检查点'), required: true }
  ];

  let passed = 0;
  let failed = 0;

  checks.forEach((item) => {
    const fullPath = path.join(process.cwd(), item.path);
    const exists = fs.existsSync(fullPath);
    if (exists) {
      log(`  [OK] ${item.label}`, 'green');
      passed++;
    } else {
      log(`  [缺失] ${item.label}`, item.required ? 'red' : 'yellow');
      failed += item.required ? 1 : 0;
    }
  });

  const startHerePath = path.join(process.cwd(), 'START_HERE.md');
  if (fs.existsSync(startHerePath)) {
    const content = fs.readFileSync(startHerePath, 'utf-8');
    if (content.includes('AI入口_统一指令.md')) {
      log('  [OK] START_HERE.md 已关联 AI 统一入口', 'green');
      passed++;
    } else {
      log('  [建议] START_HERE.md 尚未关联 AI 统一入口', 'yellow');
    }
  }

  const statePath = path.join(process.cwd(), '知识库', '00_核心上下文', '当前状态.md');
  if (fs.existsSync(statePath)) {
    const content = fs.readFileSync(statePath, 'utf-8');
    if (content.includes('进度接力')) {
      log('  [OK] 当前状态为可接力格式', 'green');
      passed++;
    } else {
      log('  [建议] 当前状态建议升级为“进度接力”格式', 'yellow');
    }
  }

  log('\n检查汇总：', 'blue');
  log(`  通过项: ${passed}`, 'green');
  if (failed > 0) {
    log(`  失败项: ${failed}`, 'red');
    log('\n项目未完全就绪。建议先执行：craft-companion bootstrap-entry', 'yellow');
    return;
  }

  log('  失败项: 0', 'green');
  log('\n项目已满足“可引导、可接力、可检查”的最小运行条件。', 'green');
}

function updateKb(num) {
  if (!num || isNaN(num)) return log('错误：请提供章节编号', 'red');
  log(`\n第${num}章终版后建议更新：\n`, 'cyan');
  log('  [ ] 00_核心上下文/当前状态.md', 'yellow');
  log('  [ ] 00_核心上下文/伏笔追踪表_完整版.md', 'yellow');
  log('  [ ] 01_人物档案/', 'yellow');
  log('  [ ] 04_写作参考/错题集_完整版.md', 'yellow');
}

function showHelp() {
  log('\nCraft Companion CLI\n', 'cyan');
  log('用法：node tools/novel-cli.js <命令> [参数]\n', 'blue');
  log('命令：', 'blue');
  log('  new-chapter <编号>    创建新章节工作文件', 'green');
  log('  archive <编号>        归档已完成章节', 'green');
  log('  update-kb <编号>      显示知识库更新清单', 'green');
  log('  check                 检查知识库一致性', 'green');
  log('  bootstrap-entry       补齐统一入口与基础骨架（不改正文）', 'green');
  log('  doctor                健康检查（入口/模板/接力/检查点）', 'green');
  log('  help                  显示帮助\n', 'green');
}

function renderStartHere() {
  return `# 从这里开始

## 你现在该做什么

1. 先让 AI 读取 \`CLAUDE.md\`
2. 再让 AI 读取 \`AI入口_统一指令.md\`
3. 根据你的情况选择入口：
   - 从零开始：\`提示模板/从零开始/01-定义核心概念.md\`
   - 导入已有：\`提示模板/导入已有小说/01-提取人物信息.md\`

## 首轮建议消息

\`\`\`text
请先读取 CLAUDE.md 和 AI入口_统一指令.md，然后带我完成第一步，不要提前写正文。
\`\`\`
`;
}

function renderAiEntry() {
  return `# AI 统一入口指令

## 首轮固定动作

先分流，再执行。不要跳过分流直接写正文。

## 分流提问模板

\`\`\`text
你这次是想：
1. 从零开始写新小说
2. 导入已有小说
3. 继续当前章节流程
\`\`\`

## 自然语言意图映射

- “写下一章 / 创作第X章” → 阶段1 章纲
- “我选B / 按C来” → 阶段2 初稿
- “帮我自查 / 复核一下” → 阶段3 自查（执行层+评估层）
- “按意见修改” → 阶段4 修订
- “确认终版” → 阶段5 终版确认
`;
}

function renderCurrentState() {
  return `# 当前状态

> 最后更新：入口补齐完成

## 进度接力
- **最新终版**：待填写
- **待创作**：待填写
- **当前阶段**：待识别

## 本轮上下文
- **当前目标**：完成分流并进入正确阶段
- **下一步动作**：
  - 读取 START_HERE.md
  - 读取 AI入口_统一指令.md

## 交接备注
- 会话中断后，先读本文件再继续
`;
}

const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

switch (command) {
  case 'new-chapter': newChapter(param); break;
  case 'archive': archiveChapter(param); break;
  case 'update-kb': updateKb(param); break;
  case 'check': check(); break;
  case 'bootstrap-entry': bootstrapEntry(); break;
  case 'doctor': doctor(); break;
  case 'help': case undefined: showHelp(); break;
  default:
    log(`未知命令：${command}`, 'red');
    showHelp();
}
