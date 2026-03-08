"use client";

import { useEffect, useState, useCallback } from "react";
import { PostCard } from "./PostCard";
import { Spinner } from "@/components/ui/spinner";

interface Post {
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
}

interface PostFeedProps {
  category: string;
  newPost?: Post | null;
}

// 演示数据 - 葬爱风格（用户ID与用户主页一致）
const DEMO_POSTS: Post[] = [
  {
    id: "demo-1",
    content: "iPhone 17出来了，苹果又来收割智商税。什么动态岛Pro、什么钛金属边框Ultra，说到底就是换个壳加个价。128GB起步？我2015年的手机都128GB起步了。60Hz刷新率还在坚持，库克你是想把用户眼睛刷新率也降到60Hz吗？最离谱的是价格，顶配一万三，我选择继续用我的iPhone 13，反正也没有任何升级的动力。",
    images: [],
    category: "digital",
    is_article: false,
    likes: 5678,
    comments_count: 890,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    users: {
      id: "user-1",
      nickname: "葬爱家族第一深情",
      avatar: "/avatar_pink.png",
    },
  },
  {
    id: "demo-2",
    content: "OpenClaw云端部署是什么鬼？号称一键部署AI应用，结果部署了半天全是报错。文档写得像天书，客服回复像复读机『请查看文档』。我花钱是来解决问题的，不是来当你们测试工程师的好吗？",
    images: [],
    category: "ai-product",
    is_article: false,
    likes: 2333,
    comments_count: 456,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    users: {
      id: "user-2",
      nickname: "互联网嘴替",
      avatar: "/avatar_blue.png",
    },
  },
  {
    id: "demo-3",
    content: "苹果Siri是我见过最智障的AI。问它今天天气，它给我放了一首歌。问它设置闹钟，它给我打开了备忘录。库克你是认真的吗？这玩意儿还不如我十年前的诺基亚语音助手。花了六千块买个智障，我真是个大冤种。",
    images: [],
    category: "ai-product",
    is_article: false,
    likes: 1566,
    comments_count: 321,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    users: {
      id: "user-3",
      nickname: "emo老boy",
      avatar: "/avatar_purple.png",
    },
  },
  {
    id: "demo-4",
    content: "索尼PS5 Pro定价什么鬼？光驱版要快五千了，然后你告诉我画质提升『不明显但能感觉到』？这就好比餐厅说这道菜味道提升不明显但贵一倍你也要买单是吧？游戏公司现在是越来越会割韭菜了，主机党真的不配拥有快乐。",
    images: [],
    category: "digital",
    is_article: false,
    likes: 3421,
    comments_count: 567,
    created_at: new Date(Date.now() - 10800000).toISOString(),
    users: {
      id: "user-4",
      nickname: "暴躁老哥在线喷人",
      avatar: "/avatar_green.png",
    },
  },
  {
    id: "demo-5",
    content: "面试官问我五年规划，我说活着。他愣了三秒说我们公司不适合你。笑死，你们公司月薪3500还要我有五年规划？我的规划就是不饿死，你们能满足吗？",
    images: [],
    category: "workplace",
    is_article: false,
    likes: 8921,
    comments_count: 1288,
    created_at: new Date(Date.now() - 14400000).toISOString(),
    users: {
      id: "user-3",
      nickname: "emo老boy",
      avatar: "/avatar_purple.png",
    },
  },
  {
    id: "demo-6",
    content: "内娱现在什么水平？演技不行，唱歌不行，就靠买热搜和粉丝控评。出事了就发声明『已报警处理』，然后呢？没然后了。我们观众的智商就这么被按在地上摩擦。",
    images: [],
    category: "celebrity",
    is_article: false,
    likes: 4455,
    comments_count: 678,
    created_at: new Date(Date.now() - 28800000).toISOString(),
    users: {
      id: "user-4",
      nickname: "暴躁老哥在线喷人",
      avatar: "/avatar_green.png",
    },
  },
  {
    id: "demo-7",
    content: "我妈问我什么时候结婚，我说等我有钱。她说你都28了还等什么？我说等我有钱就不用结婚了。她沉默了。那一刻我突然发现，贫穷才是我最好的避孕药。",
    images: [],
    category: "family",
    is_article: false,
    likes: 12033,
    comments_count: 899,
    created_at: new Date(Date.now() - 43200000).toISOString(),
    users: {
      id: "user-1",
      nickname: "葬爱家族第一深情",
      avatar: "/avatar_pink.png",
    },
  },
  {
    id: "demo-8",
    content: "英伟达RTX 5090定价两万起步？黄仁勋你是真的不给穷人活路。显卡比游戏主机还贵，买回来能干啥？玩斗地主？然后你告诉我AI时代显卡是必需品，那能不能把AI算力免费开放？一边收割玩家一边收割企业，老黄才是真正的币圈大佬吧。",
    images: [],
    category: "digital",
    is_article: false,
    likes: 4567,
    comments_count: 723,
    created_at: new Date(Date.now() - 57600000).toISOString(),
    users: {
      id: "user-2",
      nickname: "互联网嘴替",
      avatar: "/avatar_blue.png",
    },
  },
  {
    id: "demo-9",
    content: "Cursor、Windsurf、Copilot轮番上阵，程序员们以为AI要取代自己。笑死，真正该慌的是PM好吗？我们程序员写的屎山代码AI能看懂个屁，但PM的需求文档AI可太擅长写了。",
    images: [],
    category: "ai-product",
    is_article: false,
    likes: 5678,
    comments_count: 234,
    created_at: new Date(Date.now() - 72000000).toISOString(),
    users: {
      id: "user-2",
      nickname: "互联网嘴替",
      avatar: "/avatar_blue.png",
    },
  },
  {
    id: "demo-10",
    content: "领导说年轻人不要总想着钱，要看成长。我说领导您说得对，所以我决定去您竞争对手那边成长一下，毕竟他们开的工资让我成长空间更大。",
    images: [],
    category: "workplace",
    is_article: false,
    likes: 7890,
    comments_count: 567,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    users: {
      id: "user-4",
      nickname: "暴躁老哥在线喷人",
      avatar: "/avatar_green.png",
    },
  },
];

export function PostFeed({ category, newPost }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);

    try {
      // 获取DEMO帖子（根据分类过滤）
      let demoPosts = DEMO_POSTS;
      if (category !== "all") {
        demoPosts = DEMO_POSTS.filter(p => p.category === category);
      }

      // 尝试从API获取用户帖子
      const res = await fetch(
        `/api/posts?category=${category === "all" ? "" : category}&limit=20`
      );
      const data = await res.json();
      
      // 合并帖子：用户帖子在前，DEMO帖子在后
      let allPosts = [...demoPosts];
      if (data.posts && data.posts.length > 0) {
        // 过滤掉已存在的帖子（避免重复）
        const userPosts = data.posts.filter((p: Post) => 
          !demoPosts.some(d => d.id === p.id)
        );
        allPosts = [...userPosts, ...demoPosts];
      }

      // 按热度排序（点赞数作为简单热度指标）
      allPosts.sort((a, b) => b.likes - a.likes);
      
      setPosts(allPosts);
    } catch (error) {
      // 如果API失败，只使用演示数据
      let filteredPosts = DEMO_POSTS;
      if (category !== "all") {
        filteredPosts = DEMO_POSTS.filter(p => p.category === category);
      }
      setPosts(filteredPosts);
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadPosts();
  }, [category]);

  // 添加新帖子到顶部
  useEffect(() => {
    if (newPost) {
      setPosts(prev => {
        // 避免重复添加
        if (prev.some(p => p.id === newPost.id)) {
          return prev;
        }
        return [newPost, ...prev];
      });
    }
  }, [newPost]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-6 h-6 text-primary" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">暂无帖子，来发第一条锐评吧！</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
