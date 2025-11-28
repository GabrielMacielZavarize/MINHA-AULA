import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase, Profile } from "@/lib/supabase-db"
import { Button } from "@/components/ui/button"
import { LogOut, User, Settings, Menu } from "lucide-react"
import { NotificationList } from "@/components/notification-list"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useState } from "react"

interface NavbarProps {
  profile: Profile
}

export function Navbar({ profile }: NavbarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const NavLinks = () => (
    <>
      {profile.role === 'student' && (
        <>
          <Link 
            href="/page/dashboard/find-classes" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Encontrar Aulas
          </Link>
          <Link 
            href="/page/dashboard/schedule" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Minhas Aulas
          </Link>
          <Link 
            href="/page/dashboard/teachers" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Meus Professores
          </Link>
        </>
      )}
      {profile.role === 'teacher' && (
        <>
          <Link 
            href="/dashboard?tab=overview" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            href="/page/dashboard/classes" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Gerenciar Aulas
          </Link>
          <Link 
            href="/dashboard?tab=students" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Meus Alunos
          </Link>
          <Link 
            href="/dashboard?tab=financial" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Financeiro
          </Link>
        </>
      )}
    </>
  )

  return (
    <nav className="border-b border-border bg-background/80 dark:bg-slate-950/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="text-left bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent font-bold text-xl">
                  Minha Aula
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 mt-8">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/dashboard" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Minha Aula
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <NavLinks />
          </div>
        </div>





        <div className="flex items-center gap-4">
          <NotificationList />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden md:inline">{profile.name}</span>
          </div>
          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </nav>
  )
}
