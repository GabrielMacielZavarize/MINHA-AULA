"use client"

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
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
import { createClient } from "@supabase/supabase-js"
import { User } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const { classes } = useClasses()
  const { students } = useStudents()
  const { payments } = usePayments()
  const [hideFinancialData, setHideFinancialData] = useState(false)

const [currentUser, setCurrentUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
useEffect(() => {
    // Pegar o usuário da sessão do Supabase
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      setLoading(false);
    }
    fetchUser();
  }, []);

  const stats = {
    totalClasses: classes.length,
    completedClasses: classes.filter((c) => c.status === "completed").length,
    scheduledClasses: classes.filter((c) => c.status === "scheduled").length,
    totalStudents: students.length,
    totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
    paidRevenue: payments.filter((p) => p.status === "paid").reduce((sum, payment) => sum + payment.amount, 0),
    pendingRevenue: payments.filter((p) => p.status === "pending").reduce((sum, payment) => sum + payment.amount, 0),
  }

  const upcomingClasses = classes
    .filter((c) => c.status === "scheduled")
    .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())
    .slice(0, 5)

  const recentPayments = payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const formatCurrencyDisplay = (value: number) => {
    return hideFinancialData ? "R$ ***" : formatCurrency(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo de volta, {currentUser?.user_metadata?.name || "Professor"}!</p>
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
      
      <div className="grid gap-6 md:grid-cols-2">
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