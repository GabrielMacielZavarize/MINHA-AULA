"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase, createProfile } from "@/lib/supabase-db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { GraduationCap, School, User, Mail, Lock, Phone, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "student" as "student" | "teacher",
    subject: "",
    bio: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({ title: "Email inválido", description: "Por favor, insira um endereço de email válido.", variant: "destructive" })
      setLoading(false)
      return
    }

    const phoneDigits = formData.phone.replace(/\D/g, "")
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast({ title: "Telefone inválido", description: "Por favor, insira um número de telefone válido (DDD + número).", variant: "destructive" })
      setLoading(false)
      return
    }

    if (formData.role === "teacher") {
      if (!formData.subject || formData.subject.trim() === "") {
        toast({ title: "Campo obrigatório", description: "Por favor, informe sua matéria principal.", variant: "destructive" })
        setLoading(false)
        return
      }
      if (!formData.bio || formData.bio.trim() === "") {
        toast({ title: "Campo obrigatório", description: "Por favor, escreva uma breve biografia.", variant: "destructive" })
        setLoading(false)
        return
      }
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            phone: formData.phone,
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        await createProfile({
          id: authData.user.id,
          role: formData.role,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.role === 'teacher' ? formData.subject : undefined,
          bio: formData.role === 'teacher' ? formData.bio : undefined,
        })

        toast({ title: "Conta criada com sucesso!", description: "Bem-vindo à plataforma." })
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({ title: "Erro ao criar conta", description: error.message || "Ocorreu um erro inesperado.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo — branding (oculto em mobile) */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[500px] bg-primary flex-col justify-between p-10 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">Minha Aula</span>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-white leading-tight">
              Comece sua jornada
            </h1>
            <p className="text-primary-foreground/75 text-base leading-relaxed">
              Junte-se à plataforma que conecta professores e alunos para uma experiência de ensino completa.
            </p>
          </div>

          <div className="space-y-3">
            {[
              "Gerencie aulas e pagamentos em um só lugar",
              "Agenda visual integrada com toda sua rotina",
              "Acompanhe o progresso de cada aluno",
              "Relatórios financeiros detalhados",
            ].map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-white/80 shrink-0" />
                <p className="text-primary-foreground/80 text-sm">{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-primary-foreground/50 text-xs">
          © {new Date().getFullYear()} Minha Aula. Projeto acadêmico.
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-background overflow-y-auto">
        {/* Logo mobile */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg tracking-tight">Minha Aula</span>
        </div>

        <div className="w-full max-w-[400px] space-y-6">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Crie sua conta</h2>
            <p className="text-muted-foreground text-sm">Preencha os dados abaixo para começar</p>
          </div>

          {/* Seleção de papel */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "teacher" })}
              className={cn(
                "rounded-lg border-2 p-3 flex flex-col items-center gap-1.5 transition-all text-sm font-medium",
                formData.role === "teacher"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-border/60 hover:bg-accent"
              )}
            >
              <School className="h-5 w-5" />
              Sou Professor
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: "student" })}
              className={cn(
                "rounded-lg border-2 p-3 flex flex-col items-center gap-1.5 transition-all text-sm font-medium",
                formData.role === "student"
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-border/60 hover:bg-accent"
              )}
            >
              <GraduationCap className="h-5 w-5" />
              Sou Aluno
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  className="pl-9 h-10"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    className="pl-9 h-10"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {formData.role === "teacher" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-sm font-medium">Matéria Principal</Label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="subject"
                      placeholder="Ex: Matemática, Português..."
                      className="pl-9 h-10"
                      value={formData.subject || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bio" className="text-sm font-medium">Bio</Label>
                  <Input
                    id="bio"
                    placeholder="Breve descrição da sua experiência..."
                    className="h-10"
                    value={formData.bio || ""}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  className="pl-9 pr-10 h-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
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
                  Criando conta...
                </>
              ) : (
                "Criar conta"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Fazer login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
