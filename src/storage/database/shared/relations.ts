import { relations } from "drizzle-orm/relations";
import { posts, comments, users, follows, likes, aiRoasts } from "./schema";

export const commentsRelations = relations(comments, ({one, many}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	likes: many(likes),
	aiRoasts: many(aiRoasts),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	comments: many(comments),
	likes: many(likes),
	user: one(users, {
		fields: [posts.userId],
		references: [users.id]
	}),
	aiRoasts: many(aiRoasts),
}));

export const usersRelations = relations(users, ({many}) => ({
	comments: many(comments),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_users_id"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_users_id"
	}),
	likes: many(likes),
	posts: many(posts),
}));

export const followsRelations = relations(follows, ({one}) => ({
	user_followerId: one(users, {
		fields: [follows.followerId],
		references: [users.id],
		relationName: "follows_followerId_users_id"
	}),
	user_followingId: one(users, {
		fields: [follows.followingId],
		references: [users.id],
		relationName: "follows_followingId_users_id"
	}),
}));

export const likesRelations = relations(likes, ({one}) => ({
	user: one(users, {
		fields: [likes.userId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [likes.postId],
		references: [posts.id]
	}),
	comment: one(comments, {
		fields: [likes.commentId],
		references: [comments.id]
	}),
}));

export const aiRoastsRelations = relations(aiRoasts, ({one}) => ({
	post: one(posts, {
		fields: [aiRoasts.postId],
		references: [posts.id]
	}),
	comment: one(comments, {
		fields: [aiRoasts.commentId],
		references: [comments.id]
	}),
}));