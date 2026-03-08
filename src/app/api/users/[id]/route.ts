import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";

// 更新用户信息
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, avatar, bio, nickname } = body;

    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    const client = getSupabaseClient();

    const updateData: Record<string, any> = {};
    if (avatar) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (nickname) updateData.nickname = nickname;

    const { data, error } = await client
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Update user error:", error);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
