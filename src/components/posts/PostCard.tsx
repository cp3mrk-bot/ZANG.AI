"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Heart,
  Share2,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";

const CATEGORY_LABELS: Record<string, string> = {
  "ai-product": "AI产品",
  digital: "数码产品",
  celebrity: "明星八卦",
  workplace: "职场",
  family: "家庭关系",
  other: "其他",
};

interface PostCardProps {
  post: {
    id: string;
    content: string;
    images?: string[];
    category: string;
    is_article: boolean;
    article_url?: string;
    likes: number;
    comments_count: number;
    created_at: string;
    users: {
      id: string;
      nickname: string;
      avatar?: string;
    };
  };
  onAIRoast?: (postId: string) => void;
}

export function PostCard({ post, onAIRoast }: PostCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiRoast, setAiRoast] = useState("");
  const [isAIRoasting, setIsAIRoasting] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  const handleLoadComments = async () => {
    if (showComments) {
      setShowComments(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
      setShowComments(true);
    } catch (error) {
      console.error("Load comments failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    if (!user) {
      // 提示用户登录
      alert("请先登录后再评论");
      return;
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        // 添加用户信息到评论
        const commentWithUser = {
          ...data.comment,
          users: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
          },
        };
        setComments([...comments, commentWithUser]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Add comment failed:", error);
    }
  };

  const handleAIRoast = async () => {
    setIsAIRoasting(true);
    setAiRoast("");

    try {
      const res = await fetch("/api/ai/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: post.content,
          context: `这是一条来自${CATEGORY_LABELS[post.category] || "其他"}分类的帖子`,
        }),
      });

      const reader = res.body?.getReader();
      let content = "";

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
                  content += json.content;
                  setAiRoast(content);
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

  // 发布AI锐评到评论区
  const handlePublishAIRoast = async () => {
    if (!aiRoast.trim() || !user) return;

    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🤖 小ZANG锐评：${aiRoast}`,
          userId: user.id,
        }),
      });
      const data = await res.json();
      if (data.comment) {
        // 添加用户信息到评论
        const commentWithUser = {
          ...data.comment,
          users: {
            id: user.id,
            nickname: user.nickname,
            avatar: user.avatar,
          },
        };
        setComments([...comments, commentWithUser]);
        setShowComments(true);
        setAiRoast(""); // 清空AI锐评
      }
    } catch (error) {
      console.error("Publish AI roast failed:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "刚刚";
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString("zh-CN");
  };

  const goToUserProfile = (userId: string) => {
    router.push(`/user/${userId}`);
  };

  return (
    <div className="bg-card border-b border-border p-4 transition-colors hover:bg-muted/30">
      {/* 用户信息 */}
      <div className="flex items-start gap-3">
        <button 
          onClick={() => goToUserProfile(post.users.id)}
          className="shrink-0"
        >
          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
            <AvatarImage src={post.users.avatar} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold">
              {post.users.nickname?.[0] || "匿"}
            </AvatarFallback>
          </Avatar>
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button 
              onClick={() => goToUserProfile(post.users.id)}
              className="font-bold text-foreground hover:text-primary transition-colors"
            >
              {post.users.nickname}
            </button>
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[post.category] || "其他"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTime(post.created_at)}
            </span>
          </div>

          {/* 帖子内容 */}
          <div className="mt-2">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
            
            {post.is_article && post.article_url && (
              <a
                href={post.article_url}
                className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                查看完整文章
              </a>
            )}

            {/* 图片 */}
            {post.images && post.images.length > 0 && (
              <div className={`grid gap-2 mt-3 ${
                post.images.length === 1 ? "grid-cols-1" :
                post.images.length === 2 ? "grid-cols-2" :
                "grid-cols-3"
              }`}>
                {post.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                ))}
              </div>
            )}
          </div>

          {/* AI锐评 */}
          {(aiRoast || isAIRoasting) && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="w-4 h-4" />
                  小ZANG锐评
                </div>
                {!isAIRoasting && aiRoast && user && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handlePublishAIRoast}
                  >
                    发布到评论区
                  </Button>
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {aiRoast || "思考中..."}
                {isAIRoasting && (
                  <span className="inline-block w-1 h-4 bg-primary ml-0.5 animate-pulse" />
                )}
              </p>
            </div>
          )}

          {/* 互动按钮 */}
          <div className="flex items-center gap-4 mt-3">
            <Button
              variant="ghost"
              size="sm"
              className={`gap-1.5 px-2 ${isLiked ? "text-destructive" : ""}`}
              onClick={handleLike}
            >
              <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
              {likes > 0 && <span>{likes}</span>}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={handleLoadComments}
            >
              <MessageCircle className="w-4 h-4" />
              {post.comments_count > 0 && <span>{post.comments_count}</span>}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={handleAIRoast}
              disabled={isAIRoasting}
            >
              <Sparkles className={`w-4 h-4 ${isAIRoasting ? "animate-pulse" : ""}`} />
              @小ZANG锐评
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 px-2"
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* 评论区 */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-border">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">加载中...</p>
              ) : (
                <>
                  {comments.length > 0 ? (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <button onClick={() => goToUserProfile(comment.users?.id || comment.user_id)}>
                            <Avatar className="w-6 h-6 cursor-pointer hover:ring-1 hover:ring-primary/50">
                              <AvatarImage src={comment.users?.avatar} />
                              <AvatarFallback className="text-xs bg-muted">
                                {comment.users?.nickname?.[0] || "匿"}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => goToUserProfile(comment.users?.id || comment.user_id)}
                                className="text-sm font-medium hover:text-primary transition-colors"
                              >
                                {comment.users?.nickname || "匿名用户"}
                              </button>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground mt-0.5">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无评论，来发表第一条锐评吧！</p>
                  )}

                  {/* 评论输入 */}
                  <div className="mt-3 flex gap-2">
                    <Textarea
                      placeholder={user ? "写下你的锐评..." : "登录后评论..."}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px] text-sm"
                      disabled={!user}
                    />
                    <Button 
                      size="sm" 
                      onClick={handleAddComment}
                      disabled={!user || !newComment.trim()}
                    >
                      发送
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
