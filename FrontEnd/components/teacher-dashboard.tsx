"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { BookOpen, Users, DollarSign, Clock, Eye, EyeOff, Calendar, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { useClasses } from "@/hooks/use-classes"
import { useStudents } from "@/hooks/use-students"
import { usePayments } from "@/hooks/use-payments"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Profile } from "@/lib/supabase-db"
import { RescheduleModal } from "@/components/reschedule-modal"

interface TeacherDashboardProps {
  profile: Profile
}

function TeacherDashboardContent({ profile }: TeacherDashboardProps) {
  const searchParams = useSearchParams()
  const { classes, refresh } = useClasses()
  const { students } = useStudents()
  const { payments, refresh: refreshPayments } = usePayments()
  const [hideValues, setHideValues] = useState(false)
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "overview")

  useEffect(() => {
    const handler = () => { refreshPayments(); refresh() }
    window.addEventListener("paymentUpdated", handler)
    window.addEventListener("classUpdated", handler)
    return () => {
      window.removeEventListener("paymentUpdated", handler)
      window.removeEventListener("classUpdated", handler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "overview")
  }, [searchParams])

  const stats = {
    totalClasses: classes.length,
    completedClasses: classes.filter((c) => c.status === "completed").length,
    scheduledClasses: classes.filter((c) => c.status === "booked").length,
    totalStudents: students.length,
    totalRevenue: payments.reduce((s, p) => s + p.amount, 0),
    paidRevenue: payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0),
    pendingRevenue: payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
    pendingCount: payments.filter((p) => p.status === "pending").length,
  }

  const upcomingClasses = classes
    .filter((c) => c.status === "booked" || c.status === "pending_approval")
    .sort((a, b) => new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime())
    .slice(0, 5)

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
    .slice(0, 5)

  const display = (v: number) => (hideValues ? "R$ •••" : formatCurrency(v))

  return (
    <div className="space-y-8">
      {activeTab === "overview" && (
        <PageHeader title="Painel do Professor" description={`Bem-vindo de volta, ${profile.name}`}>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setHideValues(!hideValues)} title={hideValues ? "Mostrar valores" : "Ocultar valores"}>
            {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </PageHeader>
      )}

      <div className="space-y-6">
        {/* Métricas */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total de Aulas" value={stats.totalClasses} description={`${stats.completedClasses} concluída${stats.completedClasses !== 1 ? "s" : ""}`} icon={BookOpen} />
          <StatCard title="Alunos Ativos" value={stats.totalStudents} description={`${stats.scheduledClasses} aula${stats.scheduledClasses !== 1 ? "s" : ""} agendada${stats.scheduledClasses !== 1 ? "s" : ""}`} icon={Users} iconClassName="text-emerald-600" iconWrapperClassName="bg-emerald-500/10" />
          <StatCard title="Receita Total" value={display(stats.totalRevenue)} description={`${display(stats.paidRevenue)} recebido`} icon={DollarSign} iconClassName="text-violet-600" iconWrapperClassName="bg-violet-500/10" />
          <StatCard title="Pendente" value={display(stats.pendingRevenue)} description={`${stats.pendingCount} pagamento${stats.pendingCount !== 1 ? "s" : ""} pendente${stats.pendingCount !== 1 ? "s" : ""}`} icon={Clock} iconClassName="text-amber-600" iconWrapperClassName="bg-amber-500/10" />
        </div>

        {/* Listas */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Calendar className="h-4 w-4 text-primary" /> Próximas Aulas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingClasses.length === 0 ? (
                <EmptyState icon={Calendar} message="Nenhuma aula agendada" />
              ) : (
                <div className="space-y-3">
                  {upcomingClasses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{c.studentName || "Aguardando Aluno"}</p>
                        <p className="text-xs text-primary font-medium">{c.subject}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(c.date), "dd/MM", { locale: ptBR })} às {c.time}
                        </div>
                        {c.status === "pending_approval" && (
                          <Badge variant="outline" className="mt-1.5 text-xs bg-amber-500/10 text-amber-600 border-amber-200">
                            Aguardando Aprovação
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <Badge variant="secondary" className="text-xs">{display(c.value)}</Badge>
                        {c.status === "booked" && c.studentId && (
                          <RescheduleModal classId={c.id} studentId={c.studentId} currentDate={c.date} currentTime={c.time} onSuccess={refresh} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <DollarSign className="h-4 w-4 text-emerald-600" /> Pagamentos Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentPayments.length === 0 ? (
                <EmptyState icon={DollarSign} message="Nenhum pagamento registrado" />
              ) : (
                <div className="space-y-3">
                  {recentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${p.status === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}>
                          {p.status === "paid" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{p.studentName}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.subject}</p>
                          <p className="text-xs text-muted-foreground">{format(parseISO(p.date || p.createdAt), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="font-bold text-sm text-foreground">{formatCurrency(p.amount)}</p>
                        <Badge variant="outline" className={`text-xs mt-1 ${p.status === "paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-500/10 text-amber-600 border-amber-200"}`}>
                          {p.status === "paid" ? "Pago" : "Pendente"}
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
    <Suspense fallback={
      <div className="space-y-8">
        <div className="space-y-1">
          <div className="h-7 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-36 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    }>
      <TeacherDashboardContent profile={profile} />
    </Suspense>
  )
}
