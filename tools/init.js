#!/usr/bin/env node

/**
 * Craft Companion 初始化脚本
 * 用于创建新项目的知识库结构与首步引导
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function init() {
  console.log('=== Craft Companion 项目初始化 ===\n');

  const projectName = await question('项目名称: ');
  if (!projectName) {
    console.log('错误：项目名称不能为空');
    rl.close();
    return;
  }

  console.log('\n你现在要走哪条路？');
  console.log('1. 从零开始写新小说');
  console.log('2. 导入已有小说');
  const modeChoice = await question('请选择（1/2）: ');

  if (!['1', '2'].includes(modeChoice)) {
    console.log('错误：请输入 1 或 2');
    rl.close();
    return;
  }

  const mode = modeChoice === '1'
    ? {
        key: 'from-scratch',
        label: '从零开始',
        nextStep: '提示模板/从零开始/01-定义核心概念.md'
      }
    : {
        key: 'import-existing',
        label: '导入已有小说',
        nextStep: '提示模板/导入已有小说/01-提取人物信息.md'
      };

  const projectPath = path.join(process.cwd(), projectName);

  if (fs.existsSync(projectPath)) {
    console.log(`错误：目录 ${projectName} 已存在`);
    rl.close();
    return;
  }

  console.log(`\n将在 ${projectPath} 创建项目`);
  console.log(`模式：${mode.label}\n`);

  const dirs = [
    '知识库/00_核心上下文',
    '知识库/01_人物档案',
    '知识库/02_世界观设定',
    '知识库/03_故事进展',
    '知识库/04_写作参考',
    '工作区',
    '工作区/检查点',
    '_归档',
    '_归档/已完成章节'
  ];

  console.log('创建目录结构...');
  dirs.forEach(dir => {
    fs.mkdirSync(path.join(projectPath, dir), { recursive: true });
  });

  console.log('创建基础文件...');
  writeFile(projectPath, '知识库/00_核心上下文/当前状态.md', renderCurrentStateTemplate());
  writeFile(projectPath, '知识库/00_核心上下文/最近章节梗概.md', '# 最近章节梗概\n\n- 尚无已完成章节。\n');
  writeFile(projectPath, '知识库/00_核心上下文/伏笔追踪表_完整版.md', '# 伏笔追踪表\n\n| 伏笔 | 状态 | 埋设章节 | 预计收束 |\n|---|---|---|---|\n| （待补充） | 已埋 | - | - |\n');
  writeFile(projectPath, '知识库/04_写作参考/错题集_完整版.md', '# 错题集\n\n暂无内容。\n');
  writeFile(projectPath, 'AI入口_统一指令.md', renderAiEntry(mode));
  writeFile(projectPath, 'START_HERE.md', renderStartHere(projectName, mode));
  writeFile(projectPath, '工作区/README.md', renderWorkspaceReadme());

  console.log('复制通用模板与文档...');
  copyDir(path.join(__dirname, '..', '提示模板'), path.join(projectPath, '提示模板'));
  copyDir(path.join(__dirname, '..', 'docs'), path.join(projectPath, 'docs'));
  copyDir(path.join(__dirname), path.join(projectPath, 'tools'));

  console.log('创建 CLAUDE.md...');
  const claudeMdTemplate = fs.readFileSync(
    path.join(__dirname, '../CLAUDE.md'),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(projectPath, 'CLAUDE.md'),
    claudeMdTemplate.replace(/\{\{project_name\}\}/g, projectName)
  );

  console.log('\n✓ 项目初始化完成！\n');
  console.log('下一步：');
  console.log(`  cd ${projectName}`);
  console.log(`  打开 ${mode.nextStep}`);
  console.log('  或先阅读 START_HERE.md\n');

  rl.close();
}

function writeFile(projectPath, relativePath, content) {
  const fullPath = path.join(projectPath, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
}

function copyDir(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) return;
  fs.cpSync(sourceDir, targetDir, { recursive: true });
}

function renderStartHere(projectName, mode) {
  return `# 从这里开始

项目：${projectName}
模式：${mode.label}

## 你现在该做什么

1. 先让 AI 读取 \`CLAUDE.md\`
2. 再让 AI 读取 \`AI入口_统一指令.md\`（统一自然语言入口）
3. 然后打开：\`${mode.nextStep}\`
4. 按编号顺序完成初始化

## 工具建议（Codex / Claude Code）

1. 把当前项目目录作为工作目录
2. 第一轮只说一句：\`请按 START_HERE.md 和 AI入口_统一指令.md 带我走第一步\`
3. 不要先写正文，先完成模板初始化

## 两种使用方式

- 从零开始写新小说 → \`提示模板/从零开始/\`
- 导入已有小说 → \`提示模板/导入已有小说/\`

## 提醒

不要一上来直接写正文。先完成对应模板，再进入正式创作。
`;
}

function renderWorkspaceReadme() {
  return `# 工作区说明

- 本目录用于章节创作文件（章纲、初稿、修订稿、终版）
- 检查点目录：\`工作区/检查点/\`
- 建议命名：\`第XX章_阶段.md\`
`;
}

function renderAiEntry(mode) {
  return `# AI 统一入口指令

## 你要做的第一件事

无论用户怎么开场，先做“分流 + 阶段确认”，不要直接写正文。

## 首轮固定回复模板

\`\`\`text
你好，我在。你这次是想：
1. 从零开始写新小说
2. 导入已有小说
3. 继续当前章节流程

你回复数字即可，我按步骤带你走。
\`\`\`

## 当前项目默认入口

- 初始化模式：${mode.label}
- 当前第一步模板：\`${mode.nextStep}\`

## 自然语言意图映射（示例）

- “写下一章 / 开始第X章” → 进入阶段1（章纲）
- “我选B版 / 用版本C改一下” → 进入阶段2（初稿）
- “帮我自查 / 看看哪里有问题” → 进入阶段3（自查+评估层复核）
- “按刚才意见改” → 进入阶段4（修订）
- “可以定稿了 / 终版确认” → 进入阶段5（终版确认）

## 必须停住的节点

- 章纲给出后必须等待用户选择
- 有争议问题时必须等待用户裁决
- 终版确认前不能覆盖终版文件
`;
}

function renderCurrentStateTemplate() {
  return `# 当前状态

> 最后更新：初始化完成

## 进度接力
- **最新终版**：尚无
- **待创作**：第1章
- **当前阶段**：初始化

## 本轮上下文
- **当前目标**：完成初始化并进入稳定创作流程
- **已完成动作**：
  - 创建项目目录与知识库骨架
- **下一步动作**：
  - 读取 START_HERE.md
  - 按入口模板完成初始化

## 交接备注（给下一次会话）
- 请先读取 \`CLAUDE.md\`、\`START_HERE.md\`、\`AI入口_统一指令.md\`
- 若用户目标模糊，先分流再执行
`;
}

init().catch(console.error);
