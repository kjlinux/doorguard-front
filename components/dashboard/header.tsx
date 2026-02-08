"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DoorOpen, LogOut, Radio, LayoutDashboard, CreditCard, ClipboardList } from "lucide-react"
import Link from "next/link"
import { logout } from "@/lib/api"

interface HeaderProps {
  currentPage: "dashboard" | "doors" | "badges" | "sensors" | "access-logs"
}

export function Header({ currentPage }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const navItems = [
    { key: "dashboard", href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
    { key: "doors", href: "/doors", label: "Portes", icon: DoorOpen },
    { key: "badges", href: "/badges", label: "Badges", icon: CreditCard },
    { key: "sensors", href: "/sensors", label: "Capteurs", icon: Radio },
    { key: "access-logs", href: "/access-logs", label: "Logs", icon: ClipboardList },
  ]

  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-md">
                <DoorOpen className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">DoorGuard</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.key} href={item.href}>
                  <Button
                    variant={currentPage === item.key ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Deconnexion</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
