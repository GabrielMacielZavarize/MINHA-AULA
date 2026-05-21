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
  BookOpen,
  Search,
  Bell,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getProfile, type Profile, supabase } from "@/lib/supabase-db"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const teacherMenuItems = [
    { href: "/page/dashboard", label: "Dashboard", icon: TrendingUp },
    { href: "/page/dashboard/classes", label: "Gerenciar Aulas", icon: BookOpen },
    { href: "/page/calendar", label: "Agenda", icon: Calendar },
    { href: "/page/students", label: "Meus Alunos", icon: Users },
    { href: "/page/financial", label: "Financeiro", icon: DollarSign },
    { href: "/page/dashboard/notifications", label: "Notificações", icon: Bell },
    { href: "/page/settings", label: "Configurações", icon: Settings },
  ]

  const studentMenuItems = [
    { href: "/page/dashboard/find-classes", label: "Encontrar Aulas", icon: Search },
    { href: "/page/dashboard/schedule", label: "Minhas Aulas", icon: Calendar },
    { href: "/page/dashboard/teachers", label: "Meus Professores", icon: Users },
    { href: "/page/dashboard/notifications", label: "Notificações", icon: Bell },
    { href: "/page/settings", label: "Configurações", icon: Settings },
  ]

  const menuItems = userProfile?.role === 'student'
    ? studentMenuItems
    : userProfile?.role === 'teacher'
      ? teacherMenuItems
      : []

  useEffect(() => {
    const checkSession = async () => {
      if (!userProfile) setProfileLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        setCurrentUser(session.user.user_metadata);

        const profile = await getProfile(session.user.id);
        if (profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false)
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
        setUserProfile(null)
        setProfileLoading(false)
      } else if (session.user && event !== 'INITIAL_SESSION') {
        if (!userProfile || userProfile.id !== session.user.id) {
          setProfileLoading(true)
          try {
            const profile = await getProfile(session.user.id)
            if (profile) {
              setUserProfile(profile);
            }
          } catch (error) {
            console.error("Error fetching profile:", error);
          } finally {
            setProfileLoading(false)
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const NavItem = ({ item }: { item: typeof teacherMenuItems[0] }) => {
    const Icon = item.icon
    const isActive = pathname === item.href ||
      (pathname?.startsWith(item.href + '/') && item.href !== '/page/dashboard')
    return (
      <Link href={item.href} onClick={() => setSidebarOpen(false)}>
        <div className={cn(
          "flex items-center gap-3 h-9 px-3 rounded-md text-sm font-medium transition-colors cursor-pointer",
          isActive
            ? "bg-[hsl(var(--sidebar-primary)/0.1)] text-[hsl(var(--sidebar-primary))] border-l-2 border-[hsl(var(--sidebar-primary))] pl-[10px] rounded-l-none"
            : "text-[hsl(var(--sidebar-muted-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
        )}>
          <Icon className="h-4 w-4 shrink-0" />
          {item.label}
        </div>
      </Link>
    )
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo / Branding */}
      <div className="px-5 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[hsl(var(--sidebar-primary))] flex items-center justify-center shrink-0">
            <GraduationCap className="h-4 w-4 text-[hsl(var(--sidebar-primary-foreground))]" />
          </div>
          <span className="font-bold text-base tracking-tight text-[hsl(var(--sidebar-foreground))]">
            Minha Aula
          </span>
        </div>
      </div>

      {/* Perfil do usuário */}
      <div className="px-5 py-4 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={userProfile?.avatar || "/placeholder-user.jpg"} />
            <AvatarFallback className="bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))] text-sm font-semibold">
              {(userProfile?.name || currentUser?.name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate text-[hsl(var(--sidebar-foreground))]">
              {userProfile?.name || currentUser?.name || "Usuário"}
            </p>
            <p className="text-xs text-[hsl(var(--sidebar-muted-foreground))] truncate">
              {userProfile?.email || currentUser?.email || ""}
            </p>
          </div>
          {userProfile?.role && (
            <Badge variant="outline" className="text-xs shrink-0 capitalize border-[hsl(var(--sidebar-border))] text-[hsl(var(--sidebar-muted-foreground))]">
              {userProfile.role === 'teacher' ? 'Prof.' : 'Aluno'}
            </Badge>
          )}
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-[hsl(var(--sidebar-border))]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 h-9 w-full px-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b bg-[hsl(var(--sidebar-background))]">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 border-r border-[hsl(var(--sidebar-border))]">
            <SidebarContent />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[hsl(var(--sidebar-primary))] flex items-center justify-center">
            <GraduationCap className="h-3.5 w-3.5 text-[hsl(var(--sidebar-primary-foreground))]" />
          </div>
          <span className="font-bold text-sm">Minha Aula</span>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0">
          <SidebarContent />
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 lg:pl-60">
          <main className="p-4 lg:p-8 max-w-7xl mx-auto">{children}</main>
        </div>
      </div>
    </div>
  )
}
