"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, User, Mail, Lock, GraduationCap } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher" as "teacher" | "student",
  })

  // Check if user is already logged in
  useEffect(() => {
    const currentUser = localStorage.getItem("minha-aula-current-user")
    if (currentUser) {
      router.push("/")
    }
  }, [router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem("minha-aula-users") || "[]")

      // Find user
      const user = users.find((u: any) => u.email === loginData.email && u.password === loginData.password)

      if (!user) {
        toast({
          title: "Erro",
          description: "Email ou senha incorretos",
          variant: "destructive",
        })
        return
      }

      // Save current user
      localStorage.setItem("minha-aula-current-user", JSON.stringify(user))

      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
        variant: "success",
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer login",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation
      if (!registerData.name || !registerData.email || !registerData.password) {
        toast({
          title: "Erro",
          description: "Preencha todos os campos",
          variant: "destructive",
        })
        return
      }

      if (registerData.password !== registerData.confirmPassword) {
        toast({
          title: "Erro",
          description: "As senhas não coincidem",
          variant: "destructive",
        })
        return
      }

      if (registerData.password.length < 6) {
        toast({
          title: "Erro",
          description: "A senha deve ter pelo menos 6 caracteres",
          variant: "destructive",
        })
        return
      }

      // Get existing users
      const users = JSON.parse(localStorage.getItem("minha-aula-users") || "[]")

      // Check if email already exists
      if (users.find((u: any) => u.email === registerData.email)) {
        toast({
          title: "Erro",
          description: "Este email já está cadastrado",
          variant: "destructive",
        })
        return
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        name: registerData.name,
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
        createdAt: new Date().toISOString(),
      }

      // Save user
      users.push(newUser)
      localStorage.setItem("minha-aula-users", JSON.stringify(users))

      // Auto login
      localStorage.setItem("minha-aula-current-user", JSON.stringify(newUser))

      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso!",
        variant: "success",
      })

      router.push("/")
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-3 shadow-lg">
              <Image src="/logo.png" alt="Minha Aula" width={48} height={48} className="object-contain" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">{isLogin ? "Entrar" : "Criar Conta"}</CardTitle>
            <CardDescription className="text-slate-300">
              {isLogin ? "Acesse sua conta para continuar" : "Crie sua conta para começar"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200">
                  Nome Completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={registerData.name}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email" className="text-slate-200">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-slate-200">
                  Tipo de Conta
                </Label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
                  <Select
                    value={registerData.role}
                    onValueChange={(value: "teacher" | "student") =>
                      setRegisterData((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger className="pl-10 bg-slate-700 border-slate-600 text-white focus:border-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="teacher" className="text-white hover:bg-slate-600">
                        Professor
                      </SelectItem>
                      <SelectItem value="student" className="text-white hover:bg-slate-600">
                        Aluno
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password" className="text-slate-200">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-slate-400 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-200">
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-700"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Não tem uma conta? Criar conta" : "Já tem uma conta? Entrar"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
