'use client'

import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { Header } from './header'

interface AppLayoutProps {
  children: React.ReactNode
  title: string
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />

      <main className="md:ml-[72px] pb-24 md:pb-0">
        <Header title={title} />
        <div className="animate-fade-in-up">{children}</div>
      </main>
    </div>
  )
}
