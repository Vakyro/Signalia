'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileVideo, BookOpen, Type, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/traducir', label: 'Traducir', icon: FileVideo },
  { href: '/texto-a-sena', label: 'Texto', icon: Type },
  { href: '/aprender', label: 'Biblioteca', icon: BookOpen },
  { href: '/juego', label: 'Juego', icon: Gamepad2 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl min-w-[64px] min-h-[48px]',
                'transition-all duration-200 active:scale-95',
                isActive ? 'bg-palette-3 text-foreground' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
