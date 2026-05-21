import { Badge } from "@/components/ui/badge"

type ClassStatus = "open" | "booked" | "completed" | "cancelled" | "rescheduled" | "pending_approval"

const STATUS_CONFIG: Record<ClassStatus, { label: string; className: string }> = {
  open: {
    label: "Disponível",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  booked: {
    label: "Agendada",
    className: "bg-primary/10 text-primary border-primary/20",
  },
  completed: {
    label: "Concluída",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  rescheduled: {
    label: "Reagendada",
    className: "bg-violet-500/10 text-violet-600 border-violet-200",
  },
  pending_approval: {
    label: "Aguardando",
    className: "bg-amber-500/10 text-amber-600 border-amber-200",
  },
}

interface ClassStatusBadgeProps {
  status: string
  className?: string
}

export function ClassStatusBadge({ status, className }: ClassStatusBadgeProps) {
  const config = STATUS_CONFIG[status as ClassStatus] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border-border",
  }

  return (
    <Badge variant="outline" className={`text-xs ${config.className} ${className ?? ""}`}>
      {config.label}
    </Badge>
  )
}
