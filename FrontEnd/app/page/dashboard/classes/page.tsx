"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Search, Plus, MoreVertical, CheckCircle, XCircle, AlertCircle, DollarSign, Loader2 } from "lucide-react"
import { getTeacherClasses, deleteClass, updateClass, getPayments, type Class, supabase } from "@/lib/supabase-db"
import { toast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"
import { CreateClassModal } from "@/components/create-class-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditClassModal } from "@/components/edit-class-modal"

export default function ClassesManagementPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [payments, setPayments] = useState<any[]>([])

  const fetchClasses = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [classesData, paymentsData] = await Promise.all([
          getTeacherClasses(user.id),
          getPayments()
        ])
        setClasses(classesData)
        setFilteredClasses(classesData)
        setPayments(paymentsData)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aulas.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh when classes are updated
  // Auto-refresh when classes are updated
  useEffect(() => {
    const handleUpdate = () => {
      fetchClasses()
    }
    window.addEventListener("classUpdated", handleUpdate)
    window.addEventListener("paymentUpdated", handleUpdate)

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('classes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'classes' },
        (payload) => {
          console.log('Realtime update:', payload)
          fetchClasses()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          console.log('Realtime payment update:', payload)
          fetchClasses()
        }
      )
      .subscribe()

    return () => {
      window.removeEventListener("classUpdated", handleUpdate)
      window.removeEventListener("paymentUpdated", handleUpdate)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    let result = classes
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase()
      result = result.filter(c => 
        c.subject.toLowerCase().includes(lowerTerm) || 
        c.studentName?.toLowerCase().includes(lowerTerm)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter(c => c.status === statusFilter)
    }
    setFilteredClasses(result)
  }, [classes, searchTerm, statusFilter])

  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta aula?")) return
    try {
      // Optimistic update - remove from UI immediately
      setClasses(prev => prev.filter(c => c.id !== classId))
      setFilteredClasses(prev => prev.filter(c => c.id !== classId))
      
      await deleteClass(classId)
      
      toast({
        title: "Sucesso",
        description: "Aula excluída com sucesso.",
      })
      
      // Refresh to ensure consistency
      fetchClasses()
      
      // Dispatch event to update dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("classUpdated"))
      }
    } catch (error: any) {
      console.error("Error deleting class:", error)
      // Revert optimistic update on error
      fetchClasses()
      toast({
        title: "Erro",
        description: error?.message || "Erro ao excluir aula.",
        variant: "destructive"
      })
    }
  }

  const handleStatusChange = async (classId: string, newStatus: any) => {
    try {
      await updateClass(classId, { status: newStatus })
      toast({
        title: "Sucesso",
        description: `Status atualizado para ${newStatus}.`,
      })
      fetchClasses()
      // Dispatch event to update dashboard
      window.dispatchEvent(new CustomEvent("classUpdated"))
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar status.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Aulas</h1>
          <p className="text-muted-foreground">
            Crie, edite e gerencie suas aulas.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Aula
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4 md:flex md:space-y-0 md:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por aluno ou matéria..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-[200px]">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="open">Aberta</SelectItem>
                <SelectItem value="booked">Agendada</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="rescheduled">Remarcada</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
                <SelectItem value="pending_approval">Pendente Aprovação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center py-10 text-muted-foreground">Carregando aulas...</p>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            <p>Nenhuma aula encontrada.</p>
          </div>
        ) : (
          filteredClasses.map((cls) => (
            <Card key={cls.id} className="group hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <Badge 
                      variant={
                        cls.status === 'completed' ? 'default' : 
                        cls.status === 'booked' ? 'secondary' : 
                        cls.status === 'rescheduled' ? 'secondary' :
                        cls.status === 'cancelled' ? 'destructive' : 'outline'
                      }
                      className="font-semibold"
                    >
                      {cls.status === 'completed' ? 'Concluída' : 
                       cls.status === 'booked' ? 'Agendada' : 
                       cls.status === 'rescheduled' ? 'Remarcada' :
                       cls.status === 'cancelled' ? 'Cancelada' : 
                       cls.status === 'pending_approval' ? 'Pendente' : 'Aberta'}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="sr-only">Abrir menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setEditingClass(cls)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleStatusChange(cls.id, 'completed')}>
                          Marcar como Concluída
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(cls.id, 'rescheduled')}>
                          Marcar como Remarcada
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(cls.id, 'cancelled')}>
                          Cancelar Aula
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteClass(cls.id)}>
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardTitle className="text-lg font-bold truncate">{cls.subject}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-sm">
                      {cls.studentEnrollment ? (
                        <span className="font-mono">Matrícula: {cls.studentEnrollment}</span>
                      ) : (
                        cls.studentName || "Sem aluno (Aberta)"
                      )}
                    </span>
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{format(parseISO(cls.date), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-md">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{cls.time}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(cls.value)}
                    </span>
                  </div>
                  
                  {(() => {
                    const payment = payments.find((p: any) => p.classId === cls.id || p.class_id === cls.id)
                    if (payment) {
                      return (
                        <Badge 
                          variant={payment.status === 'paid' ? 'default' : 'outline'}
                          className={`font-medium text-xs ${
                            payment.status === 'paid' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300' 
                              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}
                        >
                          {payment.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      )
                    }
                    // Show "Pendente" if value > 0 and no payment record, implying it needs payment
                    if (cls.value > 0) {
                       return (
                        <Badge 
                          variant="outline"
                          className="font-medium text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                        >
                          Pendente
                        </Badge>
                      )
                    }
                    return null
                  })()}
                </div>

                {cls.notes && (
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded italic line-clamp-2">
                    "{cls.notes}"
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateClassModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
        onSuccess={() => {
          fetchClasses()
          // Dispatch event to update dashboard
          window.dispatchEvent(new CustomEvent("classUpdated"))
        }} 
      />
      
      {editingClass && (
        <EditClassModal
          open={!!editingClass}
          onOpenChange={(open) => !open && setEditingClass(null)}
          classItem={editingClass}
          initialPayment={payments.find((p: any) => p.classId === editingClass.id || p.class_id === editingClass.id)}
          onSuccess={() => {
            fetchClasses()
            // Dispatch event to update dashboard
            window.dispatchEvent(new CustomEvent("classUpdated"))
          }}
        />
      )}
    </div>
  )
}
