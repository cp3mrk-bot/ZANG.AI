import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { DEFAULT_AVATARS } from "@/lib/avatars";

// 验证验证码并完成注册/登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, code, nickname, avatarId, type = "register" } = body;

    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    // 验证验证码格式
    if (!code || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: "请输入6位数字验证码" }, { status: 400 });
    }

    // 注册时验证昵称
    if (type === "register") {
      if (!nickname || nickname.trim().length < 2) {
        return NextResponse.json({ error: "昵称至少2个字符" }, { status: 400 });
      }
    }

    const client = getSupabaseClient();

    // 查找有效的验证码
    const { data: verificationCode, error: findError } = await client
      .from("verification_codes")
      .select("*")
      .eq("phone", phone)
      .eq("code", code)
      .eq("type", type)
      .eq("is_used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (findError || !verificationCode) {
      return NextResponse.json({ error: "验证码无效或已过期" }, { status: 400 });
    }

    // 标记验证码为已使用
    await client
      .from("verification_codes")
      .update({ is_used: true })
      .eq("id", verificationCode.id);

    let user: any = null;

    if (type === "register") {
      // 检查手机号是否已被注册
      const { data: existingUser } = await client
        .from("users")
        .select("id")
        .eq("phone", phone)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: "该手机号已注册" }, { status: 400 });
      }

      // 选择头像
      const avatar = DEFAULT_AVATARS.find(a => a.id === avatarId)?.path || "/avatar_pink.png";

      // 创建新用户
      const { data: newUser, error: createError } = await client
        .from("users")
        .insert({
          nickname: nickname.trim(),
          phone,
          avatar,
          bio: "",
          followers_count: 0,
          following_count: 0,
          posts_count: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Create user error:", createError);
        return NextResponse.json({ error: "注册失败" }, { status: 500 });
      }

      user = newUser;
    } else if (type === "login") {
      // 登录：查找用户
      const { data: existingUser, error: userError } = await client
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

      if (userError || !existingUser) {
        return NextResponse.json({ error: "用户不存在" }, { status: 400 });
      }

      user = existingUser;
    }

    return NextResponse.json({ 
      success: true, 
      user,
      message: type === "register" ? "注册成功" : "登录成功"
    });
  } catch (error) {
    console.error("Verify code error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
