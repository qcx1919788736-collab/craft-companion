#!/usr/bin/env node

/**
 * 知识库全自动更新系统 v2.0
 * 
 * 功能：
 * 1. 智能提取章节信息（时间、人物、伏笔、梗概）
 * 2. 自动生成更新内容
 * 3. 通过 MCP 工具自动写入知识库
 * 4. 生成详细更新日志
 * 5. 支持一键回滚
 * 
 * 使用方法：
 * node kb-auto-update-v2.js <章节号> <章节文件路径> [--auto]
 * 
 * 示例：
 * node kb-auto-update-v2.js 22 工作区/第22章_终版.md --auto
 */

const fs = require('fs').promises;
const path = require('path');

// 配置
const KB_BASE = path.resolve(__dirname, '知识库');
const UPDATE_LOG_DIR = path.resolve(__dirname, '.kb-update-logs');
const BACKUP_DIR = path.resolve(__dirname, '.kb-backups');

// 人物列表
const CHARACTERS = ['秦力', '赵明', '发林', '李垣', '张坤', '江雪', '张弛'];

class AutoUpdater {
  constructor(chapterNumber, chapterFilePath, autoMode = false) {
    this.chapterNumber = chapterNumber;
    this.chapterFilePath = chapterFilePath;
    this.autoMode = autoMode;
    this.updates = [];
    this.backups = [];
  }

  /**
   * 执行自动更新
   */
  async run() {
    console.log(`\n🚀 知识库全自动更新系统 v2.0`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`章节: 第${this.chapterNumber}章`);
    console.log(`文件: ${this.chapterFilePath}`);
    console.log(`模式: ${this.autoMode ? '自动' : '预览'}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    try {
      // 1. 读取章节内容
      const content = await fs.readFile(this.chapterFilePath, 'utf-8');
      
      // 2. 智能提取信息
      console.log(`📊 智能提取章节信息...\n`);
      const extracted = await this.extractInfo(content);
      
      // 3. 生成更新内容
      console.log(`\n🔄 生成更新内容...\n`);
      const updates = await this.generateUpdates(extracted);
      
      // 4. 如果是自动模式，执行更新
      if (this.autoMode) {
        console.log(`\n✍️  执行自动更新...\n`);
        await this.executeUpdates(updates);
        
        // 5. 生成更新日志
        await this.saveLog(extracted, updates);
        
        console.log(`\n✅ 自动更新完成！`);
        console.log(`   已更新 ${this.updates.length} 个文件`);
        console.log(`   更新日志: ${UPDATE_LOG_DIR}/chapter-${this.chapterNumber}_auto.json\n`);
        
      } else {
        // 预览模式，只显示将要做的更新
        console.log(`\n📋 预览模式 - 将要执行的更新：\n`);
        this.displayPreview(updates);
        console.log(`\n💡 提示: 添加 --auto 参数执行自动更新\n`);
      }
      
    } catch (error) {
      console.error(`\n❌ 错误: ${error.message}`);
      console.error(error.stack);
      
      // 如果出错且已经有更新，尝试回滚
      if (this.updates.length > 0) {
        console.log(`\n🔄 尝试回滚...\n`);
        await this.rollback();
      }
      
      process.exit(1);
    }
  }

  /**
   * 智能提取章节信息
   */
  async extractInfo(content) {
    const info = {
      wordCount: content.length,
      characters: {},
      timeInfo: null,
      plotPoints: [],
      summary: '',
      keyScenes: []
    };

    // 1. 统计人物出现次数
    for (const char of CHARACTERS) {
      const count = (content.match(new RegExp(char, 'g')) || []).length;
      if (count > 0) {
        info.characters[char] = count;
      }
    }

    // 2. 提取时间信息
    info.timeInfo = this.extractTimeInfo(content);

    // 3. 提取伏笔（简化版：查找疑问句和关键词）
    info.plotPoints = this.extractPlotPoints(content);

    // 4. 生成章节梗概（取前200字 + 关键场景）
    info.summary = this.generateSummary(content);

    // 5. 识别关键场景
    info.keyScenes = this.extractKeyScenes(content);

    console.log(`✓ 提取完成`);
    console.log(`  - 字数: ${info.wordCount}`);
    console.log(`  - 出场人物: ${Object.keys(info.characters).length} 个`);
    console.log(`  - 时间信息: ${info.timeInfo || '未检测到'}`);
    console.log(`  - 潜在伏笔: ${info.plotPoints.length} 个`);
    console.log(`  - 关键场景: ${info.keyScenes.length} 个`);

    return info;
  }

  /**
   * 提取时间信息
   */
  extractTimeInfo(content) {
    // 查找时间关键词
    const timePatterns = [
      /大年初(\d+)/,
      /(\d+)天后/,
      /(\d+)小时后/,
      /第二天/,
      /次日/,
      /当天/
    ];

    for (const pattern of timePatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return null;
  }

  /**
   * 提取伏笔
   */
  extractPlotPoints(content) {
    const plots = [];
    
    // 查找疑问句
    const sentences = content.split(/[。！？]/);
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 10 && trimmed.length < 100) {
        // 包含疑问词或悬念词
        if (trimmed.includes('为什么') || 
            trimmed.includes('怎么') || 
            trimmed.includes('难道') ||
            trimmed.includes('会不会') ||
            trimmed.includes('是否')) {
          plots.push(trimmed);
        }
      }
    }

    return plots.slice(0, 5); // 最多5个
  }

  /**
   * 生成章节梗概
   */
  generateSummary(content) {
    // 简化版：取前300字，去掉对话
    const lines = content.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith('"') && 
             !trimmed.startsWith('"') &&
             !trimmed.startsWith('「');
    });

    let summary = lines.slice(0, 10).join(' ').substring(0, 300);
    
    // 添加省略号
    if (summary.length >= 300) {
      summary += '...';
    }

    return summary;
  }

  /**
   * 提取关键场景
   */
  extractKeyScenes(content) {
    const scenes = [];
    
    // 查找场景标记（简化版：查找地点词）
    const locationKeywords = ['家中', '学校', '医院', '街道', '公园', '实验室', '办公室'];
    
    for (const keyword of locationKeywords) {
      if (content.includes(keyword)) {
        scenes.push(keyword);
      }
    }

    return scenes;
  }

  /**
   * 生成更新内容
   */
  async generateUpdates(extracted) {
    const updates = [];

    // 1. 更新当前状态.md
    updates.push({
      file: '00_核心上下文/当前状态.md',
      section: '## 当前时间点',
      content: this.generateTimeUpdate(extracted),
      reason: '更新时间点和人物状态'
    });

    // 2. 更新最近章节梗概
    updates.push({
      file: '00_核心上下文/最近章节梗概（第20-24章）.md',
      section: `## 第${this.chapterNumber}章`,
      content: this.generateChapterSummary(extracted),
      reason: '添加本章梗概'
    });

    // 3. 更新伏笔追踪表（如果有新伏笔）
    if (extracted.plotPoints.length > 0) {
      updates.push({
        file: '00_核心上下文/伏笔追踪表_完整版.md',
        section: '## 待揭示伏笔',
        content: this.generatePlotUpdate(extracted),
        reason: '添加新埋伏笔'
      });
    }

    // 4. 更新主要人物档案（出现次数最多的前3个）
    const topCharacters = Object.entries(extracted.characters)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    for (const [char, count] of topCharacters) {
      updates.push({
        file: `01_人物档案/${char}_完整档案.md`,
        section: '## 当前状态',
        content: this.generateCharacterUpdate(char, extracted),
        reason: `本章出现 ${count} 次，更新状态`
      });
    }

    return updates;
  }

  /**
   * 生成时间更新内容
   */
  generateTimeUpdate(extracted) {
    let content = `\n**时间**: ${extracted.timeInfo || '待补充'}\n\n`;
    content += `**主要人物位置和状态**:\n\n`;
    
    for (const [char, count] of Object.entries(extracted.characters).slice(0, 5)) {
      content += `- ${char}: 【待补充具体状态】（本章出现 ${count} 次）\n`;
    }
    
    content += `\n**最后更新**: 第${this.chapterNumber}章\n`;
    
    return content;
  }

  /**
   * 生成章节梗概
   */
  generateChapterSummary(extracted) {
    let content = `\n**字数**: ${extracted.wordCount}\n\n`;
    content += `**主要人物**: ${Object.keys(extracted.characters).join('、')}\n\n`;
    
    if (extracted.keyScenes.length > 0) {
      content += `**关键场景**: ${extracted.keyScenes.join('、')}\n\n`;
    }
    
    content += `**梗概**: ${extracted.summary}\n`;
    
    return content;
  }

  /**
   * 生成伏笔更新
   */
  generatePlotUpdate(extracted) {
    let content = `\n### 第${this.chapterNumber}章新增伏笔\n\n`;
    
    for (let i = 0; i < extracted.plotPoints.length; i++) {
      content += `${i + 1}. ${extracted.plotPoints[i]}\n`;
      content += `   - 状态: 待揭示\n`;
      content += `   - 埋设章节: 第${this.chapterNumber}章\n\n`;
    }
    
    return content;
  }

  /**
   * 生成人物更新
   */
  generateCharacterUpdate(char, extracted) {
    let content = `\n**第${this.chapterNumber}章状态**: 【待补充具体状态】\n\n`;
    content += `**关键场景**:\n`;
    content += `- 第${this.chapterNumber}章: 【待补充场景描述】\n\n`;
    content += `**最后更新**: 第${this.chapterNumber}章\n`;
    
    return content;
  }

  /**
   * 执行更新
   */
  async executeUpdates(updates) {
    for (const update of updates) {
      try {
        const filePath = path.join(KB_BASE, update.file);
        
        // 备份原文件
        await this.backupFile(filePath, update.file);
        
        // 读取原文件
        let originalContent = '';
        try {
          originalContent = await fs.readFile(filePath, 'utf-8');
        } catch (error) {
          // 文件不存在，创建新文件
          originalContent = `# ${path.basename(update.file, '.md')}\n\n`;
        }
        
        // 查找并更新部分
        let updatedContent = originalContent;
        
        if (originalContent.includes(update.section)) {
          // 部分存在，更新它
          updatedContent = this.updateSection(originalContent, update.section, update.content);
        } else {
          // 部分不存在，追加到末尾
          updatedContent = originalContent + `\n${update.section}\n${update.content}\n`;
        }
        
        // 写入文件
        await fs.writeFile(filePath, updatedContent, 'utf-8');
        
        this.updates.push({
          file: update.file,
          reason: update.reason,
          success: true
        });
        
        console.log(`✓ 已更新: ${update.file}`);
        
      } catch (error) {
        console.error(`✗ 更新失败: ${update.file} - ${error.message}`);
        
        this.updates.push({
          file: update.file,
          reason: update.reason,
          success: false,
          error: error.message
        });
      }
    }
  }

  /**
   * 更新文件中的特定部分
   */
  updateSection(content, sectionMarker, newContent) {
    const lines = content.split('\n');
    const sectionIndex = lines.findIndex(line => line.trim() === sectionMarker);
    
    if (sectionIndex === -1) {
      // 部分不存在，追加到末尾
      return content + `\n${sectionMarker}\n${newContent}\n`;
    }
    
    // 找到下一个同级或更高级标题
    const sectionLevel = (sectionMarker.match(/^#+/) || [''])[0].length;
    let endIndex = lines.length;
    
    for (let i = sectionIndex + 1; i < lines.length; i++) {
      const match = lines[i].match(/^#+/);
      if (match && match[0].length <= sectionLevel) {
        endIndex = i;
        break;
      }
    }
    
    // 替换内容
    const before = lines.slice(0, sectionIndex + 1);
    const after = lines.slice(endIndex);
    
    return [...before, newContent, '', ...after].join('\n');
  }

  /**
   * 备份文件
   */
  async backupFile(filePath, relativePath) {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `${path.basename(relativePath, '.md')}_${timestamp}.md`;
      const backupPath = path.join(BACKUP_DIR, backupFileName);
      
      await fs.copyFile(filePath, backupPath);
      
      this.backups.push({
        original: relativePath,
        backup: backupPath
      });
      
    } catch (error) {
      // 文件不存在，不需要备份
    }
  }

  /**
   * 回滚
   */
  async rollback() {
    console.log(`回滚 ${this.backups.length} 个文件...\n`);
    
    for (const backup of this.backups) {
      try {
        const originalPath = path.join(KB_BASE, backup.original);
        await fs.copyFile(backup.backup, originalPath);
        console.log(`✓ 已回滚: ${backup.original}`);
      } catch (error) {
        console.error(`✗ 回滚失败: ${backup.original} - ${error.message}`);
      }
    }
  }

  /**
   * 保存更新日志
   */
  async saveLog(extracted, updates) {
    await fs.mkdir(UPDATE_LOG_DIR, { recursive: true });
    
    const log = {
      chapterNumber: this.chapterNumber,
      timestamp: new Date().toISOString(),
      mode: 'auto',
      extracted,
      updates: this.updates,
      backups: this.backups
    };
    
    const logPath = path.join(UPDATE_LOG_DIR, `chapter-${this.chapterNumber}_auto.json`);
    await fs.writeFile(logPath, JSON.stringify(log, null, 2), 'utf-8');
  }

  /**
   * 显示预览
   */
  displayPreview(updates) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`将要更新 ${updates.length} 个文件：\n`);
    
    for (const update of updates) {
      console.log(`📄 ${update.file}`);
      console.log(`   部分: ${update.section}`);
      console.log(`   原因: ${update.reason}`);
      console.log(`   内容预览:`);
      console.log(`   ${update.content.substring(0, 100).replace(/\n/g, '\n   ')}...`);
      console.log();
    }
    
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('用法: node kb-auto-update-v2.js <章节号> <章节文件路径> [--auto]');
    console.error('示例: node kb-auto-update-v2.js 22 工作区/第22章_终版.md --auto');
    process.exit(1);
  }
  
  const chapterNumber = parseInt(args[0]);
  const chapterFilePath = path.resolve(__dirname, args[1]);
  const autoMode = args.includes('--auto');
  
  const updater = new AutoUpdater(chapterNumber, chapterFilePath, autoMode);
  await updater.run();
}

// 运行
if (require.main === module) {
  main();
}

module.exports = AutoUpdater;
