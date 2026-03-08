"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, Clock, Flame, ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { LoginModal } from "@/components/auth/LoginModal";

// 热门话题
const HOT_TOPICS = [
  { id: 1, name: "AI取代人类", count: 2847, trend: "up" },
  { id: 2, name: "35岁程序员", count: 1923, trend: "up" },
  { id: 3, name: "加班文化", count: 1567, trend: "down" },
  { id: 4, name: "相亲奇遇", count: 1234, trend: "up" },
  { id: 5, name: "领导PUA", count: 987, trend: "stable" },
  { id: 6, name: "内卷现状", count: 876, trend: "up" },
  { id: 7, name: "房价下跌", count: 765, trend: "down" },
  { id: 8, name: "考公热", count: 654, trend: "up" },
];

interface Post {
  id: string;
  content: string;
  images: string[];
  category: string;
  likes: number;
  comments_count: number;
  created_at: string;
  users: {
    id: string;
    nickname: string;
    avatar: string;
  };
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
        <Link href="/discover" className="flex flex-col items-center gap-1 p-2 text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <span className="text-xs">发现</span>
        </Link>
        <Link href="/me" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
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

export default function DiscoverPage() {
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // 从localStorage加载最近搜索
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // 搜索
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/posts?search=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setSearchResults(data.posts || []);

      // 保存搜索历史
      const newSearches = [query.trim(), ...recentSearches.filter(s => s !== query.trim())].slice(0, 10);
      setRecentSearches(newSearches);
      localStorage.setItem("recentSearches", JSON.stringify(newSearches));
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  }, [recentSearches]);

  // 点击话题搜索
  const handleTopicClick = (topic: string) => {
    setSearchQuery(topic);
    handleSearch(topic);
  };

  // 清除搜索历史
  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* 顶部搜索栏 */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1 relative">
              <Input
                placeholder="搜索话题、用户、内容..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery);
                  }
                }}
                className="pr-10"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={() => handleSearch(searchQuery)}
                disabled={isSearching}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">搜索结果</h2>
            <div className="space-y-4">
              {searchResults.map((post) => (
                <Link
                  key={post.id}
                  href={`/user/${post.users.id}?postId=${post.id}`}
                  className="block p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <img
                      src={post.users.avatar || "/avatar_pink.png"}
                      alt={post.users.nickname}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="text-sm font-medium">{post.users.nickname}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm line-clamp-3">{post.content}</p>
                  {post.images?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {post.images.slice(0, 3).map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>❤️ {post.likes}</span>
                    <span>💬 {post.comments_count}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 热门话题 */}
        {!searchQuery && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold">热门话题</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {HOT_TOPICS.map((topic, index) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicClick(topic.name)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 rounded-full hover:bg-secondary transition-colors"
                >
                  <span className="text-sm font-medium text-primary">{index + 1}</span>
                  <span className="text-sm">{topic.name}</span>
                  {topic.trend === "up" && (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  )}
                  <span className="text-xs text-muted-foreground">{topic.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 最近搜索 */}
        {!searchQuery && recentSearches.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-medium text-muted-foreground">最近搜索</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={clearHistory} className="text-xs">
                清除
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="cursor-pointer hover:bg-secondary"
                  onClick={() => {
                    setSearchQuery(search);
                    handleSearch(search);
                  }}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 搜索提示 */}
        {searchQuery && searchResults.length === 0 && !isSearching && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>没有找到相关内容</p>
            <p className="text-sm">试试其他关键词</p>
          </div>
        )}
      </main>

      <BottomNav active="discover" />
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
}
