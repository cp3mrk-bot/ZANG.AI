import { pgTable, foreignKey, text, jsonb, integer, timestamp, serial, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const comments = pgTable("comments", {
	id: text().primaryKey().notNull(),
	postId: text("post_id").notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	images: jsonb().default([]),
	likes: integer().default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "comments_user_id_users_id_fk"
		}),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const follows = pgTable("follows", {
	id: text().primaryKey().notNull(),
	followerId: text("follower_id").notNull(),
	followingId: text("following_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [users.id],
			name: "follows_follower_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [users.id],
			name: "follows_following_id_users_id_fk"
		}),
]);

export const likes = pgTable("likes", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	postId: text("post_id"),
	commentId: text("comment_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "likes_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "likes_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "likes_comment_id_comments_id_fk"
		}),
]);

export const posts = pgTable("posts", {
	id: text().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	content: text().notNull(),
	images: jsonb().default([]),
	category: text().default('other').notNull(),
	isArticle: boolean("is_article").default(false).notNull(),
	articleUrl: text("article_url"),
	likes: integer().default(0).notNull(),
	commentsCount: integer("comments_count").default(0).notNull(),
	sharesCount: integer("shares_count").default(0).notNull(),
	hotScore: integer("hot_score").default(0).notNull(),
	hotScoreUpdatedAt: timestamp("hot_score_updated_at", { mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "posts_user_id_users_id_fk"
		}),
]);

export const aiRoasts = pgTable("ai_roasts", {
	id: text().primaryKey().notNull(),
	postId: text("post_id"),
	commentId: text("comment_id"),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "ai_roasts_post_id_posts_id_fk"
		}),
	foreignKey({
			columns: [table.commentId],
			foreignColumns: [comments.id],
			name: "ai_roasts_comment_id_comments_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: text().primaryKey().notNull(),
	nickname: text().notNull(),
	avatar: text().default('/avatar_pink.png'),
	bio: text(),
	followersCount: integer("followers_count").default(0).notNull(),
	followingCount: integer("following_count").default(0).notNull(),
	postsCount: integer("posts_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});
