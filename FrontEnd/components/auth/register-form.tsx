"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { User, GraduationCap, Mail, Lock, Eye, EyeOff, UserPlus } from "lucide-react"
import Image from "next/image"

interface RegisterFormProps {
  onRegister: (userData: { email: string; name: string; role: "teacher" | "student" }) => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher" as "teacher" | "student",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      })
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Verificar se usuário já existe
      const users = JSON.parse(localStorage.getItem("minha-aula-users") || "[]")
      const existingUser = users.find((u: any) => u.email === formData.email && u.role === formData.role)

      if (existingUser) {
        toast({
          title: "Erro",
          description: "Já existe um usuário com este email e tipo",
          variant: "destructive",
        })
        return
      }

      // Criar novo usuário
      const newUser = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        createdAt: new Date().toISOString(),
      }

      users.push(newUser)
      localStorage.setItem("minha-aula-users", JSON.stringify(users))

      onRegister({
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      })

      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso!",
        variant: "success",
      })
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl p-3 shadow-lg">
              <Image src="/logo.png" alt="Minha Aula" width={48} height={48} className="object-contain" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">Criar Conta</CardTitle>
            <CardDescription className="text-gray-400 mt-2">Cadastre-se para começar a usar</CardDescription>
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

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300 text-sm font-medium">
                Nome Completo
              </Label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-12 pl-10 bg-gray-700 border-0 border-b-2 border-gray-600 rounded-none text-white placeholder-gray-400 focus:border-blue-500 focus:ring-0"
                  required
                />
              </div>
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
                  placeholder="Mínimo 6 caracteres"
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

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-300 text-sm font-medium">
                Confirmar Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite a senha novamente"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className="h-12 pl-10 pr-10 bg-gray-700 border-0 border-b-2 border-gray-600 rounded-none text-white placeholder-gray-400 focus:border-blue-500 focus:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              {loading ? "Criando conta..." : "Criar Conta"}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Já tem uma conta? Faça login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
