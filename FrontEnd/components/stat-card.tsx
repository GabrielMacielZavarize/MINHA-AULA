import type { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconClassName?: string
  iconWrapperClassName?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = "text-primary",
  iconWrapperClassName = "bg-primary/10",
}: StatCardProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("h-8 w-8 rounded-md flex items-center justify-center", iconWrapperClassName)}>
          <Icon className={cn("h-4 w-4", iconClassName)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
