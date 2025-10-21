"use client"

import { useState } from "react"
import { User, Bell, Globe, Moon, Sun, Monitor, Save, Check } from "lucide-react"
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

export function SettingsView() {
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const [notifications, setNotifications] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveProfile = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: "Sucesso",
      description: "Perfil atualizado com sucesso!",
      variant: "success",
    })
  }

  const handleSaveNotifications = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: "Sucesso",
      description: "Configurações de notificação salvas!",
      variant: "success",
    })
  }

  const handleSavePreferences = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: "Sucesso",
      description: "Preferências salvas com sucesso!",
      variant: "success",
    })
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
                  <AvatarFallback>PS</AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="h-10 bg-transparent">
                    Alterar Foto
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">JPG, GIF ou PNG. Máximo 1MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input id="firstName" defaultValue="Professor" />
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input id="lastName" defaultValue="Silva" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" defaultValue="professor@email.com" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" defaultValue="(11) 99999-9999" />
                </div>
              </div>

              <div>
                <Label htmlFor="specialty">Especialidade</Label>
                <Input id="specialty" defaultValue="Professor de Inglês" />
              </div>

              <div>
                <Label htmlFor="bio">Sobre você</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre sua experiência e metodologia..."
                  defaultValue="Professor de inglês com 10 anos de experiência, especializado em conversação e preparação para exames internacionais."
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="hourlyRate">Valor por Hora (R$)</Label>
                  <Input id="hourlyRate" type="number" defaultValue="80" />
                </div>
                <div>
                  <Label htmlFor="classRate">Valor por Aula (R$)</Label>
                  <Input id="classRate" type="number" defaultValue="80" />
                </div>
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="w-full sm:w-auto h-12 px-8 flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                {isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Save className="h-4 w-4 shrink-0" />
                    <span className="truncate">Salvar Alterações</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Bell className="h-5 w-5" />
                </div>
                Notificações
              </CardTitle>
              <CardDescription>Configure como você deseja receber notificações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Notificações Push</Label>
                  <p className="text-sm text-muted-foreground">Receba notificações no seu dispositivo</p>
                </div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">Receba lembretes e atualizações por e-mail</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              <div>
                <Label className="text-base font-medium">Lembrar das aulas</Label>
                <Select defaultValue="30">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="120">2 horas antes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Lembrar de pagamentos pendentes</Label>
                <Select defaultValue="daily">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                    <SelectItem value="never">Nunca</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSaveNotifications}
                disabled={isSaving}
                className="w-full sm:w-auto h-12 px-8 flex items-center justify-center gap-2 bg-info hover:bg-info/90 text-info-foreground"
              >
                {isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Check className="h-4 w-4 shrink-0" />
                    <span className="truncate">Salvar Configurações</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Globe className="h-5 w-5" />
                </div>
                Preferências
              </CardTitle>
              <CardDescription>Personalize a aparência e comportamento do aplicativo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">{"Tema"}</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Claro
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Escuro
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Sistema
                      </div>
                    </SelectItem>
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

              <div>
                <Label className="text-base font-medium">Formato de Data</Label>
                <Select defaultValue="dd/mm/yyyy">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Moeda</Label>
                <Select defaultValue="BRL">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (R$)</SelectItem>
                    <SelectItem value="USD">Dólar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={isSaving}
                className="w-full sm:w-auto h-12 px-8 flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                {isSaving ? (
                  <span>Salvando...</span>
                ) : (
                  <>
                    <Save className="h-4 w-4 shrink-0" />
                    <span className="truncate">Salvar Preferências</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
