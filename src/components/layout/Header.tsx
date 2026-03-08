"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImagePlus, Sparkles, X, Send, User, LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { LoginModal } from "@/components/auth/LoginModal";

// 分类选项
const CATEGORIES = [
  { value: "all", label: "全部" },
  { value: "ai-product", label: "AI产品" },
  { value: "digital", label: "数码产品" },
  { value: "celebrity", label: "明星八卦" },
  { value: "workplace", label: "职场" },
  { value: "family", label: "家庭关系" },
  { value: "other", label: "其他" },
];

interface HeaderProps {
  onCategoryChange: (category: string) => void;
  currentCategory: string;
  onNewPost: (post: any) => void;
}

export function Header({ onCategoryChange, currentCategory, onNewPost }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useUser();
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("other");
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAIRoasting, setIsAIRoasting] = useState(false);

  const handleGoToProfile = () => {
    if (user) {
      router.push(`/user/${user.id}`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setImages([...images, data.url]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleAIRoast = async () => {
    if (!content.trim()) return;
    setIsAIRoasting(true);

    try {
      const res = await fetch("/api/ai/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content }),
      });

      const reader = res.body?.getReader();
      let aiContent = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const json = JSON.parse(line.slice(6));
                if (json.content) {
                  aiContent += json.content;
                  setContent(aiContent);
                }
              } catch {}
            }
          }
        }
      }
    } catch (error) {
      console.error("AI roast failed:", error);
    } finally {
      setIsAIRoasting(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (!user) {
      setIsPostDialogOpen(false);
      setIsLoginModalOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          images,
          category,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.post) {
        // 添加用户信息到新帖子
        const postWithUser = {
          ...data.post,
          users: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
          },
        };
        onNewPost(postWithUser);
        setContent("");
        setImages([]);
        setCategory("other");
        setIsPostDialogOpen(false);
      }
    } catch (error) {
      console.error("Post failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostClick = () => {
    if (!user) {
      setIsLoginModalOpen(true);
    } else {
      setIsPostDialogOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="ZANG爱 Logo"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="text-xl font-black tracking-tight text-primary">
                ZANG爱
              </div>
              <Badge variant="secondary" className="text-xs">
                锐评一切
              </Badge>
            </Link>

            <div className="flex items-center gap-2">
              <Button size="sm" className="gap-1.5" onClick={handlePostClick}>
                <Send className="w-4 h-4" />
                发帖
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-muted transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.avatar}
                        alt={user.nickname}
                        width={28}
                        height={28}
                        className="rounded-full"
                      />
                      <span className="text-sm font-medium hidden sm:inline">
                        {user.nickname}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="gap-2" onClick={handleGoToProfile}>
                      <User className="w-4 h-4" />
                      个人主页
                    </DropdownMenuItem>
                    <DropdownMenuItem className="gap-2 text-destructive" onClick={logout}>
                      <LogOut className="w-4 h-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  登录
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={currentCategory === cat.value ? "default" : "ghost"}
                size="sm"
                onClick={() => onCategoryChange(cat.value)}
                className="shrink-0"
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* 发帖弹窗 */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent className="max-w-md">
          <div className="space-y-4">
            <h3 className="text-lg font-bold">发表锐评</h3>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.slice(1).map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Textarea
                placeholder="锐评一下？犀利一点..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-32 resize-none"
                maxLength={500}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {content.length}/300
              </div>
            </div>

            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img}
                      alt=""
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <ImagePlus className="w-4 h-4 mr-1" />
                      图片
                    </span>
                  </Button>
                </label>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIRoast}
                  disabled={isAIRoasting || !content.trim()}
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  {isAIRoasting ? "AI思考中..." : "帮我锐评"}
                </Button>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={isLoading || !content.trim()}
                size="sm"
              >
                {isLoading ? "发布中..." : "发布"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 登录弹窗 */}
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </>
  );
}
