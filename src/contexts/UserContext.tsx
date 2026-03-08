"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEFAULT_AVATARS } from "@/lib/avatars";

interface User {
  id: string;
  nickname: string;
  avatar: string;
  bio: string;
  phone?: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  createAccount: (nickname: string, avatarId: string) => Promise<User | null>;
  loginWithPhone: (user: User) => void;
  registerWithPhone: (user: User) => void;
}

const UserContext = createContext<UserContextType | null>(null);

const STORAGE_KEY = "zang_ai_user";

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时从localStorage读取用户信息
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const userData = JSON.parse(stored);
        setUser(userData);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const createAccount = async (nickname: string, avatarId: string): Promise<User | null> => {
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, avatarId }),
      });
      const data = await res.json();
      if (data.user) {
        login(data.user);
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  };

  const loginWithPhone = (userData: User) => {
    login(userData);
  };

  const registerWithPhone = (userData: User) => {
    login(userData);
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, logout, createAccount, loginWithPhone, registerWithPhone }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
