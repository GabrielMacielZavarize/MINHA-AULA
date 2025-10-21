"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Users,
  DollarSign,
  BookOpen,
  TrendingUp,
  Clock,
  Eye,
  EyeOff,
  Menu,
  Settings,
  LogOut,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarView } from "@/components/calendar-view"
import { StudentsView } from "@/components/students-view"
import { FinancialView } from "@/components/financial-view"
import { SettingsView } from "@/components/settings-view"
import { useClasses } from "@/hooks/use-classes"
import { useStudents } from "@/hooks/use-students"
import { usePayments } from "@/hooks/use-payments"
import { useTheme } from "@/lib/theme"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import Image from "next/image"

export default function Dashboard() {
  const router = useRouter()
  const [activeView, setActiveView] = useState("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hideFinancialData, setHideFinancialData] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const { classes, refresh: refreshClasses } = useClasses()
  const { students } = useStudents()
  const { payments, refresh: refreshPayments } = usePayments()
  const { theme } = useTheme()

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = localStorage.getItem("minha-aula-current-user")
        if (!user) {
          router.push("/login")
          return
        }
        setCurrentUser(JSON.parse(user))
      } catch (error) {
        console.error("Error checking auth:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Listen for class updates to refresh dashboard
  useEffect(() => {
    const handleClassUpdate = () => {
      refreshClasses()
      refreshPayments()
    }

    window.addEventListener("classUpdated", handleClassUpdate)
    return () => window.removeEventListener("classUpdated", handleClassUpdate)
  }, [refreshClasses, refreshPayments])

  const handleLogout = () => {
    localStorage.removeItem("minha-aula-current-user")
    router.push("/login")
  }

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if no user
  if (!currentUser) {
    return null
  }

  // Show student interface (simplified for now)
  if (currentUser.role === "student") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="bg-white rounded-lg p-2 shadow-sm">
                <Image src="/logo.png" alt="Minha Aula" width={64} height={64} className="object-contain" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Área do Aluno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Bem-vindo, {currentUser.name}! A interface do aluno está sendo desenvolvida.
            </p>
            <Button onClick={handleLogout} variant="outline" className="w-full bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate statistics
  const stats = {
    totalClasses: classes.length,
    completedClasses: classes.filter((c) => c.status === "completed").length,
    scheduledClasses: classes.filter((c) => c.status === "scheduled").length,
    totalStudents: students.length,
    totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
    paidRevenue: payments.filter((p) => p.status === "paid").reduce((sum, payment) => sum + payment.amount, 0),
    pendingRevenue: payments.filter((p) => p.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
  }

  // Get recent classes (next 5 upcoming)
  const upcomingClasses = classes
    .filter((c) => c.status === "scheduled")
    .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())
    .slice(0, 5)

  // Get recent payments (last 5)
  const recentPayments = payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const formatCurrencyDisplay = (value: number) => {
    return hideFinancialData ? "R$ ***" : formatCurrency(value)
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: TrendingUp },
    { id: "calendar", label: "Agenda", icon: Calendar },
    { id: "students", label: "Alunos", icon: Users },
    { id: "financial", label: "Financeiro", icon: DollarSign },
    { id: "settings", label: "Configurações", icon: Settings },
  ]

  const renderContent = () => {
    switch (activeView) {
      case "calendar":
        return <CalendarView />
      case "students":
        return <StudentsView />
      case "financial":
        return <FinancialView />
      case "settings":
        return <SettingsView />
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Bem-vindo de volta, {currentUser?.name || "Professor"}!</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHideFinancialData(!hideFinancialData)}
                className="h-10 w-10"
              >
                {hideFinancialData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Aulas</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.completedClasses} concluída{stats.completedClasses !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.scheduledClasses} aula{stats.scheduledClasses !== 1 ? "s" : ""} agendada
                    {stats.scheduledClasses !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrencyDisplay(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground">{formatCurrencyDisplay(stats.paidRevenue)} recebido</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{formatCurrencyDisplay(stats.pendingRevenue)}</div>
                  <p className="text-xs text-muted-foreground">
                    {payments.filter((p) => p.status === "pending").length} pagamento
                    {payments.filter((p) => p.status === "pending").length !== 1 ? "s" : ""} pendente
                    {payments.filter((p) => p.status === "pending").length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Upcoming Classes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximas Aulas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingClasses.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Nenhuma aula agendada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingClasses.map((classItem) => (
                        <div key={classItem.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-semibold">{classItem.studentName}</div>
                            <div className="text-sm text-muted-foreground">{classItem.subject}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(classItem.date), "dd/MM", { locale: ptBR })} às {classItem.time}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{formatCurrency(classItem.value)}</div>
                            {classItem.tags && classItem.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {classItem.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="text-xs px-1 py-0"
                                    style={{ borderColor: tag.color, color: tag.color }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {classItem.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs px-1 py-0">
                                    +{classItem.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Payments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Pagamentos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPayments.length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">Nenhum pagamento registrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-full ${
                                payment.status === "paid"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                            >
                              {payment.status === "paid" ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <AlertCircle className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold">{payment.studentName}</div>
                              <div className="text-sm text-muted-foreground">{payment.subject}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(parseISO(payment.date), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-blue-600">{formatCurrency(payment.amount)}</div>
                            <Badge
                              variant={payment.status === "paid" ? "default" : "secondary"}
                              className={`text-xs ${
                                payment.status === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {payment.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full bg-background">
              {/* Mobile Sidebar Header */}
              <div className="p-6 border-b">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="bg-green-500 text-white">
                      {currentUser?.name?.charAt(0) || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{currentUser?.name || "Professor"}</p>
                    <p className="text-sm text-muted-foreground truncate">{currentUser?.email}</p>
                  </div>
                </div>
              </div>

              {/* Mobile Navigation */}
              <nav className="flex-1 p-4">
                <div className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <Button
                        key={item.id}
                        variant={activeView === item.id ? "default" : "ghost"}
                        className={`w-full justify-start h-12 ${
                          activeView === item.id ? "bg-green-500 hover:bg-green-600 text-white" : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          setActiveView(item.id)
                          setSidebarOpen(false)
                        }}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        {item.label}
                      </Button>
                    )
                  })}
                </div>
              </nav>

              {/* Mobile Logout */}
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={handleLogout}
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sair
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-xl font-bold">Minha Aula</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-background border-r">
          {/* Desktop Sidebar Header */}
          <div className="flex items-center gap-3 p-6 border-b">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-green-500 text-white">{currentUser?.name?.charAt(0) || "P"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{currentUser?.name || "Professor"}</p>
              <p className="text-sm text-muted-foreground truncate">{currentUser?.email}</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={activeView === item.id ? "default" : "ghost"}
                    className={`w-full justify-start h-12 ${
                      activeView === item.id ? "bg-green-500 hover:bg-green-600 text-white" : "hover:bg-muted"
                    }`}
                    onClick={() => setActiveView(item.id)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          </nav>

          {/* Desktop Logout */}
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

        {/* Main Content */}
        <div className="flex-1 lg:pl-64">
          <main className="p-4 lg:p-8">{renderContent()}</main>
        </div>
      </div>
    </div>
  )
}
