import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

/**
 * 热度推流算法说明：
 * 
 * hotScore = (likes * 1 + comments * 3 + shares * 5) * timeDecay
 * 
 * timeDecay 时间衰减因子：
 * - 1小时内：1.0
 * - 1-6小时：0.8
 * - 6-24小时：0.6
 * - 24-72小时：0.4
 * - 72小时以上：0.2
 */

// 计算时间衰减因子
function getTimeDecay(createdAt: string): number {
  const hours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hours < 1) return 1.0;
  if (hours < 6) return 0.8;
  if (hours < 24) return 0.6;
  if (hours < 72) return 0.4;
  return 0.2;
}

// 计算热度分数
function calculateHotScore(likes: number, comments: number, shares: number, createdAt: string): number {
  const baseScore = likes * 1 + comments * 3 + shares * 5;
  const decay = getTimeDecay(createdAt);
  return Math.floor(baseScore * decay * 100);
}

// 获取帖子列表（热度推流）
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");
  const orderBy = searchParams.get("orderBy") || "hot";
  const search = searchParams.get("search");
  const userId = searchParams.get("userId");

  const client = getSupabaseClient();

  // 获取帖子列表
  let query = client
    .from("posts")
    .select("*");

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  // 搜索功能
  if (search) {
    // 简单的模糊搜索（模拟环境）
    // 真实环境应该使用全文搜索
    query = query.order("created_at", { ascending: false });
  }

  // 获取特定用户的帖子
  if (userId) {
    query = query.eq("user_id", userId);
  }

  if (orderBy === "hot" && !search) {
    query = query.order("hot_score", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const result = await query;
  let posts = result.data || [];

  // 搜索过滤（内存中进行模糊匹配）
  if (search) {
    const searchLower = search.toLowerCase();
    posts = posts.filter((post: any) => 
      post.content?.toLowerCase().includes(searchLower) ||
      post.category?.toLowerCase().includes(searchLower)
    );
  }

  // 获取所有用户ID
  const userIds = [...new Set(posts.map((p: any) => p.user_id))];
  const usersMap: Record<string, any> = {};

  // 批量获取用户信息
  for (const userId of userIds) {
    const userResult = await client
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (userResult.data) {
      usersMap[userId] = userResult.data;
    }
  }

  // 在内存中计算热度并附加用户信息
  const postsWithHotScore = posts.map((post: any) => ({
    ...post,
    hotScore: post.hot_score || calculateHotScore(
      post.likes || 0, 
      post.comments_count || 0, 
      post.shares_count || 0, 
      post.created_at
    ),
    users: usersMap[post.user_id] || null,
  }));

  if (orderBy === "hot" && postsWithHotScore.length > 0) {
    postsWithHotScore.sort((a: any, b: any) => b.hotScore - a.hotScore);
  }

  // 应用分页
  const paginatedPosts = postsWithHotScore.slice(offset, offset + limit);

  return NextResponse.json({ posts: paginatedPosts });
}

// 创建帖子
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content, images, category, userId } = body;

  if (!content || !userId) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const client = getSupabaseClient();

  const isArticle = content.length > 300;
  const hotScore = calculateHotScore(0, 0, 0, new Date().toISOString());

  const { data, error } = await client
    .from("posts")
    .insert({
      user_id: userId,
      content: isArticle ? content.substring(0, 300) + "..." : content,
      images: images || [],
      category: category || "other",
      is_article: isArticle,
      article_url: isArticle ? `/article/${Date.now()}` : null,
      hot_score: hotScore,
      likes: 0,
      comments_count: 0,
      shares_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 更新用户发帖数
  const { data: user } = await client
    .from("users")
    .select("posts_count")
    .eq("id", userId)
    .single();
  
  if (user) {
    await client
      .from("users")
      .update({ posts_count: (user.posts_count || 0) + 1 })
      .eq("id", userId);
  }

  return NextResponse.json({ post: data });
}
