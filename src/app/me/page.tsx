"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  MessageSquare, 
  Heart, 
  Bookmark,
  ChevronRight,
  LogOut,
  Edit3,
  Camera,
  Upload
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { LoginModal } from "@/components/auth/LoginModal";
import { DEFAULT_AVATARS } from "@/lib/avatars";

interface UserPost {
  id: string;
  content: string;
  images: string[];
  category: string;
  likes: number;
  comments_count: number;
  created_at: string;
}

// 压缩图片函数
async function compressImage(file: File, maxWidth = 200, maxHeight = 200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // 计算缩放比例
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to compress image"));
            }
          },
          "image/jpeg",
          0.8
        );
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 底部导航组件
function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex justify-around py-2">
        <Link href="/" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span className="text-xs">首页</span>
        </Link>
        <Link href="/discover" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <span className="text-xs">发现</span>
        </Link>
        <Link href="/me" className="flex flex-col items-center gap-1 p-2 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span className="text-xs">我的</span>
        </Link>
      </div>
    </nav>
  );
}

// 菜单项组件
function MenuItem({ icon: Icon, label, value, onClick }: {
  icon: React.ElementType;
  label: string;
  value?: string | number;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground">
        {value !== undefined && <span className="text-sm">{value}</span>}
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  );
}

export default function MePage() {
  const router = useRouter();
  const { user, logout } = useUser();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 获取用户帖子
  useEffect(() => {
    if (user) {
      fetchUserPosts();
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts?userId=${user.id}`);
      const data = await res.json();
      setUserPosts(data.posts || []);
    } catch (error) {
      console.error("Fetch posts failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // 处理自定义头像上传
  const handleCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("只支持 JPG、PNG、GIF、WebP 格式");
      return;
    }

    // 验证文件大小 (最大 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过5MB");
      return;
    }

    setIsUploading(true);
    try {
      // 压缩图片
      const compressedBlob = await compressImage(file, 200, 200);
      const compressedFile = new File([compressedBlob], file.name, { type: "image/jpeg" });

      // 上传图片
      const formData = new FormData();
      formData.append("file", compressedFile);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (uploadData.url) {
        // 更新用户头像
        const updateRes = await fetch("/api/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, avatar: uploadData.url }),
        });

        if (updateRes.ok) {
          const updateData = await updateRes.json();
          // 更新本地用户信息
          localStorage.setItem("zang_ai_user", JSON.stringify(updateData.user));
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Upload avatar failed:", error);
      alert("上传失败，请重试");
    } finally {
      setIsUploading(false);
      setShowAvatarPicker(false);
    }
  };

  const handleAvatarChange = async (avatarId: string) => {
    if (!user) return;
    
    const avatar = DEFAULT_AVATARS.find(a => a.id === avatarId)?.path || "/avatar_pink.png";
    
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, avatar }),
      });
      
      if (res.ok) {
        // 更新本地用户信息
        const updatedUser = { ...user, avatar };
        localStorage.setItem("zang_ai_user", JSON.stringify(updatedUser));
        window.location.reload();
      }
    } catch (error) {
      console.error("Update avatar failed:", error);
    }
    
    setShowAvatarPicker(false);
  };

  // 未登录状态
  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-16">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <h1 className="text-lg font-semibold">我的</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">登录/注册</h2>
            <p className="text-muted-foreground mb-6">登录后解锁更多功能</p>
            <Button onClick={() => setIsLoginModalOpen(true)}>
              立即登录
            </Button>
          </div>
        </main>

        <BottomNav active="me" />
        <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
      </div>
    );
  }

  // 已登录状态
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* 顶部 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">我的</h1>
          <Button variant="ghost" size="sm">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* 用户信息卡片 */}
        <div className="p-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-4">
              {/* 头像 */}
              <div className="relative">
                <img
                  src={user.avatar || "/avatar_pink.png"}
                  alt={user.nickname}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <button
                  onClick={() => setShowAvatarPicker(true)}
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              
              {/* 信息 */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{user.nickname}</h2>
                  {user.phone && (
                    <Badge variant="outline" className="text-xs">已绑定</Badge>
                  )}
                </div>
                {user.bio ? (
                  <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">还没有个人简介</p>
                )}
              </div>
            </div>

            {/* 统计 */}
            <div className="flex justify-around mt-4 pt-4 border-t border-border">
              <Link href={`/user/${user.id}`} className="text-center">
                <div className="text-xl font-bold">{user.posts_count || 0}</div>
                <div className="text-xs text-muted-foreground">帖子</div>
              </Link>
              <Link href={`/user/${user.id}?tab=following`} className="text-center">
                <div className="text-xl font-bold">{user.following_count || 0}</div>
                <div className="text-xs text-muted-foreground">关注</div>
              </Link>
              <Link href={`/user/${user.id}?tab=followers`} className="text-center">
                <div className="text-xl font-bold">{user.followers_count || 0}</div>
                <div className="text-xs text-muted-foreground">粉丝</div>
              </Link>
            </div>
          </div>
        </div>

        {/* 功能菜单 */}
        <div className="bg-card border-y border-border">
          <MenuItem icon={MessageSquare} label="我的帖子" value={userPosts.length} onClick={() => router.push(`/user/${user.id}`)} />
          <MenuItem icon={Heart} label="我的点赞" value={0} />
          <MenuItem icon={Bookmark} label="我的收藏" value={0} />
        </div>

        <div className="mt-4 bg-card border-y border-border">
          <MenuItem icon={Edit3} label="编辑资料" onClick={() => {}} />
          <MenuItem icon={Settings} label="设置" onClick={() => {}} />
        </div>

        {/* 退出登录 */}
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </Button>
        </div>
      </main>

      {/* 头像选择弹窗 */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border p-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">选择头像</h3>
            
            {/* 上传自定义头像 */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleCustomAvatarUpload}
            />
            <Button
              variant="outline"
              className="w-full mb-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? "上传中..." : "上传自定义头像"}
            </Button>

            <div className="text-xs text-muted-foreground text-center mb-3">
              支持 JPG、PNG、GIF、WebP，最大 5MB
            </div>

            <div className="text-sm text-muted-foreground mb-2">或选择默认头像：</div>
            <div className="grid grid-cols-4 gap-2">
              {DEFAULT_AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarChange(avatar.id)}
                  className={`relative p-1 rounded-lg border-2 transition-all ${
                    user.avatar === avatar.path
                      ? "border-primary bg-primary/10"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                >
                  <img
                    src={avatar.path}
                    alt={avatar.name}
                    className="w-12 h-12 rounded-full mx-auto object-cover"
                  />
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => setShowAvatarPicker(false)}
            >
              取消
            </Button>
          </div>
        </div>
      )}

      <BottomNav active="me" />
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
}
