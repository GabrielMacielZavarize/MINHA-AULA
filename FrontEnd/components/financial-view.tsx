"use client"

import { useState, useMemo, useEffect } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { usePayments } from "@/hooks/use-payments"
import { useClasses } from "@/hooks/use-classes"
import { useStudents } from "@/hooks/use-students"
import { formatCurrency } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
  subMonths,
  eachMonthOfInterval,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"

export function FinancialView() {
  const { payments, markAsPaid, createPayment, refresh } = usePayments()
  const { classes } = useClasses()
  const { students } = useStudents()

  const [selectedPeriod, setSelectedPeriod] = useState("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const [hideFinancialData, setHideFinancialData] = useState(false)

  useEffect(() => {
    const handlePaymentUpdate = () => {
      refresh()
    }

    window.addEventListener("paymentUpdated", handlePaymentUpdate)
    window.addEventListener("classUpdated", handlePaymentUpdate)
    return () => {
      window.removeEventListener("paymentUpdated", handlePaymentUpdate)
      window.removeEventListener("classUpdated", handlePaymentUpdate)
    }
  }, [refresh])

  // Merge existing payments with implicit payments from classes
  const mergedPayments = useMemo(() => {
    // Create a map of existing payments by classId for quick lookup
    const paymentMap = new Map(payments.map(p => [p.classId, p]))

    const implicitPayments = classes
      .filter(c => {
        // Filter classes that:
        // 1. Have a value > 0
        // 2. Are NOT cancelled or pending_approval
        // 3. Do NOT have an existing payment record
        return (
          c.value > 0 && 
          c.status !== 'cancelled' && 
          c.status !== 'pending_approval' &&
          c.studentId && // Must have a student to have a payment
          !paymentMap.has(c.id)
        )
      })
      .map(c => ({
        id: `implicit-${c.id}`, // Temporary ID for UI
        isImplicit: true,
        studentId: c.studentId,
        teacherId: c.teacherId,
        classId: c.id,
        amount: c.value,
        status: 'pending',
        createdAt: c.date, // Use class date as creation date for implicit payments
        updatedAt: c.date,
        studentName: c.studentName,
        subject: c.subject,
        date: c.date
      }))

    return [...payments, ...implicitPayments]
  }, [payments, classes])

  const filteredPayments = useMemo(() => {
    const now = new Date()

    return mergedPayments.filter((payment) => {
      if (!payment.date) return false
      const paymentDate = parseISO(payment.date)

      switch (selectedPeriod) {
        case "today":
          return format(paymentDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
        case "week":
          const weekStart = startOfWeek(now, { weekStartsOn: 0 })
          const weekEnd = endOfWeek(now, { weekStartsOn: 0 })
          return paymentDate >= weekStart && paymentDate <= weekEnd
        case "month":
          const monthStart = startOfMonth(now)
          const monthEnd = endOfMonth(now)
          return paymentDate >= monthStart && paymentDate <= monthEnd
        case "year":
          const yearStart = startOfYear(now)
          const yearEnd = endOfYear(now)
          return paymentDate >= yearStart && paymentDate <= yearEnd
        case "custom":
          if (!customStartDate || !customEndDate) return true
          const startDate = parseISO(customStartDate)
          const endDate = parseISO(customEndDate)
          return paymentDate >= startDate && paymentDate <= endDate
        default:
          return true
      }
    })
  }, [mergedPayments, selectedPeriod, customStartDate, customEndDate])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const currentMonthPayments = mergedPayments.filter((p) => {
      if (!p.date) return false
      const date = parseISO(p.date)
      return date >= currentMonthStart && date <= currentMonthEnd
    })

    const lastMonthPayments = mergedPayments.filter((p) => {
      if (!p.date) return false
      const date = parseISO(p.date)
      return date >= lastMonthStart && date <= lastMonthEnd
    })

    const currentMonthRevenue = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0)
    const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0)

    const revenueDifference = currentMonthRevenue - lastMonthRevenue

    const totalRevenue = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
    const paidRevenue = filteredPayments
      .filter((payment) => payment.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0)
    const pendingRevenue = filteredPayments
      .filter((payment) => payment.status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0)

    const totalClasses = classes.length
    const completedClasses = classes.filter((c) => c.status === "completed").length
    const totalStudents = students.length

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      totalClasses,
      completedClasses,
      totalStudents,
      currentMonthRevenue,
      lastMonthRevenue,
      revenueDifference,
    }
  }, [filteredPayments, classes, students, mergedPayments])

  const monthlyData = useMemo(() => {
    if (mergedPayments.length === 0) {
      return []
    }

    const now = new Date()
    const last6Months = eachMonthOfInterval({
      start: subMonths(now, 5),
      end: now,
    })

    const data = last6Months.map((month) => {
      const monthStart = startOfMonth(month)
      const monthEnd = endOfMonth(month)

      const monthPayments = mergedPayments.filter((p) => {
        if (!p.date) return false
        const date = parseISO(p.date)
        return date >= monthStart && date <= monthEnd
      })

      const paid = monthPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0)
      const pending = monthPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)

      return {
        month: format(month, "MMM", { locale: ptBR }),
        fullMonth: format(month, "MMMM yyyy", { locale: ptBR }),
        pago: Number(paid.toFixed(2)),
        pendente: Number(pending.toFixed(2)),
        total: Number((paid + pending).toFixed(2)),
      }
    })

    return data
  }, [mergedPayments])

  const studentData = useMemo(() => {
    if (classes.length === 0) {
      return []
    }

    const studentMap = new Map()

    classes.forEach((classItem) => {
      const current = studentMap.get(classItem.studentId) || {
        name: classItem.studentName,
        total: 0,
        completed: 0,
        scheduled: 0,
      }

      current.total++
      if (classItem.status === "completed") current.completed++
      if (classItem.status === "booked") current.scheduled++

      studentMap.set(classItem.studentId, current)
    })

    const data = Array.from(studentMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    return data
  }, [classes])

  const handleMarkAsPaid = async (payment: any) => {
    try {
      if (payment.isImplicit) {
        // Create new payment
        await createPayment({
          classId: payment.classId,
          studentId: payment.studentId,
          teacherId: payment.teacherId,
          amount: payment.amount,
          status: 'paid'
        })
      } else {
        // Update existing payment
        await markAsPaid(payment.id)
      }
      
      toast({
        title: "Sucesso",
        description: "Pagamento marcado como pago",
      })
      refresh()
      window.dispatchEvent(new CustomEvent("paymentUpdated"))
    } catch (error) {
      console.error("Error marking as paid:", error)
      toast({
        title: "Erro",
        description: "Erro ao marcar pagamento como pago",
        variant: "destructive",
      })
    }
  }

  const generatePDF = async () => {
    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      const primaryColor = [59, 130, 246]
      const successColor = [34, 197, 94]
      const warningColor = [245, 158, 11]
      const textColor = [31, 41, 55]

      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(0, 0, 210, 40, "F")

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text("Relatório Financeiro", 105, 20, { align: "center" })

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, 30, {
        align: "center",
      })

      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      let periodText = "Período: "
      switch (selectedPeriod) {
        case "today":
          periodText += "Hoje"
          break
        case "week":
          periodText += "Última Semana"
          break
        case "month":
          periodText += "Último Mês"
          break
        case "year":
          periodText += "Último Ano"
          break
        case "custom":
          periodText += `${customStartDate} até ${customEndDate}`
          break
        default:
          periodText += "Todo o Período"
      }
      doc.text(periodText, 20, 50)

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("Resumo Financeiro", 20, 65)

      const boxY = 75
      const boxHeight = 25
      const boxWidth = 85

      doc.setFillColor(240, 249, 255)
      doc.roundedRect(20, boxY, boxWidth, boxHeight, 3, 3, "F")
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.roundedRect(20, boxY, boxWidth, boxHeight, 3, 3, "S")

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text("Receita Total", 25, boxY + 8)
      doc.setFontSize(14)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setFont("helvetica", "bold")
      doc.text(formatCurrency(stats.totalRevenue), 25, boxY + 18)

      doc.setFillColor(240, 253, 244)
      doc.roundedRect(110, boxY, boxWidth, boxHeight, 3, 3, "F")
      doc.setDrawColor(successColor[0], successColor[1], successColor[2])
      doc.roundedRect(110, boxY, boxWidth, boxHeight, 3, 3, "S")

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text("Receita Paga", 115, boxY + 8)
      doc.setFontSize(14)
      doc.setTextColor(successColor[0], successColor[1], successColor[2])
      doc.text(formatCurrency(stats.paidRevenue), 115, boxY + 18)

      doc.setFillColor(255, 251, 235)
      doc.roundedRect(20, boxY + 30, boxWidth, boxHeight, 3, 3, "F")
      doc.setDrawColor(warningColor[0], warningColor[1], warningColor[2])
      doc.roundedRect(20, boxY + 30, boxWidth, boxHeight, 3, 3, "S")

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text("Receita Pendente", 25, boxY + 38)
      doc.setFontSize(14)
      doc.setTextColor(warningColor[0], warningColor[1], warningColor[2])
      doc.text(formatCurrency(stats.pendingRevenue), 25, boxY + 48)

      doc.setFillColor(249, 250, 251)
      doc.roundedRect(110, boxY + 30, boxWidth, boxHeight, 3, 3, "F")
      doc.setDrawColor(100, 116, 139)
      doc.roundedRect(110, boxY + 30, boxWidth, boxHeight, 3, 3, "S")

      doc.setFontSize(9)
      doc.setTextColor(100, 116, 139)
      doc.text("Aulas / Alunos", 115, boxY + 38)
      doc.setFontSize(12)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(`${stats.completedClasses}/${stats.totalClasses} aulas | ${stats.totalStudents} alunos`, 115, boxY + 48)

      let yPosition = 145
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text("Detalhamento de Pagamentos", 20, yPosition)

      yPosition += 10

      doc.setFillColor(249, 250, 251)
      doc.rect(20, yPosition, 170, 8, "F")

      doc.setFontSize(9)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text("Data", 25, yPosition + 5)
      doc.text("Aluno", 50, yPosition + 5)
      doc.text("Matéria", 95, yPosition + 5)
      doc.text("Valor", 135, yPosition + 5)
      doc.text("Status", 165, yPosition + 5)

      yPosition += 12

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)

      filteredPayments.forEach((payment, index) => {
        if (yPosition > 270) {
          doc.addPage()
          yPosition = 30

          doc.setFillColor(249, 250, 251)
          doc.rect(20, yPosition, 170, 8, "F")
          doc.setFont("helvetica", "bold")
          doc.setFontSize(9)
          doc.text("Data", 25, yPosition + 5)
          doc.text("Aluno", 50, yPosition + 5)
          doc.text("Matéria", 95, yPosition + 5)
          doc.text("Valor", 135, yPosition + 5)
          doc.text("Status", 165, yPosition + 5)
          yPosition += 12
          doc.setFont("helvetica", "normal")
          doc.setFontSize(8)
        }

        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251)
          doc.rect(20, yPosition - 4, 170, 7, "F")
        }

        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.text(payment.date ? format(parseISO(payment.date), "dd/MM/yyyy") : "-", 25, yPosition)
        doc.text((payment.studentName || "").substring(0, 18), 50, yPosition)
        doc.text((payment.subject || "").substring(0, 18), 95, yPosition)
        doc.text(formatCurrency(payment.amount), 135, yPosition)

        if (payment.status === "paid") {
          doc.setTextColor(successColor[0], successColor[1], successColor[2])
          doc.text("Pago", 165, yPosition)
        } else {
          doc.setTextColor(warningColor[0], warningColor[1], warningColor[2])
          doc.text("Pendente", 165, yPosition)
        }

        yPosition += 7
      })

      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" })
      }

      doc.save(`relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.pdf`)

      toast({
        title: "Sucesso",
        description: "Relatório PDF gerado com sucesso",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const formatCurrencyDisplay = (value: number) => {
    return hideFinancialData ? "R$ ***" : formatCurrency(value)
  }

  const hasMonthlyData = monthlyData.length > 0
  const hasStudentData = studentData.length > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Financeiro</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setHideFinancialData(!hideFinancialData)}
            className="h-10 w-10 shrink-0"
          >
            {hideFinancialData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            onClick={generatePDF}
            className="h-10 px-4 flex-1 sm:flex-none items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="period">Período</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
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

            {selectedPeriod === "custom" && (
              <>
                <div>
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="h-12 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="h-12 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrencyDisplay(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.length} pagamento{filteredPayments.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Paga</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrencyDisplay(stats.paidRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.filter((p) => p.status === "paid").length} pagamento
              {filteredPayments.filter((p) => p.status === "paid").length !== 1 ? "s" : ""} pago
              {filteredPayments.filter((p) => p.status === "paid").length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Pendente</CardTitle>
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrencyDisplay(stats.pendingRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredPayments.filter((p) => p.status === "pending").length} pagamento
              {filteredPayments.filter((p) => p.status === "pending").length !== 1 ? "s" : ""} pendente
              {filteredPayments.filter((p) => p.status === "pending").length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análise Mensal</CardTitle>
            {stats.revenueDifference >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrencyDisplay(stats.currentMonthRevenue)}</div>
            <p className={`text-xs font-medium ${stats.revenueDifference >= 0 ? "text-green-600" : "text-red-600"}`}>
              {stats.revenueDifference >= 0 ? "+" : ""}
              {hideFinancialData ? "R$ ***" : formatCurrency(stats.revenueDifference)} vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {!hideFinancialData && (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Receita Mensal (Últimos 6 Meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasMonthlyData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--foreground))" style={{ fontSize: "12px" }} />
                      <YAxis stroke="hsl(var(--foreground))" style={{ fontSize: "12px" }} />
                      <Tooltip
                        formatter={(value: any) => formatCurrency(Number(value))}
                        labelFormatter={(label) => {
                          const item = monthlyData.find((d) => d.month === label)
                          return item?.fullMonth || label
                        }}
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Bar dataKey="pago" fill="#22c55e" name="Pago" />
                      <Bar dataKey="pendente" fill="#f59e0b" name="Pendente" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Top 5 Alunos (Aulas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasStudentData ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={studentData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--foreground))" style={{ fontSize: "12px" }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        stroke="hsl(var(--foreground))"
                        style={{ fontSize: "12px" }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "6px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                      />
                      <Legend />
                      <Bar dataKey="completed" fill="#22c55e" name="Concluídas" />
                      <Bar dataKey="scheduled" fill="#3b82f6" name="Agendadas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum dado disponível</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Tendência de Receita
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasMonthlyData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--foreground))" style={{ fontSize: "12px" }} />
                    <YAxis stroke="hsl(var(--foreground))" style={{ fontSize: "12px" }} />
                    <Tooltip
                      formatter={(value: any) => formatCurrency(Number(value))}
                      labelFormatter={(label) => {
                        const item = monthlyData.find((d) => d.month === label)
                        return item?.fullMonth || label
                      }}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="pago" stroke="#22c55e" strokeWidth={2} name="Pago" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Nenhum dado disponível</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredPayments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum pagamento encontrado</h3>
                  <p className="text-muted-foreground">
                    {selectedPeriod === "all"
                      ? "Não há pagamentos cadastrados ainda"
                      : "Não há pagamentos no período selecionado"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPayments
                    .sort((a, b) => {
                      if (!a.date || !b.date) return 0
                      return new Date(b.date).getTime() - new Date(a.date).getTime()
                    })
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-start md:items-center gap-3">
                            <div>
                              <h4 className="font-semibold">{payment.studentName}</h4>
                              <p className="text-sm text-muted-foreground">{payment.subject}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {payment.date ? format(parseISO(payment.date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-3 w-full md:w-auto">
                          <div className="flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-0 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-lg font-bold text-blue-600">{formatCurrency(payment.amount)}</div>
                            <Badge
                              variant={payment.status === "paid" ? "default" : "secondary"}
                              className={
                                payment.status === "paid"
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-800 dark:text-amber-100 dark:hover:bg-amber-700"
                              }
                            >
                              {payment.status === "paid" ? "Pago" : "Pendente"}
                            </Badge>
                          </div>

                          {payment.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => handleMarkAsPaid(payment)}
                              className="bg-green-500 hover:bg-green-600 text-white w-full md:w-auto"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Marcar como Pago
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
