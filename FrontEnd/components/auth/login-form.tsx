"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { User, GraduationCap, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

interface LoginFormProps {
  onLogin: (userData: { email: string; name: string; role: "teacher" | "student" }) => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "teacher" as "teacher" | "student",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Simular login - verificar se usuário existe no localStorage
      const users = JSON.parse(localStorage.getItem("minha-aula-users") || "[]")
      const user = users.find(
        (u: any) => u.email === formData.email && u.password === formData.password && u.role === formData.role,
      )

      if (user) {
        onLogin({
          email: user.email,
          name: user.name,
          role: user.role,
        })
        toast({
          title: "Sucesso",
          description: "Login realizado com sucesso!",
          variant: "success",
        })
      } else {
        toast({
          title: "Erro",
          description: "Email, senha ou tipo de usuário incorretos",
          variant: "destructive",
        })
      }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-3 shadow-lg">
              <Image src="/logo.png" alt="Minha Aula" width={48} height={48} className="object-contain" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Entrar</CardTitle>
            <CardDescription className="text-gray-400 mt-2">Acesse sua conta para continuar</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-300 text-sm font-medium">
                Tipo de Usuário
              </Label>
              <Select
                value={formData.role}
                onValueChange={(value: "teacher" | "student") => setFormData((prev) => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="h-12 bg-gray-700 border-gray-600 text-white focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="teacher" className="text-white hover:bg-gray-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Professor
                    </div>
                  </SelectItem>
                  <SelectItem value="student" className="text-white hover:bg-gray-600">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Aluno
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="h-12 pl-10 bg-gray-700 border-0 border-b-2 border-gray-600 rounded-none text-white placeholder-gray-400 focus:border-blue-500 focus:ring-0"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="h-12 pl-10 pr-10 bg-gray-700 border-0 border-b-2 border-gray-600 rounded-none text-white placeholder-gray-400 focus:border-blue-500 focus:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToRegister}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Não tem uma conta? Cadastre-se
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
