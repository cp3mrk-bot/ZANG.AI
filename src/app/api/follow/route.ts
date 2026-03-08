import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// 关注用户
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { followerId, followingId } = body;

  if (!followerId || !followingId) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  if (followerId === followingId) {
    return NextResponse.json({ error: "不能关注自己" }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 检查是否已关注
  const { data: existing } = await client
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  if (existing) {
    // 取消关注
    await client
      .from("follows")
      .delete()
      .eq("id", existing.id);

    // 更新计数
    const { data: followingUser } = await client
      .from("users")
      .select("followers_count")
      .eq("id", followingId)
      .single();
    
    const { data: followerUser } = await client
      .from("users")
      .select("following_count")
      .eq("id", followerId)
      .single();

    if (followingUser) {
      await client
        .from("users")
        .update({ followers_count: Math.max(0, (followingUser.followers_count || 0) - 1) })
        .eq("id", followingId);
    }

    if (followerUser) {
      await client
        .from("users")
        .update({ following_count: Math.max(0, (followerUser.following_count || 0) - 1) })
        .eq("id", followerId);
    }

    return NextResponse.json({ followed: false, message: "已取消关注" });
  } else {
    // 添加关注
    const { error } = await client
      .from("follows")
      .insert({
        follower_id: followerId,
        following_id: followingId,
      });

    if (error) {
      console.error("Follow error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新计数
    const { data: followingUser } = await client
      .from("users")
      .select("followers_count")
      .eq("id", followingId)
      .single();
    
    const { data: followerUser } = await client
      .from("users")
      .select("following_count")
      .eq("id", followerId)
      .single();

    if (followingUser) {
      await client
        .from("users")
        .update({ followers_count: (followingUser.followers_count || 0) + 1 })
        .eq("id", followingId);
    }

    if (followerUser) {
      await client
        .from("users")
        .update({ following_count: (followerUser.following_count || 0) + 1 })
        .eq("id", followerId);
    }

    return NextResponse.json({ followed: true, message: "关注成功" });
  }
}

// 检查关注状态
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const followerId = searchParams.get("followerId");
  const followingId = searchParams.get("followingId");

  if (!followerId || !followingId) {
    return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data } = await client
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .single();

  return NextResponse.json({ isFollowing: !!data });
}
