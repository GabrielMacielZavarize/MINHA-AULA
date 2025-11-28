"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase, createProfile } from "@/lib/supabase-db"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, School, User, Mail, Lock, Phone, Loader2, Eye, EyeOff } from "lucide-react"
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

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um endereço de email válido.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Basic phone validation (10-15 digits)
    const phoneDigits = formData.phone.replace(/\D/g, "")
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast({
        title: "Telefone inválido",
        description: "Por favor, insira um número de telefone válido (DDD + número).",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    if (formData.role === "teacher") {
      if (!formData.subject || formData.subject.trim() === "") {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, informe sua matéria principal.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
      if (!formData.bio || formData.bio.trim() === "") {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, escreva uma breve biografia.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }
    }

    try {
      // 1. Sign up with Supabase Auth
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
        // 2. Create Profile in Database
        await createProfile({
          id: authData.user.id,
          role: formData.role,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: formData.role === 'teacher' ? formData.subject : undefined,
          bio: formData.role === 'teacher' ? formData.bio : undefined,
        })

        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo à plataforma.",
        })

        // 3. Redirect
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Registration error:", error)
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <Card className="w-full max-w-md bg-black/40 backdrop-blur-xl border-white/10 text-white shadow-2xl relative z-10">
        <CardHeader className="space-y-1 text-center pb-4 pt-6">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Crie sua conta
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Preencha os dados abaixo para começar
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-6">
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Role Selection */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-1 transition-all hover:scale-[1.02] ${
                  formData.role === "teacher"
                    ? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                    : "border-white/10 hover:bg-white/5"
                }`}
                onClick={() => setFormData({ ...formData, role: "teacher" })}
              >
                <School className={`w-5 h-5 ${formData.role === "teacher" ? "text-blue-400" : "text-slate-400"}`} />
                <span className={`text-xs font-medium ${formData.role === "teacher" ? "text-blue-100" : "text-slate-400"}`}>Sou Professor</span>
              </div>
              <div
                className={`cursor-pointer rounded-lg border p-2 flex flex-col items-center gap-1 transition-all hover:scale-[1.02] ${
                  formData.role === "student"
                    ? "border-green-500 bg-green-500/20 shadow-lg shadow-green-500/20"
                    : "border-white/10 hover:bg-white/5"
                }`}
                onClick={() => setFormData({ ...formData, role: "student" })}
              >
                <GraduationCap className={`w-5 h-5 ${formData.role === "student" ? "text-green-400" : "text-slate-400"}`} />
                <span className={`text-xs font-medium ${formData.role === "student" ? "text-green-100" : "text-slate-400"}`}>Sou Aluno</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs text-slate-300">Nome Completo</Label>
              <div className="relative group">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  id="name"
                  placeholder="Seu nome"
                  className="pl-9 h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs text-slate-300">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9 h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs text-slate-300">Telefone</Label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    className="pl-9 h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {formData.role === "teacher" && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="subject" className="text-xs text-slate-300">Matéria Principal</Label>
                  <div className="relative group">
                    <School className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                    <Input
                      id="subject"
                      placeholder="Ex: Matemática"
                      className="pl-9 h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                      value={formData.subject || ""}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="bio" className="text-xs text-slate-300">Bio</Label>
                  <Input
                    id="bio"
                    placeholder="Breve descrição..."
                    className="h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                    value={formData.bio || ""}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs text-slate-300">Senha</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="******"
                  className="pl-9 pr-9 h-9 text-sm bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9 w-9 text-slate-400 hover:text-white hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-3 w-3" />
                  ) : (
                    <Eye className="h-3 w-3" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Ocultar senha" : "Mostrar senha"}
                  </span>
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] mt-4 text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center pb-6 pt-0">
          <p className="text-xs text-slate-400">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline transition-colors">
              Fazer login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
