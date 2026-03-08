import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { DEFAULT_AVATARS } from "@/lib/avatars";

// 快速创建账号（无需密码）
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nickname, avatarId } = body;

  if (!nickname || nickname.trim().length < 2) {
    return NextResponse.json({ error: "昵称至少2个字符" }, { status: 400 });
  }

  const client = getSupabaseClient();

  // 选择头像
  const avatar = DEFAULT_AVATARS.find(a => a.id === avatarId)?.path || "/avatar_pink.png";

  const { data, error } = await client
    .from("users")
    .insert({
      nickname: nickname.trim(),
      avatar,
      bio: "",
      followers_count: 0,
      following_count: 0,
      posts_count: 0,
    })
    .select()
    .single();

  if (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}

// 获取用户信息
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("id");

  if (!userId) {
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
  }

  const client = getSupabaseClient();

  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ user: data });
}
