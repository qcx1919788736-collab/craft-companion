# Cherry Studio 使用指南

## 为什么推荐 Cherry Studio

1. **Agent 工作目录功能**：可以让 AI 直接访问整个项目文件夹，无需手动上传知识库
2. **多模型对比**：可以用不同模型（Claude/GPT/Gemini）测试章纲效果
3. **MCP 服务器支持**：可选配置 Craft Companion 的 MCP 服务器获得增强功能
4. **会话管理**：每章创作可以独立会话，方便回溯和对比

## 推荐配置方式

### 方式一：Agent + 工作目录（推荐）

**适合**：使用支持 Agent 功能的模型（Claude、Gemini 等）

**步骤**：

1. **创建专用 Agent**
   - 在 Cherry Studio 中创建新 Agent
   - 名称：`Craft Companion 创作助手`
   - **设置工作目录**：选择你的小说项目根目录（包含 `CLAUDE.md`、`知识库/`、`工作区/` 的那个文件夹）

2. **开始创作**
   - 新建对话，选择刚创建的 Agent
   - AI 会自动读取 `CLAUDE.md` 和知识库文件
   - 按 5 阶段工作流进行（章纲 → 初稿 → 自查 → 修订 → 终版确认）

**注意**：
- 首次进入项目时，优先让 AI 读取 `START_HERE.md`
- 如果项目还没初始化完成，先完成“从零开始”或“导入已有小说”的模板步骤

---

### 方式二：知识库导入（备用）

适合：使用不支持 Agent 功能的模型。

至少导入这些文件：
- `CLAUDE.md`
- `START_HERE.md`
- `知识库/00_核心上下文/当前状态.md`

---

## 可选：配置 MCP 服务器

如果你想使用 Craft Companion 的 MCP 服务器（提供知识库查询、文件操作等增强功能）：

```bash
cd novel-knowledge-mcp-server
npm run build
npm start
```

MCP 是可选增强，不是必需前提。

---

## 建议

- 每章单独开会话
- 先分流（从零开始 / 导入已有小说），再创作
- 统一按 5 阶段对外讲，不再混用旧的 6 阶段说法
