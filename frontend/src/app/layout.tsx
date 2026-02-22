import type { Metadata } from 'next';
import './globals.css';
import { I18nProvider } from '../components/I18nProvider';

export const metadata: Metadata = {
  title: 'Skill Gobang - 技能五子棋',
  description: 'A skill-based Gobang game with AI opponent powered by LLM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className="min-h-screen bg-[#0f0f1a] text-slate-200">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
