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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

  // Menu items for teachers
  const teacherMenuItems = [
    { href: "/page/dashboard", label: "Dashboard", icon: TrendingUp },
    { href: "/page/dashboard/classes", label: "Gerenciar Aulas", icon: BookOpen },
    { href: "/page/calendar", label: "Agenda", icon: Calendar },
    { href: "/page/students", label: "Meus Alunos", icon: Users },
    { href: "/page/financial", label: "Financeiro", icon: DollarSign },
    { href: "/page/dashboard/notifications", label: "Notificações", icon: Bell },
    { href: "/page/settings", label: "Configurações", icon: Settings },
  ]

  // Menu items for students
  const studentMenuItems = [
    { href: "/page/dashboard/find-classes", label: "Encontrar Aulas", icon: Search },
    { href: "/page/dashboard/schedule", label: "Minhas Aulas", icon: Calendar },
    { href: "/page/dashboard/teachers", label: "Meus Professores", icon: Users },
    { href: "/page/dashboard/notifications", label: "Notificações", icon: Bell },
    { href: "/page/settings", label: "Configurações", icon: Settings },
  ]

  // Determine menu items based on role
  const menuItems = userProfile?.role === 'student' 
    ? studentMenuItems 
    : userProfile?.role === 'teacher' 
      ? teacherMenuItems 
      : []

  useEffect(() => {
    const checkSession = async () => {
      // Only set loading if we don't have a profile yet
      if (!userProfile) setProfileLoading(true)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }
        
        setCurrentUser(session.user.user_metadata);
        
        // Fetch full profile to get role
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
        // Only reload if we don't have a profile or if it's a different user
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
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }
      
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userProfile?.avatar || "/placeholder-user.jpg"} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {(userProfile?.name || currentUser?.name || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{userProfile?.name || currentUser?.name || "Usuário"}</p>
            <p className="text-sm text-muted-foreground truncate">{userProfile?.email || currentUser?.email || ""}</p>
            {userProfile && (
              <p className="text-xs text-muted-foreground mt-1">
                {userProfile.role === 'teacher' ? 'Professor' : 'Aluno'}
              </p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && item.href !== '/page/dashboard');
            return (
              <Link href={item.href} key={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={`w-full justify-start h-12 ${
                    isActive ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "hover:bg-muted"
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