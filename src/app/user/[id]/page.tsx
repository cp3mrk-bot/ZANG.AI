"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, UserPlus, UserCheck, Settings } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { PostCard } from "@/components/posts/PostCard";
import { Spinner } from "@/components/ui/spinner";

// DEMO用户数据
const DEMO_USERS: Record<string, any> = {
  "user-1": {
    id: "user-1",
    nickname: "葬爱家族第一深情",
    avatar: "/avatar_pink.png",
    bio: "葬爱家族驻ZANG爱办事处首席锐评官 | 专喷各种不服 | 关注我，带你用最犀利的眼光看世界",
    followers_count: 1234,
    following_count: 56,
    posts_count: 2,
    created_at: "2024-01-15T08:00:00.000Z",
  },
  "user-2": {
    id: "user-2",
    nickname: "互联网嘴替",
    avatar: "/avatar_blue.png",
    bio: "你们不敢说的我来帮你们说 | 互联网最强嘴替 | 日常吐槽AI产品、科技圈、职场PUA",
    followers_count: 2345,
    following_count: 23,
    posts_count: 3,
    created_at: "2024-02-20T08:00:00.000Z",
  },
  "user-3": {
    id: "user-3",
    nickname: "emo老boy",
    avatar: "/avatar_purple.png",
    bio: "90后社畜 | 工作使我快乐（假的）| 深夜emo专业户 | 职场吐槽一级选手",
    followers_count: 987,
    following_count: 45,
    posts_count: 2,
    created_at: "2024-03-10T08:00:00.000Z",
  },
  "user-4": {
    id: "user-4",
    nickname: "暴躁老哥在线喷人",
    avatar: "/avatar_green.png",
    bio: "脾气不好但三观很正 | 看不惯就喷 | 内娱劝退大使 | 理性吐槽，感性输出",
    followers_count: 3456,
    following_count: 12,
    posts_count: 3,
    created_at: "2024-01-05T08:00:00.000Z",
  },
};

// DEMO帖子数据（按用户分组）
const DEMO_USER_POSTS: Record<string, any[]> = {
  "user-1": [
    {
      id: "demo-1",
      content: "iPhone 17出来了，苹果又来收割智商税。什么动态岛Pro、什么钛金属边框Ultra，说到底就是换个壳加个价。128GB起步？我2015年的手机都128GB起步了。60Hz刷新率还在坚持，库克你是想把用户眼睛刷新率也降到60Hz吗？最离谱的是价格，顶配一万三，我选择继续用我的iPhone 13，反正也没有任何升级的动力。",
      images: [],
      category: "digital",
      is_article: false,
      likes: 5678,
      comments_count: 890,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      users: { id: "user-1", nickname: "葬爱家族第一深情", avatar: "/avatar_pink.png" },
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
      users: { id: "user-1", nickname: "葬爱家族第一深情", avatar: "/avatar_pink.png" },
    },
  ],
  "user-2": [
    {
      id: "demo-2",
      content: "OpenClaw云端部署是什么鬼？号称一键部署AI应用，结果部署了半天全是报错。文档写得像天书，客服回复像复读机『请查看文档』。我花钱是来解决问题的，不是来当你们测试工程师的好吗？",
      images: [],
      category: "ai-product",
      is_article: false,
      likes: 2333,
      comments_count: 456,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      users: { id: "user-2", nickname: "互联网嘴替", avatar: "/avatar_blue.png" },
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
      users: { id: "user-2", nickname: "互联网嘴替", avatar: "/avatar_blue.png" },
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
      users: { id: "user-2", nickname: "互联网嘴替", avatar: "/avatar_blue.png" },
    },
  ],
  "user-3": [
    {
      id: "demo-3",
      content: "苹果Siri是我见过最智障的AI。问它今天天气，它给我放了一首歌。问它设置闹钟，它给我打开了备忘录。库克你是认真的吗？这玩意儿还不如我十年前的诺基亚语音助手。花了六千块买个智障，我真是个大冤种。",
      images: [],
      category: "ai-product",
      is_article: false,
      likes: 1566,
      comments_count: 321,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      users: { id: "user-3", nickname: "emo老boy", avatar: "/avatar_purple.png" },
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
      users: { id: "user-3", nickname: "emo老boy", avatar: "/avatar_purple.png" },
    },
  ],
  "user-4": [
    {
      id: "demo-4",
      content: "索尼PS5 Pro定价什么鬼？光驱版要快五千了，然后你告诉我画质提升『不明显但能感觉到』？这就好比餐厅说这道菜味道提升不明显但贵一倍你也要买单是吧？游戏公司现在是越来越会割韭菜了，主机党真的不配拥有快乐。",
      images: [],
      category: "digital",
      is_article: false,
      likes: 3421,
      comments_count: 567,
      created_at: new Date(Date.now() - 10800000).toISOString(),
      users: { id: "user-4", nickname: "暴躁老哥在线喷人", avatar: "/avatar_green.png" },
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
      users: { id: "user-4", nickname: "暴躁老哥在线喷人", avatar: "/avatar_green.png" },
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
      users: { id: "user-4", nickname: "暴躁老哥在线喷人", avatar: "/avatar_green.png" },
    },
  ],
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const userId = params.id as string;

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);

      // 先检查是否是DEMO用户
      if (DEMO_USERS[userId]) {
        setUser(DEMO_USERS[userId]);
        setPosts(DEMO_USER_POSTS[userId] || []);
        setIsLoading(false);
        return;
      }

      // 否则从API获取
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (data.user) {
          setUser(data.user);

          // 获取用户帖子
          const postsRes = await fetch(`/api/posts?userId=${userId}&limit=20`);
          const postsData = await postsRes.json();
          setPosts(postsData.posts || []);
        }
      } catch (error) {
        console.error("Load user failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  // 检查关注状态
  useEffect(() => {
    if (currentUser && user && currentUser.id !== user.id) {
      fetch(`/api/follow?followerId=${currentUser.id}&followingId=${user.id}`)
        .then(res => res.json())
        .then(data => setIsFollowing(data.isFollowing))
        .catch(console.error);
    }
  }, [currentUser, user]);

  const handleFollow = async () => {
    if (!currentUser) {
      alert("请先登录");
      return;
    }

    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followerId: currentUser.id,
          followingId: user.id,
        }),
      });
      const data = await res.json();
      setIsFollowing(data.followed);

      // 更新粉丝数
      setUser({
        ...user,
        followers_count: data.followed
          ? user.followers_count + 1
          : Math.max(0, user.followers_count - 1),
      });
    } catch (error) {
      console.error("Follow failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-muted-foreground">用户不存在</p>
        <Button variant="link" onClick={() => router.push("/")}>
          返回首页
        </Button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">个人主页</h1>
        </div>
      </div>

      {/* 用户信息 */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex gap-4">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-2xl">
              {user.nickname?.[0] || "匿"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">{user.nickname}</h2>
              {isOwnProfile && (
                <Badge variant="secondary" className="text-xs">我</Badge>
              )}
            </div>

            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1">{user.bio}</p>
            )}

            <div className="flex items-center gap-4 mt-3">
              <button className="text-center">
                <div className="font-bold">{user.posts_count || 0}</div>
                <div className="text-xs text-muted-foreground">帖子</div>
              </button>
              <button className="text-center">
                <div className="font-bold">{user.followers_count || 0}</div>
                <div className="text-xs text-muted-foreground">粉丝</div>
              </button>
              <button className="text-center">
                <div className="font-bold">{user.following_count || 0}</div>
                <div className="text-xs text-muted-foreground">关注</div>
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-2">
            {isOwnProfile ? (
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-1" />
                编辑资料
              </Button>
            ) : (
              <Button
                size="sm"
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4 mr-1" />
                    已关注
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-1" />
                    关注
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 帖子列表 */}
      <div className="max-w-2xl mx-auto">
        <Tabs defaultValue="posts">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0">
            <TabsTrigger
              value="posts"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              帖子 {user.posts_count || 0}
            </TabsTrigger>
            <TabsTrigger
              value="likes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              喜欢
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {posts.length > 0 ? (
              posts.map(post => <PostCard key={post.id} post={post} />)
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                暂无帖子
              </div>
            )}
          </TabsContent>

          <TabsContent value="likes" className="mt-0">
            <div className="text-center py-12 text-muted-foreground">
              暂无喜欢的帖子
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
