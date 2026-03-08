# ZANG爱 - 锐评一切

> 用最犀利的眼光，锐评一切值得锐评的事物

![ZANG爱 Logo](public/logo.png)

## 项目简介

**ZANG爱** 是一个葬爱杀马特风格的锐评/吐槽社区 H5 应用，致敬早期推特信息流设计。在这里，你可以畅所欲言，用最犀利的语言吐槽一切——产品、服务、现象、人物，无一不可锐评。

### 核心特性

- **发帖吐槽**：300字以内短评，超长自动转文章链接
- **AI 锐评**：召唤 @小ZANG，获得毒舌 AI 的犀利点评（流式输出）
- **热度推流**：基于点赞、评论、转发的热度算法，让好吐槽浮上来
- **粉丝关注**：关注你喜欢的锐评手，不错过每一条神评
- **多分类浏览**：按科技、娱乐、社会等分类筛选内容
- **图片上传**：支持图片吐槽，有图有真相

### 设计风格

- **Logo**：小黄脸 emoji + 亮粉色杀马特爆炸头
- **配色**：Fuchsia 主色调，暗色/亮色主题切换
- **字体**：Playful 风格，年轻活泼
- **风格**：致敬葬爱家族，承载一代人的青春回忆

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19 + TypeScript 5 |
| UI | shadcn/ui (Radix UI) |
| 样式 | Tailwind CSS 4 |
| 数据库 | Supabase (PostgreSQL) / localStorage 降级 |
| AI | coze-coding-dev-sdk (流式输出) |
| 存储 | S3 兼容对象存储 |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装依赖

```bash
pnpm install
```

### 配置环境变量（可选）

创建 `.env.local` 文件：

```env
# Supabase 数据库配置（可选，不配置则使用 localStorage 模拟）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# AI 配置（可选，不配置则 AI 锐评返回预设回复）
AI_API_KEY=your-ai-api-key
```

> **注意**：即使不配置任何环境变量，应用也能正常运行。数据会保存在浏览器 localStorage 或服务端临时文件中。

### 启动开发服务器

```bash
pnpm dev
# 或
coze dev
```

访问 [http://localhost:5000](http://localhost:5000) 查看应用。

### 构建生产版本

```bash
pnpm build
# 或
coze build
```

## 项目结构

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 首页（信息流）
│   ├── layout.tsx               # 根布局
│   ├── globals.css              # 全局样式 + 主题变量
│   └── api/                     # API 路由
│       ├── users/               # 用户相关 API
│       ├── posts/               # 帖子相关 API
│       └── follow/              # 关注相关 API
├── components/                   # React 组件
│   ├── ui/                      # shadcn/ui 基础组件
│   ├── layout/                  # 布局组件（Header, BottomNav）
│   ├── posts/                   # 帖子相关组件
│   ├── auth/                    # 认证相关组件
│   └── ai/                      # AI 锐评组件
├── contexts/                     # React Context
│   └── UserContext.tsx          # 用户状态管理
├── lib/                          # 工具函数
│   ├── avatars.ts               # 默认头像配置
│   └── utils.ts                 # 通用工具函数
└── storage/                      # 存储层
    └── database/                 # 数据库相关
        ├── schema.ts            # 数据表结构定义
        └── supabase-client.ts   # Supabase 客户端 + Mock 实现
```

## 核心功能说明

### 1. 热度推流算法

帖子热度分数计算公式：

```
hotScore = (likes * 1 + comments * 3 + shares * 5) * timeDecay
```

时间衰减因子：
- 1小时内：1.0
- 1-6小时：0.8
- 6-24小时：0.6
- 24-72小时：0.4
- 72小时以上：0.2

### 2. 用户系统

采用「快速注册」模式：
1. 选择头像（4个葬爱风格默认头像）
2. 输入昵称
3. 即刻开始锐评

无需密码，降低使用门槛。

### 3. AI 锐评

在帖子中 @小ZANG，即可召唤 AI 锐评。AI 会以葬爱风格进行毒舌点评：

- 犀利但不恶意
- 幽默且有深意
- 偶尔扎心但发人深省

### 4. 数据库降级机制

应用支持两种运行模式：

| 模式 | 数据存储 | 适用场景 |
|------|---------|---------|
| 生产模式 | Supabase (PostgreSQL) | 部署到生产环境 |
| 开发模式 | localStorage / 临时文件 | 本地开发、快速体验 |

自动检测 Supabase 配置，未配置时自动降级。

## API 接口

### 用户相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/users | 创建用户 |
| GET | /api/users/[id] | 获取用户信息 |

### 帖子相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/posts | 获取帖子列表 |
| POST | /api/posts | 创建帖子 |
| GET | /api/posts/[id]/comments | 获取评论列表 |
| POST | /api/posts/[id]/comments | 创建评论 |

### 关注相关

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/follow | 关注用户 |
| DELETE | /api/follow | 取消关注 |
| GET | /api/followers/[id] | 获取粉丝列表 |
| GET | /api/following/[id] | 获取关注列表 |

## 开发规范

### 组件开发

优先使用 shadcn/ui 组件：

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// 使用主题变量
<div className="bg-background text-foreground">
  <Card>
    <CardContent>内容</CardContent>
  </Card>
</div>
```

### 样式规范

使用 Tailwind 语义化变量，避免硬编码颜色：

```tsx
// ✅ 正确
<div className="bg-primary text-primary-foreground">

// ❌ 错误
<div className="bg-[#ff00ff] text-white">
```

### 依赖管理

仅使用 pnpm：

```bash
pnpm add package-name
pnpm add -D dev-package
```

## 部署

### Vercel 部署（推荐）

1. Fork 本仓库
2. 在 Vercel 中导入项目
3. 配置环境变量（可选）
4. 自动部署完成

### Docker 部署

```bash
docker build -t zang-ai .
docker run -p 5000:5000 zang-ai
```

## 致谢

- 设计灵感：早期 Twitter、葬爱家族
- UI 组件：[shadcn/ui](https://ui.shadcn.com)
- 框架：[Next.js](https://nextjs.org)
- 数据库：[Supabase](https://supabase.com)

## License

[MIT](LICENSE)

---

**ZANG爱** - 因为热爱，所以吐槽 ✊
