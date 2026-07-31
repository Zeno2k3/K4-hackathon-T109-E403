import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'VLearn Admin — Glossary',
  description: 'Tra cứu định nghĩa thuật ngữ slide bài giảng — trang quản trị',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="font-sans min-h-screen">
        <div className="min-h-screen flex flex-col">{children}</div>
      </body>
    </html>
  );
}
