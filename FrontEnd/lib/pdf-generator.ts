import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import type { Payment, FinancialStats, Period } from "@/hooks/use-financial-stats"

const COLORS = {
  primary: [59, 130, 246] as [number, number, number],
  success: [34, 197, 94] as [number, number, number],
  warning: [245, 158, 11] as [number, number, number],
  text: [31, 41, 55] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
}

function periodLabel(period: Period, customStart?: string, customEnd?: string): string {
  switch (period) {
    case "today": return "Hoje"
    case "week": return "Última Semana"
    case "month": return "Último Mês"
    case "year": return "Último Ano"
    case "custom": return `${customStart} até ${customEnd}`
    default: return "Todo o Período"
  }
}

export async function generateFinancialPDF(
  filteredPayments: Payment[],
  stats: FinancialStats,
  period: Period,
  customStart?: string,
  customEnd?: string,
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()

  // Header
  doc.setFillColor(...COLORS.primary)
  doc.rect(0, 0, 210, 40, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont("helvetica", "bold")
  doc.text("Relatório Financeiro", 105, 20, { align: "center" })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 105, 30, { align: "center" })

  // Period
  doc.setTextColor(...COLORS.text)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(`Período: ${periodLabel(period, customStart, customEnd)}`, 20, 50)

  // Summary boxes
  doc.setFontSize(14)
  doc.text("Resumo Financeiro", 20, 65)

  const boxes = [
    { label: "Receita Total", value: formatCurrency(stats.totalRevenue), color: COLORS.primary, x: 20, y: 75 },
    { label: "Receita Paga", value: formatCurrency(stats.paidRevenue), color: COLORS.success, x: 110, y: 75 },
    { label: "Receita Pendente", value: formatCurrency(stats.pendingRevenue), color: COLORS.warning, x: 20, y: 105 },
    {
      label: "Aulas / Alunos",
      value: `${stats.completedClasses}/${stats.totalClasses} aulas | ${stats.totalStudents} alunos`,
      color: COLORS.muted,
      x: 110,
      y: 105,
    },
  ]

  boxes.forEach(({ label, value, color, x, y }) => {
    doc.setFillColor(245, 250, 255)
    doc.roundedRect(x, y, 85, 25, 3, 3, "F")
    doc.setDrawColor(...color)
    doc.roundedRect(x, y, 85, 25, 3, 3, "S")
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.muted)
    doc.text(label, x + 5, y + 8)
    doc.setFontSize(13)
    doc.setTextColor(...color)
    doc.setFont("helvetica", "bold")
    doc.text(value, x + 5, y + 18)
  })

  // Payments table
  let y = 145
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...COLORS.text)
  doc.text("Detalhamento de Pagamentos", 20, y)
  y += 10

  const drawTableHeader = () => {
    doc.setFillColor(249, 250, 251)
    doc.rect(20, y, 170, 8, "F")
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...COLORS.text)
    doc.text("Data", 25, y + 5)
    doc.text("Aluno", 50, y + 5)
    doc.text("Matéria", 95, y + 5)
    doc.text("Valor", 135, y + 5)
    doc.text("Status", 165, y + 5)
    y += 12
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
  }

  drawTableHeader()

  const sorted = [...filteredPayments].sort((a, b) => {
    if (!a.date || !b.date) return 0
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  sorted.forEach((p, i) => {
    if (y > 270) {
      doc.addPage()
      y = 30
      drawTableHeader()
    }
    if (i % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(20, y - 4, 170, 7, "F")
    }
    doc.setTextColor(...COLORS.text)
    doc.text(p.date ? format(parseISO(p.date), "dd/MM/yyyy") : "-", 25, y)
    doc.text((p.studentName ?? "").substring(0, 18), 50, y)
    doc.text((p.subject ?? "").substring(0, 18), 95, y)
    doc.text(formatCurrency(p.amount), 135, y)
    doc.setTextColor(...(p.status === "paid" ? COLORS.success : COLORS.warning))
    doc.text(p.status === "paid" ? "Pago" : "Pendente", 165, y)
    y += 7
  })

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(...COLORS.muted)
    doc.text(`Página ${i} de ${pages}`, 105, 290, { align: "center" })
  }

  doc.save(`relatorio-financeiro-${format(new Date(), "yyyy-MM-dd")}.pdf`)
}
