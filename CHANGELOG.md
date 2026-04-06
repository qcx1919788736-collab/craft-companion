# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2026-04-06

### Fixed

- 首轮交互增加明确分流：优先区分“从零开始”与“导入已有小说”，不再一上来泛泛介绍能力
- `tools/init.js` 增加模式选择与 `START_HERE.md` 生成，创建项目后下一步更明确
- `tools/import-cli.js` 路径修正到新版 `提示模板/导入已有小说/...`
- `tools/novel-cli.js` 对外口径统一为 Craft Companion / 5 阶段
- 修正文档与模板中的旧路径、旧命名、旧工作流残留

### Changed

- README 改为双入口首页：从零开始 / 导入已有小说
- 快速开始、导入指南、工作流详解、Cherry Studio 指南统一到当前结构
- 删除重复的 Cherry Studio 指南文件，减少文档分叉
- `package.json` 版本更新为 `1.1.1`
- `LICENSE` 署名统一为 Craft Companion Contributors

## [1.1.0] - 2026-04-05

### Added

- MCP 服务器适配（知识库查询工具）
- OpenClaw Skill 集成（SKILL.md 路由机制）
- 情感弧线检查（自查阶段增强）
- 新增 `docs/07-架构设计原则.md`
- 新增 `docs/08-检查点机制.md`

### Changed

- 6 阶段工作流 → 5 阶段工作流（更简洁）
- 提示模板子目录重命名为中文（从零开始/、导入已有小说/）
- 知识库模板更新（错题集、微调意图学习库、场景范例）
- 工作流详解扩充至 409 行

### Architecture

- **Context 物理隔离机制**：每个阶段明确"不读什么"，防止 AI 偷看答案
- **检查点恢复机制**：每阶段完成后写入状态快照，中断后可从检查点恢复

## [1.0.0] - 2026-03-29

### Added

- 5 层知识库结构（核心上下文、人物档案、世界观设定、故事进展、写作参考）
- 6 阶段创作工作流（章纲发散 → 选择 → 正文产出 → AI自查 → 人类修正 → 归档）
- 完整的模板系统（template/）
- CLI 工具集（init、import、novel-cli）
- 详细文档（快速开始，知识库设计，导入指南，工作流详解，自定义扩展）
- Cherry Studio 使用指南
- 开源项目标准文件（MIT License、Contributing Guidelines）

---

更新日志格式遵循 [Keep a Changelog](https://keepachangelog.com/) 标准：

- `Added` - 新功能
- `Changed` - 现有功能的变更
- `Deprecated` - 即将移除的功能
- `Removed` - 已移除的功能
- `Fixed` - 错误修复
- `Security` - 安全相关更新
