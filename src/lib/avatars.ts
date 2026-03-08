// 葬爱风格默认头像列表
export const DEFAULT_AVATARS = [
  {
    id: "pink",
    name: "粉色葬爱",
    path: "/avatar_pink.png",
    description: "眨眼笑 · 犀利吐槽担当",
  },
  {
    id: "blue",
    name: "蓝色冷漠",
    path: "/avatar_blue.png",
    description: "冷脸 · 互联网嘴替",
  },
  {
    id: "purple",
    name: "紫色emo",
    path: "/avatar_purple.png",
    description: "流泪 · 悲伤吐槽担当",
  },
  {
    id: "green",
    name: "绿色暴躁",
    path: "/avatar_green.png",
    description: "愤怒 · 暴躁喷人担当",
  },
];

// 默认用户列表（用于DEMO）
export const DEFAULT_USERS = [
  {
    id: "user-pink",
    nickname: "葬爱家族第一深情",
    avatar: "/avatar_pink.png",
    bio: "专治各种不服",
  },
  {
    id: "user-blue",
    nickname: "互联网嘴替",
    avatar: "/avatar_blue.png",
    bio: "我说出了你们不敢说的话",
  },
  {
    id: "user-purple",
    nickname: "emo老boy",
    avatar: "/avatar_purple.png",
    bio: "生活太难了，让我吐槽一下",
  },
  {
    id: "user-green",
    nickname: "暴躁老哥在线喷人",
    avatar: "/avatar_green.png",
    bio: "我看谁不爽就喷谁",
  },
];

// 获取随机用户
export function getRandomUser() {
  return DEFAULT_USERS[Math.floor(Math.random() * DEFAULT_USERS.length)];
}

// 获取随机头像
export function getRandomAvatar() {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)].path;
}
