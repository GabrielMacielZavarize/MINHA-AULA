"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen,
  Users,
  DollarSign,
  Clock,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useClasses } from "@/hooks/use-classes"
import { useStudents } from "@/hooks/use-students"
import { usePayments } from "@/hooks/use-payments"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Profile } from "@/lib/supabase-db"
import { RescheduleModal } from "@/components/reschedule-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TeacherDashboardProps {
  profile: Profile
}

function TeacherDashboardContent({ profile }: TeacherDashboardProps) {
  const searchParams = useSearchParams()
  const { classes, refresh } = useClasses()
  const { students } = useStudents()
  const { payments, refresh: refreshPayments } = usePayments()
  const [hideFinancialData, setHideFinancialData] = useState(false)
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || "overview")

  // Listen for payment and class updates (only once on mount)
  useEffect(() => {
    const handlePaymentUpdate = () => {
      refreshPayments()
      refresh()
    }
    
    window.addEventListener("paymentUpdated", handlePaymentUpdate)
    window.addEventListener("classUpdated", handlePaymentUpdate)
    
    return () => {
      window.removeEventListener("paymentUpdated", handlePaymentUpdate)
      window.removeEventListener("classUpdated", handlePaymentUpdate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    } else {
      setActiveTab("overview")
    }
  }, [searchParams])

  const stats = {
    totalClasses: classes.length,
    completedClasses: classes.filter((c) => c.status === "completed").length,
    scheduledClasses: classes.filter((c) => c.status === "booked").length,
    totalStudents: students.length,
    totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
    paidRevenue: payments.filter((p) => p.status === "paid").reduce((sum, payment) => sum + payment.amount, 0),
    pendingRevenue: payments.filter((p) => p.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
  }

  const upcomingClasses = classes
    .filter((c) => c.status === "booked" || c.status === "pending_approval")
    .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())
    .slice(0, 5)

  const recentPayments = payments.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()).slice(0, 5)

  const formatCurrencyDisplay = (value: number) => {
    return hideFinancialData ? "R$ ***" : formatCurrency(value)
  }



  return (
    <div className="space-y-8">
        {activeTab === "overview" && (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">
                Painel do Professor
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">Bem-vindo de volta, {profile.name}!</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHideFinancialData(!hideFinancialData)}
                className="h-10 w-10 border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-white transition-all"
              >
                {hideFinancialData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="bg-card/50 dark:bg-slate-900/40 backdrop-blur-xl border-border dark:border-white/5 shadow-sm dark:shadow-black/20 hover:border-primary/30 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Total de Aulas</CardTitle>
                  <BookOpen className="h-4 w-4 text-blue-500/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground dark:text-white mb-1">{stats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground dark:text-slate-500">
                    {stats.completedClasses} concluída{stats.completedClasses !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 dark:bg-slate-900/40 backdrop-blur-xl border-border dark:border-white/5 shadow-sm dark:shadow-black/20 hover:border-emerald-500/30 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Alunos Ativos</CardTitle>
                  <Users className="h-4 w-4 text-emerald-500/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground dark:text-white mb-1">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground dark:text-slate-500">
                    {stats.scheduledClasses} aula{stats.scheduledClasses !== 1 ? "s" : ""} agendada
                    {stats.scheduledClasses !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 dark:bg-slate-900/40 backdrop-blur-xl border-border dark:border-white/5 shadow-sm dark:shadow-black/20 hover:border-violet-500/30 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">Receita Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-violet-500/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground dark:text-white mb-1">{formatCurrencyDisplay(stats.totalRevenue)}</div>
                  <p className="text-xs text-muted-foreground dark:text-slate-500">{formatCurrencyDisplay(stats.paidRevenue)} recebido</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 dark:bg-slate-900/40 backdrop-blur-xl border-border dark:border-white/5 shadow-sm dark:shadow-black/20 hover:border-amber-500/30 transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground dark:text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Pendente</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500/70" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground dark:text-white mb-1">{formatCurrencyDisplay(stats.pendingRevenue)}</div>
                  <p className="text-xs text-muted-foreground dark:text-slate-500">
                    {payments.filter((p) => p.status === "pending").length} pagamento
                    {payments.filter((p) => p.status === "pending").length !== 1 ? "s" : ""} pendente
                    {payments.filter((p) => p.status === "pending").length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-card/50 dark:bg-slate-900/40 backdrop-blur-xl border-border dark:border-white/5 shadow-sm dark:shadow-black/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-slate-200 text-lg">
                    <Calendar className="h-5 w-5 text-blue-400" />
                    Próximas Aulas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingClasses.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-muted dark:bg-slate-800/50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-muted-foreground dark:text-slate-600" />
                      </div>
                      <p className="text-muted-foreground dark:text-slate-400">Nenhuma aula agendada</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingClasses.map((classItem) => (
                        <div key={classItem.id} className="flex items-center justify-between p-4 border border-border dark:border-white/5 rounded-xl bg-card dark:bg-white/5 hover:bg-accent/50 dark:hover:bg-white/10 transition-colors">
                          <div className="flex-1">
                            <div className="font-semibold text-foreground dark:text-slate-200 text-lg">{classItem.studentName || "Aguardando Aluno"}</div>
                            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">{classItem.subject}</div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground dark:text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(classItem.date), "dd/MM", { locale: ptBR })} às {classItem.time}
                            </div>
                            {classItem.status === 'pending_approval' && (
                              <Badge variant="outline" className="mt-2 bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                                Aguardando Aprovação
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-500/20">
                                R$ {formatCurrencyDisplay(classItem.value)}
                              </Badge>
                              {classItem.status === 'booked' && classItem.studentId && (
                                <RescheduleModal 
                                  classId={classItem.id} 
                                  studentId={classItem.studentId} 
                                  currentDate={classItem.date} 
                                  currentTime={classItem.time}
                                  onSuccess={refresh}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 dark:bg-slate-900/40 backdrop-blur-xl border-border dark:border-white/5 shadow-sm dark:shadow-black/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground dark:text-slate-200 text-lg">
                    <DollarSign className="h-5 w-5 text-emerald-400" />
                    Pagamentos Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-muted dark:bg-slate-800/50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <DollarSign className="h-8 w-8 text-muted-foreground dark:text-slate-600" />
                      </div>
                      <p className="text-muted-foreground dark:text-slate-400">Nenhum pagamento registrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentPayments.map((payment) => (
                        <div key={payment.id} className="flex items-center justify-between p-4 border border-border dark:border-white/5 rounded-xl bg-card dark:bg-white/5 hover:bg-accent/50 dark:hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div
                              className={`p-3 rounded-full ${
                                payment.status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-amber-500/10 text-amber-400"
                              }`}
                            >
                              {payment.status === "paid" ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <AlertCircle className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-foreground dark:text-slate-200">{payment.studentName}</div>
                              <div className="text-sm text-muted-foreground dark:text-slate-400">{payment.subject}</div>
                              <div className="text-xs text-muted-foreground dark:text-slate-500 mt-1">
                                {format(parseISO(payment.date || payment.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-foreground dark:text-white text-lg">{formatCurrency(payment.amount)}</div>
                            <Badge
                              variant={payment.status === "paid" ? "default" : "secondary"}
                              className={`text-xs mt-2 border-0 ${
                                payment.status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
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
    </div>
  )
}

export function TeacherDashboard({ profile }: TeacherDashboardProps) {
  return (
    <Suspense fallback={<div className="space-y-8"><p>Carregando...</p></div>}>
      <TeacherDashboardContent profile={profile} />
    </Suspense>
  )
}
