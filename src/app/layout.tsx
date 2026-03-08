import type { Metadata } from "next";
import { Inspector } from 'react-dev-inspector';
import { UserProvider } from '@/contexts/UserContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ZANG爱 - 锐评一切',
    template: '%s | ZANG爱',
  },
  description: 'ZANG爱锐评社区 - 用最犀利的眼光，锐评一切值得锐评的事物',
  keywords: [
    'ZANG爱',
    '锐评',
    '吐槽',
    '社区',
    '葬爱',
    '杀马特',
    '小ZANG',
  ],
  authors: [{ name: 'ZANG爱团队' }],
  generator: 'Coze Code',
  openGraph: {
    title: 'ZANG爱 - 锐评一切',
    description: '用最犀利的眼光，锐评一切值得锐评的事物',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="zh-CN">
      <body className={`antialiased min-h-screen bg-background`}>
        <UserProvider>
          {isDev && <Inspector />}
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
