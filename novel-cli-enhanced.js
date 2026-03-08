#!/usr/bin/env node

/**
 * 小说创作自动化CLI工具 - 增强版
 * 新增功能：
 * 1. Git 自动化管理
 * 2. 自动质量检查
 * 3. 进度追踪
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORK_DIR = path.join(__dirname, '工作区');
const ARCHIVE_DIR = path.join(__dirname, '_归档', '已完成章节');
const KB_DIR = path.join(__dirname, '知识库');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============ Git 自动化功能 ============

function gitExec(command, silent = false) {
  try {
    const result = execSync(command, { 
      cwd: __dirname,
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function gitAutoCommit(stage, chapterNum, message = '') {
  log(`\n📝 Git 自动提交...`, 'cyan');
  
  // 检查是否是 git 仓库
  const isGitRepo = gitExec('git rev-parse --git-dir', true);
  if (!isGitRepo.success) {
    log('  ⚠ 不是 Git 仓库，跳过提交', 'yellow');
    log('  提示：运行 git init 初始化仓库', 'blue');
    return;
  }

  // 添加所有更改
  gitExec('git add .');

  // 检查是否有更改
  const status = gitExec('git status --porcelain', true);
  if (!status.output || status.output.trim() === '') {
    log('  ℹ 没有需要提交的更改', 'blue');
    return;
  }

  // 生成提交信息
  const stageNames = {
    'outline': '章纲',
    'draft': '初稿',
    'revision': '修订稿',
    'final': '终版'
  };
  const stageName = stageNames[stage] || stage;
  const commitMsg = message || `第${chapterNum}章 - ${stageName}完成`;

  // 提交
  const commit = gitExec(`git commit -m "${commitMsg}"`, true);
  if (commit.success) {
    log(`  ✓ 提交成功: ${commitMsg}`, 'green');
    
    // 如果是终版，打 tag
    if (stage === 'final') {
      const tag = `v1.0-chapter-${chapterNum}`;
      const tagResult = gitExec(`git tag ${tag}`, true);
      if (tagResult.success) {
        log(`  ✓ 创建标签: ${tag}`, 'green');
      }
    }
  } else {
    log(`  ✗ 提交失败: ${commit.error}`, 'red');
  }
}

function gitHistory(chapterNum) {
  log(`\n📜 第${chapterNum}章 Git 历史...`, 'cyan');
  
  const isGitRepo = gitExec('git rev-parse --git-dir', true);
  if (!isGitRepo.success) {
    log('  ⚠ 不是 Git 仓库', 'yellow');
    return;
  }

  // 查找相关提交
  const logCmd = `git log --oneline --grep="第${chapterNum}章" --all`;
  const result = gitExec(logCmd, true);
  
  if (result.success && result.output) {
    log('\n提交历史：', 'blue');
    console.log(result.output);
  } else {
    log('  ℹ 未找到相关提交', 'blue');
  }

  // 查找相关标签
  const tagCmd = `git tag -l "*chapter-${chapterNum}"`;
  const tagResult = gitExec(tagCmd, true);
  
  if (tagResult.success && tagResult.output) {
    log('\n标签：', 'blue');
    console.log(tagResult.output);
  }
}

function gitRevert(commitOrTag) {
  log(`\n⏮️  回退到: ${commitOrTag}...`, 'cyan');
  
  const isGitRepo = gitExec('git rev-parse --git-dir', true);
  if (!isGitRepo.success) {
    log('  ⚠ 不是 Git 仓库', 'yellow');
    return;
  }

  // 检查工作区是否干净
  const status = gitExec('git status --porcelain', true);
  if (status.output && status.output.trim() !== '') {
    log('  ⚠ 工作区有未提交的更改，请先提交或暂存', 'yellow');
    return;
  }

  // 回退
  const result = gitExec(`git checkout ${commitOrTag}`);
  if (result.success) {
    log(`  ✓ 成功回退到 ${commitOrTag}`, 'green');
  } else {
    log(`  ✗ 回退失败`, 'red');
  }
}

// ============ 自动质量检查功能 ============

function autoQualityCheck(chapterNum, filePath) {
  log(`\n🔍 自动质量检查（第${chapterNum}章）...`, 'cyan');
  
  if (!fs.existsSync(filePath)) {
    log(`  ✗ 文件不存在: ${filePath}`, 'red');
    return { passed: false, issues: [] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  // 检查1：字数统计
  const wordCount = content.replace(/[^\u4e00-\u9fa5]/g, '').length;
  log(`  📊 字数: ${wordCount}`, 'blue');
  
  if (wordCount < 2000) {
    issues.push({ type: 'warning', message: `字数偏少（${wordCount}字），建议至少2000字` });
  }

  // 检查2：人物名称一致性（基于知识库）
  const characterNames = ['秦力', '赵明', '发林', '李垣', '张坤', '江雪', '张弛'];
  const typos = {
    '秦利': '秦力',
    '赵铭': '赵明',
    '发琳': '发林',
    '李源': '李垣'
  };

  Object.keys(typos).forEach(typo => {
    if (content.includes(typo)) {
      issues.push({ 
        type: 'error', 
        message: `发现错别字: "${typo}" 应为 "${typos[typo]}"` 
      });
    }
  });

  // 检查3：常见文风问题
  const styleIssues = [
    { pattern: /他感到|她感到|他觉得|她觉得/g, message: '避免直白情绪词，用动作细节表现' },
    { pattern: /非常|很|十分|极其/g, message: '减少程度副词，用具体描写' },
    { pattern: /突然|忽然/g, message: '减少"突然"，让情节自然推进' }
  ];

  styleIssues.forEach(({ pattern, message }) => {
    const matches = content.match(pattern);
    if (matches && matches.length > 5) {
      issues.push({ 
        type: 'warning', 
        message: `${message}（出现${matches.length}次）` 
      });
    }
  });

  // 检查4：对话标点
  const dialogueIssues = content.match(/[""]\s*[，。！？]/g);
  if (dialogueIssues && dialogueIssues.length > 0) {
    issues.push({ 
      type: 'warning', 
      message: `对话标点可能有误（${dialogueIssues.length}处）` 
    });
  }

  // 输出检查结果
  log('\n检查结果：', 'blue');
  
  if (issues.length === 0) {
    log('  ✓ 未发现明显问题', 'green');
    return { passed: true, issues: [] };
  }

  issues.forEach(issue => {
    const icon = issue.type === 'error' ? '✗' : '⚠';
    const color = issue.type === 'error' ? 'red' : 'yellow';
    log(`  ${icon} ${issue.message}`, color);
  });

  const hasErrors = issues.some(i => i.type === 'error');
  if (hasErrors) {
    log('\n✗ 发现严重问题，建议修正后再保存', 'red');
  } else {
    log('\n⚠ 发现一些建议，可以考虑优化', 'yellow');
  }

  return { passed: !hasErrors, issues };
}

// ============ 进度追踪功能 ============

function trackProgress() {
  log(`\n📈 创作进度追踪...`, 'cyan');
  
  // 扫描工作区文件
  const workFiles = fs.readdirSync(WORK_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');
  
  // 按章节分组
  const chapters = {};
  workFiles.forEach(file => {
    const match = file.match(/^第(\d+)章_(.+)\.md$/);
    if (match) {
      const chapterNum = parseInt(match[1]);
      const stage = match[2];
      
      if (!chapters[chapterNum]) {
        chapters[chapterNum] = { stages: [], files: [] };
      }
      
      chapters[chapterNum].stages.push(stage);
      chapters[chapterNum].files.push(file);
    }
  });

  // 判断章节状态
  const getChapterStatus = (stages) => {
    if (stages.includes('终版')) return { status: '✅ 已完成', color: 'green', priority: 4 };
    if (stages.some(s => s.startsWith('修订稿'))) return { status: '🔄 修订中', color: 'yellow', priority: 3 };
    if (stages.includes('初稿')) return { status: '📝 初稿完成', color: 'blue', priority: 2 };
    if (stages.includes('选定章纲')) return { status: '📋 章纲确定', color: 'cyan', priority: 1 };
    if (stages.some(s => s.startsWith('章纲草案'))) return { status: '💡 章纲草案', color: 'magenta', priority: 0 };
    return { status: '❓ 未知状态', color: 'reset', priority: -1 };
  };

  // 统计
  const chapterNums = Object.keys(chapters).map(Number).sort((a, b) => a - b);
  const stats = {
    total: chapterNums.length,
    completed: 0,
    inProgress: 0,
    draft: 0
  };

  log('\n章节状态：', 'blue');
  log('─'.repeat(60), 'blue');
  
  chapterNums.forEach(num => {
    const { stages } = chapters[num];
    const { status, color } = getChapterStatus(stages);
    
    log(`  第${num}章: ${status}`, color);
    
    if (status.includes('已完成')) stats.completed++;
    else if (status.includes('修订') || status.includes('初稿')) stats.inProgress++;
    else if (status.includes('章纲')) stats.draft++;
  });

  log('─'.repeat(60), 'blue');
  log(`\n📊 统计：`, 'blue');
  log(`  总章节数: ${stats.total}`, 'cyan');
  log(`  已完成: ${stats.completed}`, 'green');
  log(`  创作中: ${stats.inProgress}`, 'yellow');
  log(`  草案阶段: ${stats.draft}`, 'magenta');
  
  if (stats.total > 0) {
    const progress = ((stats.completed / stats.total) * 100).toFixed(1);
    log(`  完成度: ${progress}%`, 'cyan');
  }

  return { chapters, stats };
}

function exportProgressToFeishu() {
  log(`\n📤 导出进度到飞书...`, 'cyan');
  
  const { chapters, stats } = trackProgress();
  
  // 生成 JSON 数据（可以被 MCP 工具读取）
  const progressData = {
    timestamp: new Date().toISOString(),
    stats,
    chapters: Object.keys(chapters).map(num => {
      const { stages } = chapters[parseInt(num)];
      const getChapterStatus = (stages) => {
        if (stages.includes('终版')) return '已完成';
        if (stages.some(s => s.startsWith('修订稿'))) return '修订中';
        if (stages.includes('初稿')) return '初稿完成';
        if (stages.includes('选定章纲')) return '章纲确定';
        if (stages.some(s => s.startsWith('章纲草案'))) return '章纲草案';
        return '未知';
      };
      
      return {
        chapter: parseInt(num),
        status: getChapterStatus(stages),
        stages: stages.length,
        files: chapters[parseInt(num)].files
      };
    })
  };

  const outputPath = path.join(__dirname, 'data', 'progress.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(progressData, null, 2));
  
  log(`  ✓ 进度数据已保存: ${outputPath}`, 'green');
  log(`  ℹ 可以使用 MCP 工具读取此文件并同步到飞书`, 'blue');
  
  return progressData;
}

// ============ 原有功能（保持兼容）============

function newChapter(chapterNum) {
  if (!chapterNum || isNaN(chapterNum)) {
    log('错误：请提供有效的章节编号', 'red');
    return;
  }

  const files = [
    `第${chapterNum}章_章纲草案_版本A.md`,
    `第${chapterNum}章_章纲草案_版本B.md`,
    `第${chapterNum}章_章纲草案_版本C.md`
  ];

  log(`\n创建第${chapterNum}章工作文件...`, 'cyan');

  files.forEach(file => {
    const filePath = path.join(WORK_DIR, file);
    if (fs.existsSync(filePath)) {
      log(`  ⚠ ${file} 已存在，跳过`, 'yellow');
    } else {
      fs.writeFileSync(filePath, `# 第${chapterNum}章章纲草案\n\n待AI生成...\n`);
      log(`  ✓ 创建 ${file}`, 'green');
    }
  });

  log(`\n✓ 第${chapterNum}章工作文件创建完成`, 'green');
  
  // 自动 Git 提交
  gitAutoCommit('outline', chapterNum, `第${chapterNum}章 - 创建章纲草案文件`);
}

function archiveChapter(chapterNum) {
  if (!chapterNum || isNaN(chapterNum)) {
    log('错误：请提供有效的章节编号', 'red');
    return;
  }

  log(`\n归档第${chapterNum}章...`, 'cyan');

  const allFiles = fs.readdirSync(WORK_DIR);
  const chapterFiles = allFiles.filter(f => f.startsWith(`第${chapterNum}章_`));

  if (chapterFiles.length === 0) {
    log(`  ⚠ 未找到第${chapterNum}章的文件`, 'yellow');
    return;
  }

  const chapterArchiveDir = path.join(ARCHIVE_DIR, `第${chapterNum}章`);
  if (!fs.existsSync(chapterArchiveDir)) {
    fs.mkdirSync(chapterArchiveDir, { recursive: true });
  }

  let archivedCount = 0;
  let keptCount = 0;

  chapterFiles.forEach(file => {
    const shouldKeep = file.includes('终版') || file.includes('选定章纲');

    if (shouldKeep) {
      log(`  → 保留 ${file}`, 'blue');
      keptCount++;
    } else {
      const srcPath = path.join(WORK_DIR, file);
      const destPath = path.join(chapterArchiveDir, file);
      fs.renameSync(srcPath, destPath);
      log(`  ✓ 归档 ${file}`, 'green');
      archivedCount++;
    }
  });

  log(`\n✓ 归档完成：${archivedCount} 个文件已归档，${keptCount} 个文件保留在工作区`, 'green');
  
  // 自动 Git 提交
  gitAutoCommit('archive', chapterNum, `第${chapterNum}章 - 归档完成`);
}

// ============ 命令行接口 ============

function showHelp() {
  log('\n小说创作自动化CLI工具 - 增强版', 'cyan');
  log('\n🆕 新功能：', 'magenta');
  log('  • Git 自动化管理', 'green');
  log('  • 自动质量检查', 'green');
  log('  • 进度追踪和导出', 'green');
  
  log('\n用法：', 'blue');
  log('  node novel-cli-enhanced.js <命令> [参数]', 'yellow');
  
  log('\n📝 创作命令：', 'blue');
  log('  new-chapter <N>           创建第N章工作文件', 'green');
  log('  archive <N>               归档第N章', 'green');
  log('  check-quality <N> <file>  质量检查', 'green');
  
  log('\n📊 进度命令：', 'blue');
  log('  progress                  查看创作进度', 'green');
  log('  export-progress           导出进度到飞书', 'green');
  
  log('\n🔧 Git 命令：', 'blue');
  log('  git-commit <stage> <N>    手动提交（stage: outline/draft/revision/final）', 'green');
  log('  git-history <N>           查看第N章Git历史', 'green');
  log('  git-revert <commit>       回退到指定提交', 'green');
  
  log('\n示例：', 'blue');
  log('  node novel-cli-enhanced.js new-chapter 22', 'yellow');
  log('  node novel-cli-enhanced.js check-quality 22 工作区/第22章_初稿.md', 'yellow');
  log('  node novel-cli-enhanced.js progress', 'yellow');
  log('  node novel-cli-enhanced.js git-history 22', 'yellow');
  log('');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'new-chapter':
      newChapter(args[1]);
      break;
    case 'archive':
      archiveChapter(args[1]);
      break;
    case 'check-quality':
      autoQualityCheck(args[1], args[2]);
      break;
    case 'progress':
      trackProgress();
      break;
    case 'export-progress':
      exportProgressToFeishu();
      break;
    case 'git-commit':
      gitAutoCommit(args[1], args[2], args[3]);
      break;
    case 'git-history':
      gitHistory(args[1]);
      break;
    case 'git-revert':
      gitRevert(args[1]);
      break;
    case 'help':
    case undefined:
      showHelp();
      break;
    default:
      log(`未知命令：${command}`, 'red');
      showHelp();
  }
}

main();
