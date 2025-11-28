"use client"

import { useState, useEffect } from "react"
import { User, Bell, Globe, Moon, Sun, Monitor, Save, Check, Loader2, Copy, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "@/lib/theme"
import { useI18n } from "@/lib/i18n"
import { toast } from "@/hooks/use-toast"
import { getProfile, updateProfile, type Profile } from "@/lib/supabase-db"
import { supabase } from "@/lib/supabase-db"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const phoneRegex = /^(\+55\s?)?(\(?\d{2}\)?\s?)?(\d{4,5}[-.\s]?\d{4})$/

const profileSchema = z.object({
  name: z.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços"),
  phone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .max(15, "Telefone deve ter no máximo 15 caracteres")
    .regex(phoneRegex, "Formato de telefone inválido. Use: (00) 00000-0000 ou (00) 0000-0000"),
  bio: z.string()
    .max(500, "Biografia deve ter no máximo 500 caracteres")
    .optional(),
  subject: z.string()
    .max(100, "Matéria deve ter no máximo 100 caracteres")
    .optional(),
  hourlyRate: z.number()
    .min(0, "Valor não pode ser negativo")
    .max(10000, "Valor muito alto")
    .optional(),
  address: z.string()
    .max(200, "Endereço deve ter no máximo 200 caracteres")
    .optional(),
  city: z.string()
    .max(100, "Cidade deve ter no máximo 100 caracteres")
    .optional(),
  state: z.string()
    .max(2, "Estado deve ter 2 caracteres (UF)")
    .optional(),
  zipCode: z.string()
    .optional()
    .or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useI18n()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [copied, setCopied] = useState(false)

  const copyEnrollment = async () => {
    if (userProfile?.enrollmentNumber) {
      await navigator.clipboard.writeText(userProfile.enrollmentNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Matrícula copiada!",
        description: "A matrícula foi copiada para a área de transferência.",
      })
    }
  }

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
      bio: "",
      subject: "",
      hourlyRate: 0,
      address: "",
      city: "",
      state: "",
      zipCode: "",
    },
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          const profile = await getProfile(user.id)
          if (profile) {
            setUserProfile(profile)
            setUserEmail(profile.email || "")
            form.reset({
              name: profile.name,
              phone: profile.phone || "",
              bio: profile.bio || "",
              subject: profile.subject || "",
              hourlyRate: (profile as any).hourlyRate || 0,
              address: (profile as any).address || "",
              city: (profile as any).city || "",
              state: (profile as any).state || "",
              zipCode: (profile as any).zipCode || "",
            })
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar perfil.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [form])

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userId) return

    setIsSaving(true)
    try {
      await updateProfile(userId, {
        name: data.name,
        phone: data.phone,
        bio: data.bio,
        subject: data.subject,
        hourlyRate: data.hourlyRate,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      })
      toast({
        title: "Sucesso",
        description: "Perfil atualizado com sucesso!",
        variant: "default", // Changed from "success" as it might not be a valid variant in standard toast
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Configurações</h2>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-5 w-5" />
                </div>
                Informações Pessoais
              </CardTitle>
              <CardDescription>Atualize suas informações de perfil e dados de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" />
                  <AvatarFallback>User</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="h-10 bg-transparent">
                    Alterar Foto
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">JPG, GIF ou PNG. Máximo 1MB.</p>
                </div>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informações Pessoais</h3>
                    {userProfile?.role === 'student' && userProfile?.enrollmentNumber && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                              Sua Matrícula
                            </p>
                            <p className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                              {userProfile.enrollmentNumber}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Compartilhe esta matrícula com seus professores
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={copyEnrollment}
                            className="ml-4"
                          >
                            {copied ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Seu nome completo" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {userEmail && (
                        <div className="flex flex-col gap-2">
                          <FormLabel>E-mail</FormLabel>
                          <Input value={userEmail} disabled className="bg-muted" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone *</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                              />
                            </FormControl>
                            <FormDescription>
                              Formato: (00) 00000-0000 ou (00) 0000-0000
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Matéria / Interesse</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: Inglês, Matemática" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Endereço</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Rua, número, complemento" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Cidade" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado (UF)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="SP" 
                                maxLength={2}
                                className="uppercase"
                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="00000-000"
                                maxLength={9}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '')
                                  const formatted = value.replace(/(\d{5})(\d{3})/, '$1-$2')
                                  field.onChange(formatted)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sobre Você</h3>
                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Biografia</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              placeholder="Conte um pouco sobre você, suas experiências e objetivos..." 
                              className="min-h-[120px] resize-none"
                              maxLength={500}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.length || 0}/500 caracteres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto h-12 px-8 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 shrink-0" />
                        <span className="truncate">Salvar Alterações</span>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications and Preferences Tabs remain mostly static for now as requested focus was on Profile Edit */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-500" />
                </div>
                Preferências de Notificação
              </CardTitle>
              <CardDescription>Gerencie como você deseja receber alertas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Ativar Notificações</Label>
                  <p className="text-sm text-muted-foreground">Receba alertas sobre suas aulas e pagamentos.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Notificações por Email</Label>
                  <p className="text-sm text-muted-foreground">Receba um resumo das atividades por email.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Globe className="h-5 w-5 text-orange-500" />
                </div>
                Preferências
              </CardTitle>
              <CardDescription>Personalize a aparência e comportamento do aplicativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Tema</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base font-medium">Idioma</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt">Português (Brasil)</SelectItem>
                    <SelectItem value="en">English (US)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

