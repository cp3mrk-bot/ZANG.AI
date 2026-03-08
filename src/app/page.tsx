"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { PostFeed } from "@/components/posts/PostFeed";

// 底部导航组件
function BottomNav({ active }: { active: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex justify-around py-2">
        <Link href="/" className="flex flex-col items-center gap-1 p-2 text-primary">
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

function HomeContent() {
  const [category, setCategory] = useState("all");
  const [newPost, setNewPost] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCategoryChange = useCallback((newCategory: string) => {
    setCategory(newCategory);
    setNewPost(null);
  }, []);

  const handleNewPost = useCallback((post: any) => {
    setNewPost(post);
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Header
        onCategoryChange={handleCategoryChange}
        currentCategory={category}
        onNewPost={handleNewPost}
      />

      <main className="max-w-2xl mx-auto">
        <PostFeed 
          key={refreshKey}
          category={category} 
          newPost={newPost}
        />
      </main>

      {/* 底部导航 */}
      <BottomNav active="home" />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
