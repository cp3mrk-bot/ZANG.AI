import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/storage/database/supabase-client";
import { sendVerificationCode, isSMSConfigured } from "@/lib/sms";

// 发送验证码
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, type = "register" } = body;

    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: "请输入正确的手机号" }, { status: 400 });
    }

    const client = getSupabaseClient();

    // 如果是注册，检查手机号是否已注册
    if (type === "register") {
      const { data: existingUser } = await client
        .from("users")
        .select("id")
        .eq("phone", phone)
        .single();

      if (existingUser) {
        return NextResponse.json({ error: "该手机号已注册" }, { status: 400 });
      }
    }

    // 如果是登录，检查手机号是否存在
    if (type === "login") {
      const { data: existingUser } = await client
        .from("users")
        .select("id")
        .eq("phone", phone)
        .single();

      if (!existingUser) {
        return NextResponse.json({ error: "该手机号未注册" }, { status: 400 });
      }
    }

    // 检查发送频率限制（60秒内只能发一次）
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentCodes } = await client
      .from("verification_codes")
      .select("id")
      .eq("phone", phone)
      .eq("type", type)
      .gte("created_at", oneMinuteAgo);

    if (recentCodes && recentCodes.length > 0) {
      return NextResponse.json({ error: "验证码发送过于频繁，请稍后再试" }, { status: 429 });
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 验证码5分钟后过期
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 存储验证码
    const { error: insertError } = await client
      .from("verification_codes")
      .insert({
        phone,
        code,
        type,
        is_used: false,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Insert verification code error:", insertError);
      return NextResponse.json({ error: "验证码发送失败" }, { status: 500 });
    }

    // 发送短信验证码
    const smsResult = await sendVerificationCode(phone, code);
    
    if (!smsResult.success) {
      return NextResponse.json({ error: smsResult.error || "短信发送失败" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "验证码已发送",
      // 开发环境或未配置短信服务时返回验证码
      ...(smsResult.devCode && { devCode: smsResult.devCode }),
      // 提示用户短信服务状态
      ...(!isSMSConfigured() && { hint: "短信服务未配置，请联系管理员" })
    });
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
