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

  const corePath = path.join(KB_DIR, '00_核心上下文');
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
  log('  help                  显示帮助\n', 'green');
}

const args = process.argv.slice(2);
const command = args[0];
const param = args[1];

switch (command) {
  case 'new-chapter': newChapter(param); break;
  case 'archive': archiveChapter(param); break;
  case 'update-kb': updateKb(param); break;
  case 'check': check(); break;
  case 'help': case undefined: showHelp(); break;
  default:
    log(`未知命令：${command}`, 'red');
    showHelp();
}
