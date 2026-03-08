"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_AVATARS } from "@/lib/avatars";
import { useUser } from "@/contexts/UserContext";
import { Check, Phone, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { createAccount, loginWithPhone, registerWithPhone } = useUser();
  
  // 快速注册状态
  const [nickname, setNickname] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("pink");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 手机号注册/登录状态
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [phoneNickname, setPhoneNickname] = useState("");
  const [phoneAvatar, setPhoneAvatar] = useState("pink");
  const [countdown, setCountdown] = useState(0);
  const [codeError, setCodeError] = useState("");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 快速注册提交
  const handleQuickSubmit = async () => {
    if (!nickname.trim() || nickname.trim().length < 2) {
      setError("昵称至少2个字符");
      return;
    }

    setIsLoading(true);
    setError("");

    const user = await createAccount(nickname.trim(), selectedAvatar);
    setIsLoading(false);

    if (user) {
      onOpenChange(false);
      resetForm();
    } else {
      setError("创建账号失败，请重试");
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setCodeError("请输入正确的手机号");
      return;
    }

    if (countdown > 0) return;

    setIsLoading(true);
    setCodeError("");

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, type: authMode }),
      });

      const data = await response.json();

      if (data.error) {
        setCodeError(data.error);
      } else {
        setCountdown(60);
        // 开发环境下自动填充验证码
        if (data.devCode) {
          setCode(data.devCode);
        }
      }
    } catch (err) {
      setCodeError("发送验证码失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 手机号注册/登录提交
  const handlePhoneSubmit = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      setCodeError("请输入正确的手机号");
      return;
    }

    if (!code || !/^\d{6}$/.test(code)) {
      setCodeError("请输入6位数字验证码");
      return;
    }

    if (authMode === "register") {
      if (!phoneNickname.trim() || phoneNickname.trim().length < 2) {
        setCodeError("昵称至少2个字符");
        return;
      }
    }

    setIsLoading(true);
    setCodeError("");

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          code,
          nickname: phoneNickname.trim(),
          avatarId: phoneAvatar,
          type: authMode,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setCodeError(data.error);
      } else if (data.user) {
        // 保存用户到上下文
        if (authMode === "register") {
          registerWithPhone(data.user);
        } else {
          loginWithPhone(data.user);
        }
        onOpenChange(false);
        resetForm();
      }
    } catch (err) {
      setCodeError("验证失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  // 重置表单
  const resetForm = () => {
    setNickname("");
    setPhone("");
    setCode("");
    setPhoneNickname("");
    setError("");
    setCodeError("");
    setCountdown(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">欢迎来到ZANG爱</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="flex items-center gap-1">
              <User className="w-4 h-4" />
              快速进入
            </TabsTrigger>
            <TabsTrigger value="phone" className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              手机号
            </TabsTrigger>
          </TabsList>

          {/* 快速注册 */}
          <TabsContent value="quick" className="space-y-4 pt-4">
            {/* 头像选择 */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">选择你的头像</p>
              <div className="grid grid-cols-4 gap-2">
                {DEFAULT_AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`relative p-1 rounded-lg border-2 transition-all ${
                      selectedAvatar === avatar.id
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-muted-foreground/30"
                    }`}
                  >
                    <img
                      src={avatar.path}
                      alt={avatar.name}
                      className="w-12 h-12 rounded-full mx-auto"
                    />
                    {selectedAvatar === avatar.id && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {DEFAULT_AVATARS.find(a => a.id === selectedAvatar)?.description}
              </p>
            </div>

            {/* 昵称输入 */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">你的昵称</p>
              <Input
                placeholder="取个犀利的昵称..."
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError("");
                }}
                maxLength={20}
              />
              {error && (
                <p className="text-xs text-destructive mt-1">{error}</p>
              )}
            </div>

            {/* 提交按钮 */}
            <Button
              className="w-full"
              onClick={handleQuickSubmit}
              disabled={isLoading || nickname.trim().length < 2}
            >
              {isLoading ? "创建中..." : "进入ZANG爱"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              无需密码，创建即可开始锐评
            </p>
          </TabsContent>

          {/* 手机号注册/登录 */}
          <TabsContent value="phone" className="space-y-4 pt-4">
            {/* 模式切换 */}
            <div className="flex gap-2">
              <Button
                variant={authMode === "register" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAuthMode("register");
                  setCodeError("");
                }}
                className="flex-1"
              >
                注册
              </Button>
              <Button
                variant={authMode === "login" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setAuthMode("login");
                  setCodeError("");
                }}
                className="flex-1"
              >
                登录
              </Button>
            </div>

            {/* 手机号输入 */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">手机号</p>
              <Input
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setCodeError("");
                }}
                maxLength={11}
                type="tel"
              />
            </div>

            {/* 验证码输入 */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">验证码</p>
              <div className="flex gap-2">
                <Input
                  placeholder="6位验证码"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setCodeError("");
                  }}
                  maxLength={6}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isLoading || !/^1[3-9]\d{9}$/.test(phone)}
                  className="shrink-0"
                >
                  {countdown > 0 ? `${countdown}s` : "发送验证码"}
                </Button>
              </div>
            </div>

            {/* 注册时显示昵称和头像选择 */}
            {authMode === "register" && (
              <>
                {/* 头像选择 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">选择头像</p>
                  <div className="grid grid-cols-4 gap-2">
                    {DEFAULT_AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => setPhoneAvatar(avatar.id)}
                        className={`relative p-1 rounded-lg border-2 transition-all ${
                          phoneAvatar === avatar.id
                            ? "border-primary bg-primary/10"
                            : "border-transparent hover:border-muted-foreground/30"
                        }`}
                      >
                        <img
                          src={avatar.path}
                          alt={avatar.name}
                          className="w-10 h-10 rounded-full mx-auto"
                        />
                        {phoneAvatar === avatar.id && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 昵称输入 */}
                <div>
                  <p className="text-sm text-muted-foreground mb-2">昵称</p>
                  <Input
                    placeholder="取个犀利的昵称..."
                    value={phoneNickname}
                    onChange={(e) => {
                      setPhoneNickname(e.target.value);
                      setCodeError("");
                    }}
                    maxLength={20}
                  />
                </div>
              </>
            )}

            {/* 错误提示 */}
            {codeError && (
              <p className="text-xs text-destructive">{codeError}</p>
            )}

            {/* 提交按钮 */}
            <Button
              className="w-full"
              onClick={handlePhoneSubmit}
              disabled={isLoading || !phone || !code || (authMode === "register" && phoneNickname.trim().length < 2)}
            >
              {isLoading 
                ? "处理中..." 
                : authMode === "register" 
                  ? "注册并进入" 
                  : "登录"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {authMode === "register" 
                ? "注册后可用手机号登录，数据更安全" 
                : "使用注册手机号快速登录"}
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
