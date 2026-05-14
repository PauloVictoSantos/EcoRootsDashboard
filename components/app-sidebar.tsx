"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileBarChart2, Sparkles, Leaf } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart2 },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-sidebar-border bg-sidebar">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Leaf className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-tight">Amazonas</span>
          <span className="text-xs text-muted-foreground leading-tight">Monitor de plantas</span>
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto p-4 text-xs text-muted-foreground">
        <p className="leading-relaxed">Sistema integrado com Supabase e Gemini AI.</p>
      </div>
    </aside>
  )
}

export function MobileTopbar() {
  const pathname = usePathname()
  return (
    <header className="md:hidden flex items-center justify-between border-b border-border px-4 py-3 bg-sidebar">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Leaf className="h-4 w-4" />
        </div>
        <span className="text-sm font-semibold">Amazonas</span>
      </div>
      <nav className="flex items-center gap-1">
        {items.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md",
                active ? "bg-primary text-primary-foreground" : "text-foreground/70",
              )}
            >
              <Icon className="h-4 w-4" />
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
