"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from 'next/link'
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = localStorage.getItem("minha-aula-current-user")
        if (!user) {
          router.push("/login")
          return
        }
        setCurrentUser(JSON.parse(user))
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("minha-aula-current-user")
    router.push("/login")
  }

  const menuItems = [
    { href: "/page/dashboard", label: "Dashboard", icon: TrendingUp },
    { href: "/page/calendar", label: "Agenda", icon: Calendar },
    { href: "/page/students", label: "Alunos", icon: Users },
    { href: "/page/financial", label: "Financeiro", icon: DollarSign },
    { href: "/page/settings", label: "Configurações", icon: Settings },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return null;
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder-user.jpg" />
            <AvatarFallback className="bg-green-500 text-white">
              {currentUser?.name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{currentUser?.name || "Professor"}</p>
            <p className="text-sm text-muted-foreground truncate">{currentUser?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href;
            return (
              <Link href={item.href} key={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-12 ${
                    isActive ? "bg-green-500 hover:bg-green-600 text-white" : "hover:bg-muted"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold">Minha Aula</h1>
        <div className="w-10" />
      </div>

      <div className="flex">
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <SidebarContent />
        </div>

        <div className="flex-1 lg:pl-64">
          <main className="p-4 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  )
}