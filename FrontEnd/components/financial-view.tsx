"use client"

import { useState, useMemo, useEffect } from "react"
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Filter, Eye, EyeOff, CheckCircle, Clock, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { StatCard } from "@/components/stat-card"
import { EmptyState } from "@/components/empty-state"
import { usePayments } from "@/hooks/use-payments"
import { useClasses } from "@/hooks/use-classes"
import { useStudents } from "@/hooks/use-students"
import { formatCurrency } from "@/lib/utils"
import { generateFinancialPDF } from "@/lib/pdf-generator"
import { mergePayments, filterByPeriod, useFinancialStats, useMonthlyChartData, useTopStudentsData, type Period } from "@/hooks/use-financial-stats"
import { toast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts"

const CHART_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(var(--background))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "6px",
  },
  labelStyle: { color: "hsl(var(--foreground))" },
}

function ChartEmptyState({ icon: Icon }: { icon: typeof BarChart3 }) {
  return (
    <div className="h-[280px] flex items-center justify-center">
      <EmptyState icon={Icon} message="Nenhum dado disponível" />
    </div>
  )
}

export function FinancialView() {
  const { payments, markAsPaid, createPayment, refresh } = usePayments()
  const { classes } = useClasses()
  const { students } = useStudents()
  const [period, setPeriod] = useState<Period>("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [hideValues, setHideValues] = useState(false)

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener("paymentUpdated", handler)
    window.addEventListener("classUpdated", handler)
    return () => {
      window.removeEventListener("paymentUpdated", handler)
      window.removeEventListener("classUpdated", handler)
    }
  }, [refresh])

  const merged = useMemo(() => mergePayments(payments, classes), [payments, classes])
  const filtered = useMemo(() => filterByPeriod(merged, period, customStart, customEnd), [merged, period, customStart, customEnd])
  const stats = useFinancialStats(filtered, merged, classes, students.length)
  const monthlyData = useMonthlyChartData(merged)
  const studentData = useTopStudentsData(classes)

  const display = (v: number) => (hideValues ? "R$ •••" : formatCurrency(v))

  const handleMarkAsPaid = async (payment: any) => {
    try {
      if (payment.isImplicit) {
        await createPayment({ classId: payment.classId, studentId: payment.studentId, teacherId: payment.teacherId, amount: payment.amount, status: "paid" })
      } else {
        await markAsPaid(payment.id)
      }
      toast({ title: "Sucesso", description: "Pagamento marcado como pago" })
      refresh()
      window.dispatchEvent(new CustomEvent("paymentUpdated"))
    } catch {
      toast({ title: "Erro", description: "Erro ao marcar pagamento como pago", variant: "destructive" })
    }
  }

  const handleExportPDF = async () => {
    try {
      await generateFinancialPDF(filtered, stats, period, customStart, customEnd)
      toast({ title: "Sucesso", description: "Relatório PDF gerado com sucesso" })
    } catch {
      toast({ title: "Erro", description: "Erro ao gerar PDF. Tente novamente.", variant: "destructive" })
    }
  }

  const sortedPayments = [...filtered].sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Acompanhe sua receita, pagamentos e desempenho.">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setHideValues(!hideValues)} title={hideValues ? "Mostrar valores" : "Ocultar valores"}>
          {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button className="h-9 gap-2" onClick={handleExportPDF}>
          <Download className="h-4 w-4" /> Exportar PDF
        </Button>
      </PageHeader>

      {/* Filtro de período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger><SelectValue placeholder="Selecione o período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o Período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label>Data Inicial</Label>
                  <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-10 text-foreground [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Data Final</Label>
                  <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-10 text-foreground [color-scheme:light] dark:[color-scheme:dark]" />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Receita Total" value={display(stats.totalRevenue)} description={`${filtered.length} pagamento${filtered.length !== 1 ? "s" : ""}`} icon={DollarSign} iconClassName="text-primary" iconWrapperClassName="bg-primary/10" />
        <StatCard title="Receita Paga" value={display(stats.paidRevenue)} description={`${filtered.filter((p) => p.status === "paid").length} pago${filtered.filter((p) => p.status === "paid").length !== 1 ? "s" : ""}`} icon={CheckCircle} iconClassName="text-emerald-600" iconWrapperClassName="bg-emerald-500/10" />
        <StatCard title="Receita Pendente" value={display(stats.pendingRevenue)} description={`${filtered.filter((p) => p.status === "pending").length} pendente${filtered.filter((p) => p.status === "pending").length !== 1 ? "s" : ""}`} icon={Clock} iconClassName="text-amber-600" iconWrapperClassName="bg-amber-500/10" />
        <StatCard
          title="Este Mês"
          value={display(stats.currentMonthRevenue)}
          description={
            <span className={stats.revenueDifference >= 0 ? "text-emerald-600" : "text-destructive"}>
              {stats.revenueDifference >= 0 ? "+" : ""}{hideValues ? "R$ •••" : formatCurrency(stats.revenueDifference)} vs mês anterior
            </span> as any
          }
          icon={stats.revenueDifference >= 0 ? TrendingUp : TrendingDown}
          iconClassName={stats.revenueDifference >= 0 ? "text-emerald-600" : "text-destructive"}
          iconWrapperClassName={stats.revenueDifference >= 0 ? "bg-emerald-500/10" : "bg-destructive/10"}
        />
      </div>

      {!hideValues && (
        <>
          {/* Gráficos */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <BarChart3 className="h-4 w-4 text-primary" /> Receita Mensal (6 meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
                      <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: any) => formatCurrency(Number(v))} labelFormatter={(l) => monthlyData.find((d) => d.month === l)?.fullMonth ?? l} {...CHART_STYLE} />
                      <Legend />
                      <Bar dataKey="pago" fill="#22c55e" name="Pago" />
                      <Bar dataKey="pendente" fill="#f59e0b" name="Pendente" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmptyState icon={BarChart3} />}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <BarChart3 className="h-4 w-4 text-primary" /> Top 5 Alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {studentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={studentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
                      <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
                      <Tooltip {...CHART_STYLE} />
                      <Legend />
                      <Bar dataKey="completed" fill="#22c55e" name="Concluídas" />
                      <Bar dataKey="scheduled" fill="#3b82f6" name="Agendadas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <ChartEmptyState icon={BarChart3} />}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" /> Tendência de Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} labelFormatter={(l) => monthlyData.find((d) => d.month === l)?.fullMonth ?? l} {...CHART_STYLE} />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="pago" stroke="#22c55e" strokeWidth={2} name="Pago" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <ChartEmptyState icon={TrendingUp} />}
            </CardContent>
          </Card>

          {/* Lista de pagamentos */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Pagamentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedPayments.length === 0 ? (
                <EmptyState
                  icon={DollarSign}
                  message={period === "all" ? "Nenhum pagamento cadastrado" : "Nenhum pagamento no período selecionado"}
                />
              ) : (
                <div className="space-y-3">
                  {sortedPayments.map((payment) => (
                    <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-foreground">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground">{payment.subject}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {payment.date ? format(parseISO(payment.date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-bold text-sm text-foreground">{formatCurrency(payment.amount)}</p>
                          <Badge variant="outline" className={`text-xs mt-0.5 ${payment.status === "paid" ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "bg-amber-500/10 text-amber-600 border-amber-200"}`}>
                            {payment.status === "paid" ? "Pago" : "Pendente"}
                          </Badge>
                        </div>
                        {payment.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkAsPaid(payment)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
                            <CheckCircle className="h-4 w-4 mr-1" /> Pago
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
