import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartLearn - 智能学习助手",
  description: "个性化错题学习平台，让每一道错题都成为进步的阶梯",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 min-h-screen">
        <div className="max-w-md mx-auto min-h-screen bg-slate-50 relative">
          {children}
        </div>
      </body>
    </html>
  );
}
