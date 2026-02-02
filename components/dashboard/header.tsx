"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DoorOpen, LogOut, Plus, LayoutDashboard } from "lucide-react"
import Link from "next/link"
import { logout } from "@/lib/api"

interface HeaderProps {
  currentPage: "dashboard" | "sensors"
}

export function Header({ currentPage }: HeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

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
              <Link href="/dashboard">
                <Button
                  variant={currentPage === "dashboard" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Tableau de bord
                </Button>
              </Link>
              <Link href="/sensors">
                <Button
                  variant={currentPage === "sensors" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Capteurs
                </Button>
              </Link>
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
