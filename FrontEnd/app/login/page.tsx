"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase-db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Loader2, Eye, EyeOff, GraduationCap, BookOpen, Users, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      router.push("/dashboard")
    } catch (error: any) {
      console.error("Login error:", error)
      toast({
        title: "Erro ao entrar",
        description: error.message === "Invalid login credentials"
          ? "Email ou senha incorretos."
          : error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — branding (oculto em mobile) */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] bg-primary flex-col justify-between p-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Minha Aula</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Conectando professores e alunos
            </h1>
            <p className="text-primary-foreground/75 text-lg leading-relaxed">
              Gerencie suas aulas, acompanhe pagamentos e organize sua agenda em um só lugar.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Gestão de Aulas</p>
                <p className="text-primary-foreground/70 text-sm">Crie, edite e acompanhe todas as suas aulas particulares com facilidade.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Controle de Alunos</p>
                <p className="text-primary-foreground/70 text-sm">Mantenha o histórico completo de cada aluno e seus pagamentos.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-sm">Agenda Inteligente</p>
                <p className="text-primary-foreground/70 text-sm">Visualize seus compromissos por dia, semana ou mês.</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-primary-foreground/50 text-xs">
          © {new Date().getFullYear()} Minha Aula. Projeto acadêmico.
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background">
        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Minha Aula</span>
        </div>

        <div className="w-full max-w-[360px] space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Bem-vindo de volta
            </h2>
            <p className="text-muted-foreground text-sm">
              Entre na sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-9 h-10"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                <Link href="#" className="text-xs text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-10 h-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
