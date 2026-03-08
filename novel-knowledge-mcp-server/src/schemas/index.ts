import { z } from 'zod';
import { ResponseFormat } from '../constants.js';

// 搜索知识库
export const SearchKnowledgeBaseSchema = z.object({
  query: z.string()
    .min(1, "查询字符串不能为空")
    .describe("搜索关键词（支持人物名、伏笔、设定等）"),
  category: z.enum(['all', 'characters', 'worldview', 'plot', 'writing_reference'])
    .default('all')
    .describe("搜索类别：all=全部, characters=人物, worldview=世界观, plot=伏笔故事, writing_reference=写作参考"),
  limit: z.number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("返回结果数量限制"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 获取人物档案
export const GetCharacterSchema = z.object({
  name: z.string()
    .min(1, "人物名称不能为空")
    .describe("人物名称（如：秦力、赵明、发林等）"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 列出所有人物
export const ListCharactersSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 获取伏笔追踪
export const GetPlotPointsSchema = z.object({
  status: z.enum(['all', '待揭示', '部分揭示', '已揭示'])
    .default('all')
    .describe("伏笔状态筛选"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 获取当前状态
export const GetCurrentStateSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 列出章节文件
export const ListChapterFilesSchema = z.object({
  chapterNumber: z.number()
    .int()
    .min(1)
    .optional()
    .describe("章节编号（可选，不提供则列出所有章节）"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 一致性检查
export const CheckConsistencySchema = z.object({
  chapterNumber: z.number()
    .int()
    .min(1)
    .describe("要检查的章节编号"),
  checkTypes: z.array(z.enum(['OOC', '数值错误', '时间线错误', '设定冲突']))
    .default(['OOC', '数值错误', '时间线错误', '设定冲突'])
    .describe("检查类型列表"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 智能推荐资料
export const RecommendResourcesSchema = z.object({
  chapterOutline: z.string()
    .min(10, "章纲内容至少10个字符")
    .describe("章节大纲内容"),
  limit: z.number()
    .int()
    .min(1)
    .max(20)
    .default(5)
    .describe("推荐资料数量"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 获取知识库统计
export const GetKnowledgeBaseStatsSchema = z.object({
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});

// 读取文件内容
export const ReadFileSchema = z.object({
  filePath: z.string()
    .min(1, "文件路径不能为空")
    .describe("相对于知识库根目录的文件路径"),
  response_format: z.nativeEnum(ResponseFormat)
    .default(ResponseFormat.MARKDOWN)
    .describe("响应格式：json或markdown")
});
