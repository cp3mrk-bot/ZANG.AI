import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// DEMO用户数据（用于评论展示）
const DEMO_USERS: Record<string, any> = {
  "user-1": { id: "user-1", nickname: "葬爱家族第一深情", avatar: "/avatar_pink.png" },
  "user-2": { id: "user-2", nickname: "互联网嘴替", avatar: "/avatar_blue.png" },
  "user-3": { id: "user-3", nickname: "emo老boy", avatar: "/avatar_purple.png" },
  "user-4": { id: "user-4", nickname: "暴躁老哥在线喷人", avatar: "/avatar_green.png" },
};

// 获取帖子评论
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("comments")
    .select("*")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ comments: [] });
  }

  // 获取评论用户信息
  const commentsWithUsers = await Promise.all(
    (data || []).map(async (comment: any) => {
      let user = null;
      
      // 先检查是否是DEMO用户
      if (DEMO_USERS[comment.user_id]) {
        user = DEMO_USERS[comment.user_id];
      } else {
        // 否则从数据库获取
        const userResult = await client
          .from("users")
          .select("id, nickname, avatar")
          .eq("id", comment.user_id)
          .single();
        user = userResult.data;
      }

      return {
        ...comment,
        users: user || { id: comment.user_id, nickname: "用户", avatar: null },
      };
    })
  );

  return NextResponse.json({ comments: commentsWithUsers });
}

// 创建评论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { content, images, userId } = body;

  if (!content || !userId) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from("comments")
    .insert({
      post_id: id,
      user_id: userId,
      content,
      images: images || [],
      likes: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 更新帖子评论数
  const { data: post } = await client
    .from("posts")
    .select("comments_count")
    .eq("id", id)
    .single();
  
  if (post) {
    await client
      .from("posts")
      .update({ comments_count: (post.comments_count || 0) + 1 })
      .eq("id", id);
  }

  // 返回带用户信息的评论
  let user = null;
  if (DEMO_USERS[userId]) {
    user = DEMO_USERS[userId];
  } else {
    const userResult = await client
      .from("users")
      .select("id, nickname, avatar")
      .eq("id", userId)
      .single();
    user = userResult.data;
  }

  return NextResponse.json({ 
    comment: {
      ...data,
      users: user || { id: userId, nickname: "用户", avatar: null },
    } 
  });
}
