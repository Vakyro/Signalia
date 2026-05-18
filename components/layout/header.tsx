'use client'

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>
    </header>
  )
}
