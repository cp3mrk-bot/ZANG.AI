import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// 获取用户的关注列表
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = parseInt(searchParams.get("offset") || "0");

  if (!userId) {
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from("follows")
    .select(`
      id,
      created_at,
      users!follows_following_id_fkey (id, nickname, avatar, bio)
    `)
    .eq("follower_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const following = data.map((f: any) => ({
    id: f.users.id,
    nickname: f.users.nickname,
    avatar: f.users.avatar,
    bio: f.users.bio,
    followedAt: f.created_at,
  }));

  return NextResponse.json({ following });
}
