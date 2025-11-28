"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { getStudentClasses, acceptClassInvite, rejectClassInvite, getPayments, type Class, supabase } from "@/lib/supabase-db"
import { toast } from "@/hooks/use-toast"
import { format, parseISO, isAfter, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function SchedulePage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [classesData, paymentsData] = await Promise.all([
          getStudentClasses(),
          getPayments()
        ])
        setClasses(classesData)
        setPayments(paymentsData)
      }
    } catch (error) {
      console.error("Error fetching schedule:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar sua agenda.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh when classes are updated
  useEffect(() => {
    const handleUpdate = () => {
      fetchData()
    }
    window.addEventListener("classUpdated", handleUpdate)
    window.addEventListener("paymentUpdated", handleUpdate)

    // Supabase Realtime Subscription
    const channel = supabase.channel('student-schedule-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchData()
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener("classUpdated", handleUpdate)
      window.removeEventListener("paymentUpdated", handleUpdate)
      supabase.removeChannel(channel)
    }
  }, [])

  const handleAcceptInvite = async (classId: string) => {
    setProcessingId(classId)
    try {
      await acceptClassInvite(classId)
      toast({
        title: "Convite Aceito",
        description: "Aula confirmada na sua agenda.",
      })
      fetchData()
    } catch (error) {
      console.error("Error accepting invite:", error)
      toast({
        title: "Erro",
        description: "Erro ao aceitar convite.",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectInvite = async (classId: string) => {
    setProcessingId(classId)
    try {
      await rejectClassInvite(classId)
      toast({
        title: "Convite Recusado",
        description: "A aula foi removida.",
      })
      fetchData()
    } catch (error) {
      console.error("Error rejecting invite:", error)
      toast({
        title: "Erro",
        description: "Erro ao recusar convite.",
        variant: "destructive"
      })
    } finally {
      setProcessingId(null)
    }
  }

  // Logic: Upcoming = Booked (regardless of date, until marked completed)
  const upcomingClasses = classes.filter(c => c.status === 'booked')
  
  // Logic: Past = Completed, Cancelled or Rescheduled
  const pastClasses = classes.filter(c => c.status === 'completed' || c.status === 'cancelled' || c.status === 'rescheduled')
  
  const invites = classes.filter(c => c.status === 'pending_approval')

  // Calculate debt
  const unpaidClasses = classes.filter(c => {
    // Check if class is completed or past booked
    const isPast = c.status === 'completed' || (c.status === 'booked' && isBefore(parseISO(c.date), new Date()))
    if (!isPast) return false
    
    // Check payment status
    const payment = payments.find(p => p.classId === c.id || p.class_id === c.id)
    return !payment || payment.status === 'pending'
  })

  const totalDebt = unpaidClasses.reduce((sum, c) => sum + c.value, 0)

  const ClassCard = ({ cls, isInvite = false }: { cls: Class, isInvite?: boolean }) => {
    const payment = payments.find(p => p.classId === cls.id || p.class_id === cls.id)
    const isPaid = payment?.status === 'paid'
    const isPast = cls.status === 'completed' || (cls.status === 'booked' && isBefore(parseISO(cls.date), new Date()))

    return (
      <Card className={`flex flex-col ${isInvite ? 'border-blue-500 border-2' : ''} ${!isInvite && isPast && !isPaid ? 'border-red-200 bg-red-50 dark:bg-red-900/10' : ''}`}>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{cls.subject}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <User className="h-3 w-3" />
                {cls.teacherName}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant={isInvite ? "default" : "secondary"} className="font-bold">
                {isInvite ? "Convite" : formatCurrency(cls.value)}
              </Badge>
              {!isInvite && (
                <Badge variant={isPaid ? "default" : "outline"} className={`text-xs ${isPaid ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' : 'text-yellow-600 border-yellow-600'}`}>
                  {isPaid ? "Pago" : "Pendente"}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(parseISO(cls.date), "dd 'de' MMMM", { locale: ptBR })}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{cls.time} ({cls.duration} min)</span>
          </div>
          {cls.notes && (
            <div className="mt-2 p-2 bg-muted rounded-md text-sm">
              <span className="font-semibold">Notas:</span> {cls.notes}
            </div>
          )}
        </CardContent>
        {isInvite && (
          <CardFooter className="flex gap-2">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700" 
              onClick={() => handleAcceptInvite(cls.id)}
              disabled={!!processingId}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aceitar
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" className="flex-1" disabled={!!processingId}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Recusar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Recusar Convite</DialogTitle>
                  <DialogDescription>
                    Tem certeza que deseja recusar esta aula? Esta ação não pode ser desfeita.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>Cancelar</Button>
                  <Button variant="destructive" onClick={() => handleRejectInvite(cls.id)}>
                    Confirmar Recusa
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardFooter>
        )}
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Minha Agenda</h1>
        <p className="text-muted-foreground">
          Gerencie suas aulas e convites.
        </p>
      </div>

      {totalDebt > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3 text-red-800 dark:text-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Pagamentos Pendentes</p>
            <p className="text-sm">Você tem um total de <span className="font-bold">{formatCurrency(totalDebt)}</span> em aulas pendentes de pagamento.</p>
          </div>
        </div>
      )}

      {invites.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600 font-semibold">
            <AlertCircle className="h-5 w-5" />
            Você tem {invites.length} convite(s) pendente(s)
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {invites.map(cls => (
              <ClassCard key={cls.id} cls={cls} isInvite={true} />
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">Próximas Aulas</TabsTrigger>
          <TabsTrigger value="past">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-6">
          {upcomingClasses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma aula agendada.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcomingClasses.map(cls => (
                <ClassCard key={cls.id} cls={cls} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-6">
          {pastClasses.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhuma aula no histórico.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastClasses.map(cls => (
                <ClassCard key={cls.id} cls={cls} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
