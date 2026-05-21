import { useMemo } from "react"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfYear,
  endOfYear,
  parseISO,
  subMonths,
  eachMonthOfInterval,
  format,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { Class } from "@/lib/supabase-db"

export interface Payment {
  id: string
  classId?: string
  studentId?: string
  teacherId?: string
  amount: number
  status: string
  date?: string
  createdAt: string
  studentName?: string
  subject?: string
  isImplicit?: boolean
}

export type Period = "all" | "today" | "week" | "month" | "year" | "custom"

/** Combina pagamentos registrados com pagamentos implícitos de aulas sem registro */
export function mergePayments(payments: Payment[], classes: Class[]): Payment[] {
  const paymentMap = new Map(payments.map((p) => [p.classId, p]))

  const implicit: Payment[] = classes
    .filter(
      (c) =>
        c.value > 0 &&
        c.status !== "cancelled" &&
        c.status !== "pending_approval" &&
        c.studentId &&
        !paymentMap.has(c.id),
    )
    .map((c) => ({
      id: `implicit-${c.id}`,
      isImplicit: true,
      classId: c.id,
      studentId: c.studentId,
      teacherId: c.teacherId,
      amount: c.value,
      status: "pending",
      createdAt: c.date,
      studentName: c.studentName,
      subject: c.subject,
      date: c.date,
    }))

  return [...payments, ...implicit]
}

/** Filtra pagamentos pelo período selecionado */
export function filterByPeriod(
  payments: Payment[],
  period: Period,
  customStart?: string,
  customEnd?: string,
): Payment[] {
  const now = new Date()
  return payments.filter((p) => {
    if (!p.date) return false
    const date = parseISO(p.date)

    switch (period) {
      case "today":
        return format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
      case "week": {
        const start = startOfWeek(now, { weekStartsOn: 0 })
        const end = endOfWeek(now, { weekStartsOn: 0 })
        return date >= start && date <= end
      }
      case "month": {
        return date >= startOfMonth(now) && date <= endOfMonth(now)
      }
      case "year": {
        return date >= startOfYear(now) && date <= endOfYear(now)
      }
      case "custom":
        if (!customStart || !customEnd) return true
        return date >= parseISO(customStart) && date <= parseISO(customEnd)
      default:
        return true
    }
  })
}

export interface FinancialStats {
  totalRevenue: number
  paidRevenue: number
  pendingRevenue: number
  currentMonthRevenue: number
  lastMonthRevenue: number
  revenueDifference: number
  totalClasses: number
  completedClasses: number
  totalStudents: number
}

export function useFinancialStats(
  filteredPayments: Payment[],
  mergedPayments: Payment[],
  classes: Class[],
  studentCount: number,
): FinancialStats {
  return useMemo(() => {
    const now = new Date()
    const currentMonthPayments = mergedPayments.filter((p) => {
      if (!p.date) return false
      const date = parseISO(p.date)
      return date >= startOfMonth(now) && date <= endOfMonth(now)
    })
    const lastMonthPayments = mergedPayments.filter((p) => {
      if (!p.date) return false
      const date = parseISO(p.date)
      const last = subMonths(now, 1)
      return date >= startOfMonth(last) && date <= endOfMonth(last)
    })

    const totalRevenue = filteredPayments.reduce((s, p) => s + p.amount, 0)
    const paidRevenue = filteredPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0)
    const pendingRevenue = filteredPayments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0)
    const currentMonthRevenue = currentMonthPayments.reduce((s, p) => s + p.amount, 0)
    const lastMonthRevenue = lastMonthPayments.reduce((s, p) => s + p.amount, 0)

    return {
      totalRevenue,
      paidRevenue,
      pendingRevenue,
      currentMonthRevenue,
      lastMonthRevenue,
      revenueDifference: currentMonthRevenue - lastMonthRevenue,
      totalClasses: classes.length,
      completedClasses: classes.filter((c) => c.status === "completed").length,
      totalStudents: studentCount,
    }
  }, [filteredPayments, mergedPayments, classes, studentCount])
}

/** Monta dados mensais para gráficos (últimos 6 meses) */
export function useMonthlyChartData(mergedPayments: Payment[]) {
  return useMemo(() => {
    if (mergedPayments.length === 0) return []
    const now = new Date()
    return eachMonthOfInterval({ start: subMonths(now, 5), end: now }).map((month) => {
      const start = startOfMonth(month)
      const end = endOfMonth(month)
      const mp = mergedPayments.filter((p) => {
        if (!p.date) return false
        const d = parseISO(p.date)
        return d >= start && d <= end
      })
      const paid = mp.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0)
      const pending = mp.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0)
      return {
        month: format(month, "MMM", { locale: ptBR }),
        fullMonth: format(month, "MMMM yyyy", { locale: ptBR }),
        pago: Number(paid.toFixed(2)),
        pendente: Number(pending.toFixed(2)),
        total: Number((paid + pending).toFixed(2)),
      }
    })
  }, [mergedPayments])
}

/** Top 5 alunos por número de aulas */
export function useTopStudentsData(classes: Class[]) {
  return useMemo(() => {
    if (classes.length === 0) return []
    const map = new Map<string, { name: string; total: number; completed: number; scheduled: number }>()
    classes.forEach((c) => {
      const curr = map.get(c.studentId ?? "") ?? { name: c.studentName ?? "", total: 0, completed: 0, scheduled: 0 }
      curr.total++
      if (c.status === "completed") curr.completed++
      if (c.status === "booked") curr.scheduled++
      map.set(c.studentId ?? "", curr)
    })
    return Array.from(map.values()).sort((a, b) => b.total - a.total).slice(0, 5)
  }, [classes])
}
