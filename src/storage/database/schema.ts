import { pgTable, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";

// 用户表
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nickname: text("nickname").notNull(),
  avatar: text("avatar").default("/avatar_pink.png"),
  bio: text("bio"),
  // 手机号（唯一，用于注册登录）
  phone: text("phone").unique(),
  // 统计字段
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  postsCount: integer("posts_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index("users_phone_idx").on(table.phone),
}));

// 验证码表
export const verificationCodes = pgTable("verification_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  type: text("type").notNull().default("register"), // register, login, reset
  isUsed: boolean("is_used").default(false).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  phoneIdx: index("verification_codes_phone_idx").on(table.phone),
  expiresIdx: index("verification_codes_expires_idx").on(table.expiresAt),
}));

// 关注关系表
export const follows = pgTable("follows", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  followerId: text("follower_id").notNull().references(() => users.id), // 关注者
  followingId: text("following_id").notNull().references(() => users.id), // 被关注者
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  followerIdx: index("follows_follower_idx").on(table.followerId),
  followingIdx: index("follows_following_idx").on(table.followingId),
}));

// 帖子表
export const posts = pgTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  category: text("category").notNull().default("other"),
  isArticle: boolean("is_article").default(false).notNull(),
  articleUrl: text("article_url"),
  // 互动数据
  likes: integer("likes").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  sharesCount: integer("shares_count").default(0).notNull(),
  // 热度分数（用于推流算法）
  hotScore: integer("hot_score").default(0).notNull(),
  // 热度更新时间
  hotScoreUpdatedAt: timestamp("hot_score_updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index("posts_category_idx").on(table.category),
  hotScoreIdx: index("posts_hot_score_idx").on(table.hotScore),
  createdAtIdx: index("posts_created_at_idx").on(table.createdAt),
}));

// 评论表
export const comments = pgTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").notNull().references(() => posts.id),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// AI锐评记录表
export const aiRoasts = pgTable("ai_roasts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").references(() => posts.id),
  commentId: text("comment_id").references(() => comments.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 点赞记录表（防止重复点赞）
export const likes = pgTable("likes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  postId: text("post_id").references(() => posts.id),
  commentId: text("comment_id").references(() => comments.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userPostIdx: index("likes_user_post_idx").on(table.userId, table.postId),
}));
