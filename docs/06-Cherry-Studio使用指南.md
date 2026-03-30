# Cherry Studio 使用指南

本指南专门针对 Cherry Studio 用户，介绍如何在 Cherry Studio 中高效使用 NovelForge。

## Cherry Studio 简介

Cherry Studio 是一个跨平台的 AI 桌面客户端，支持：
- 多 LLM 提供商（Claude、GPT、Gemini 等）
- Model Context Protocol (MCP) 服务器集成
- 知识库管理
- 自定义 Agent 和工作流

**官方资源**：
- [Cherry Studio MCP Client](https://mcp.so/client/cherry-studio/CherryHQ)
- [Cherry Studio GitHub](https://github.com/CherryHQ/cherry-studio)

## 为什么 NovelForge 适合 Cherry Studio

1. **知识库天然契合**：Cherry Studio 有内置知识库功能，NovelForge 的 Markdown 知识库可以直接导入
2. **MCP 服务器支持**：NovelForge 提供的 MCP 服务器可以在 Cherry Studio 中使用
3. **多模型对比**：可以用不同模型测试章纲效果
4. **工作流自动化**：Cherry Studio 的 Agent 功能可以自动化 6 阶段工作流

## 推荐工作流程

### 方式一：纯对话模式（最简单）

**适合**：不想配置 MCP，只用对话完成创作

**步骤**：

1. **创建专用 Agent**
   - 在 Cherry Studio 中创建新 Agent
   - 名称：`NovelForge 创作助手`
   - 系统提示词：复制 `CLAUDE.md` 的全部内容

2. **上传知识库**
   - 使用 Cherry Studio 的"知识库"功能
   - 将 `知识库/` 目录下的所有 `.md` 文件上传
   - 或者每次对话时手动选择需要的文件

3. **开始创作**
   - 新建对话，选择刚创建的 Agent
   - 按 6 阶段工作流进行

**优点**：简单直接，无需配置
**缺点**：每次需要手动选择知识库文件

### 方式二：MCP 服务器模式（推荐）

**适合**：想要自动化知识库查询，减少手动操作

**步骤**：

1. **配置 MCP 服务器**

   在 Cherry Studio 中添加 MCP 服务器：
   - 打开 Cherry Studio 设置 → MCP 服务器
   - 添加新服务器
   - 类型：`stdio`
   - 命令：`node`
   - 参数：`[你的路径]/novel-knowledge-mcp-server/dist/index.js`
   - 工作目录：你的项目根目录

2. **验证 MCP 工具**

   重启 Cherry Studio，在对话中应该能看到以下工具：
   - `read_knowledge_file` - 读取知识库文件
   - `search_knowledge` - 搜索知识库
   - `list_knowledge_structure` - 列出知识库结构
   - `get_current_status` - 获取当前状态
   - `get_character_info` - 获取人物信息

3. **创建 Agent**

   系统提示词简化版（MCP 会自动提供知识库）：
   ```markdown
   你是 NovelForge 创作助手。使用 MCP 工具查询知识库，按 6 阶段工作流协作创作。

   工作流：章纲发散 → 选择 → 正文产出 → AI自查 → 人类修正 → 归档

   每次创作前，先用 get_current_status 获取当前状态。
   ```

4. **开始创作**

   AI 会自动调用 MCP 工具查询知识库，无需手动上传文件。

**优点**：自动化，AI 按需查询知识库
**缺点**：需要配置 MCP 服务器

### 方式三：混合模式（灵活）

结合两种方式：
- 核心文件（`CLAUDE.md`、`当前状态.md`）手动上传
- 其他文件通过 MCP 按需查询

## Cherry Studio 特有技巧

### 1. 利用多模型对比

Cherry Studio 支持同时对比多个模型的输出。

**用法**：章纲发散阶段
- 同时用 Claude Opus、Sonnet、GPT-4 生成章纲
- 对比三个模型的创意
- 选择最好的或混合

### 2. 使用知识库自动关联

Cherry Studio 的知识库有自动关联功能：
- 上传所有知识库文件到 Cherry Studio 知识库
- 开启"自动关联"
- AI 会根据对话内容自动检索相关文件

**配置**：
- 知识库 → 设置 → 开启"自动关联"
- 相似度阈值：0.7（推荐）

### 3. 创建工作流 Agent

利用 Cherry Studio 的 Agent 功能自动化流程：

**示例 Agent：章节自查助手**
```markdown
系统提示词：
你是章节自查助手。读取用户提供的章节初稿，对照错题集和文风规则逐项检查。

工作流程：
1. 读取 04_写作参考/错题集_完整版.md
2. 读取 00_核心上下文/文风规则_完整版.md
3. 逐条对照初稿，标注问题
4. 输出自查报告
```

### 4. 使用 Cherry Studio 的项目功能

Cherry Studio 支持项目管理：
- 为每部小说创建独立项目
- 项目内包含专用 Agent、知识库、对话历史
- 多部作品互不干扰

**操作**：
- 左侧边栏 → 项目 → 新建项目
- 项目名：你的小说名
- 将 NovelForge 知识库导入该项目

## 常见问题

**Q: Cherry Studio 的知识库和 NovelForge 知识库有什么区别？**

A:
- NovelForge 知识库：结构化的创作知识，按 5 层分类
- Cherry Studio 知识库：通用的文档存储，支持向量检索

建议：两者结合使用。NovelForge 知识库保持原结构，同时上传到 Cherry Studio 知识库用于自动检索。

**Q: MCP 服务器配置失败怎么办？**

A:
1. 检查 Node.js 是否安装（`node --version`）
2. 检查 MCP 服务器路径是否正确
3. 查看 Cherry Studio 日志（设置 → 日志）
4. 如果仍然失败，使用方式一（纯对话模式）

**Q: 可以在 Cherry Studio 中使用 CLI 工具吗？**

A: 可以，但需要在外部终端运行。Cherry Studio 主要用于对话和知识库管理，CLI 工具用于文件管理。

**Q: Cherry Studio 的 Agent 能完全自动化 6 阶段工作流吗？**

A: 部分可以。AI 自查、知识库更新可以自动化，但人类选择和修正环节仍需人工参与。

## 推荐配置

**最佳实践**：

1. **项目结构**
   ```
   Cherry Studio 项目：我的小说
   ├── Agent：NovelForge 创作助手
   ├── Agent：章节自查助手
   ├── 知识库：NovelForge 知识库（自动关联）
   └── MCP：novel-knowledge-mcp-server
   ```

2. **模型选择**
   - 章纲发散：Claude Opus（创意强）
   - 正文产出：Claude Sonnet（平衡）
   - AI 自查：Claude Haiku（快速）

3. **知识库同步**
   - 每完成一章，手动更新 Cherry Studio 知识库
   - 或使用脚本自动同步

## 下一步

- 阅读 [快速开始](01-快速开始.md) 了解 NovelForge 基础
- 阅读 [工作流详解](04-工作流详解.md) 了解创作流程
- 加入 Cherry Studio 社区交流使用经验

---

**参考资源**：
- [Cherry Studio MCP Client](https://mcp.so/client/cherry-studio/CherryHQ)
- [How to use MCP in Cherry Studio](https://onedollarvps.com/blogs/how-to-use-mcp-in-cherry-studio)
- [Cherry Studio GitHub](https://github.com/CherryHQ/cherry-studio)
