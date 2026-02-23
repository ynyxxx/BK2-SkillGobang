import type { Metadata } from 'next';
import './globals.css';
import { LangProvider } from '../components/LangContext';

export const metadata: Metadata = {
  title: 'Skill Gobang - 技能五子棋',
  description: 'A skill-based Gobang game with AI opponent powered by LLM',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0f0f1a] text-slate-200">
        <LangProvider>{children}</LangProvider>
      </body>
    </html>
  );
}
