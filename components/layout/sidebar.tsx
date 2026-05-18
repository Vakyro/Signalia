'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileVideo, BookOpen, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/traducir', label: 'Traducir', icon: FileVideo },
  { href: '/texto-a-sena', label: 'Texto a Sena', icon: Type },
  { href: '/aprender', label: 'Biblioteca', icon: BookOpen },
]

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-card border-r border-border',
        'hidden md:flex flex-col justify-between py-6 sidebar-transition',
        isExpanded ? 'w-[220px]' : 'w-[72px]'
      )}
    >
      <div className="flex flex-col gap-2 px-3">
        {/* Logo */}
        <div
          className={cn(
            'flex items-center gap-3 px-3 py-4 mb-4',
            isExpanded ? 'justify-start' : 'justify-center'
          )}
        >
          <div className="w-10 h-10 rounded-2xl bg-palette-2 flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-foreground">S</span>
          </div>
          {isExpanded && <span className="font-semibold text-lg text-foreground">Signalia</span>}
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-nowrap items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200',
                  'hover:bg-palette-6 active:scale-95',
                  isActive ? 'bg-palette-3 text-foreground' : 'text-muted-foreground',
                  isExpanded ? 'justify-start' : 'justify-center'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
