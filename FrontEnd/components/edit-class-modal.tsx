"use client"

import { useState, useEffect } from "react"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Loader2, Save, BookOpen, Clock, DollarSign, FileText, Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { updateClass, getAllStudents, updatePayment, createPayment, getStudentByEnrollment, type Class, supabase } from "@/lib/supabase-db"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { usePayments } from "@/hooks/use-payments"

const formSchema = z.object({
  subject: z.string().min(2, "A matéria deve ter pelo menos 2 caracteres."),
  date: z.date({ message: "A data é obrigatória." }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:MM)."),
  duration: z.coerce.number().min(15, "Duração mínima de 15 minutos."),
  value: z.coerce.number().min(0, "O valor não pode ser negativo."),
  status: z.enum(['booked', 'completed', 'cancelled', 'rescheduled', 'pending_approval']),
  paymentStatus: z.enum(['paid', 'pending']),
  notes: z.string().optional(),
  studentId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditClassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classItem: Class
  initialPayment?: any
  onSuccess?: () => void
}

export function EditClassModal({ open, onOpenChange, classItem, initialPayment, onSuccess }: EditClassModalProps) {
  const { toast } = useToast()
  const { refresh: refreshPayments } = usePayments()
  const [students, setStudents] = useState<any[]>([])
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [foundStudent, setFoundStudent] = useState<any>(null)
  const [enrollmentSearch, setEnrollmentSearch] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      subject: classItem.subject,
      date: new Date(classItem.date),
      time: classItem.time ? classItem.time.slice(0, 5) : "09:00", // Ensure HH:MM format
      duration: classItem.duration,
      value: classItem.value,
      status: classItem.status as any,
      paymentStatus: 'pending',
      notes: classItem.notes || "",
      studentId: classItem.studentId || "all",
    } as Partial<FormValues>,
  })

    useEffect(() => {
    const loadData = async () => {
      try {
        const studentsData = await getAllStudents()
        setStudents(studentsData)
        
        let currentEnrollment = ""
        let currentStudent = null
        let currentPaymentStatus = 'pending'
        let currentPaymentId = null

        // Set enrollment if class has a student
        if (classItem.studentId) {
          const student = studentsData.find((s: any) => s.id === classItem.studentId)
          if (student?.enrollmentNumber) {
            currentEnrollment = student.enrollmentNumber
            currentStudent = student
          }
        }
        
        // Use passed initialPayment
        if (initialPayment) {
          currentPaymentId = initialPayment.id
          currentPaymentStatus = initialPayment.status
        }

        setEnrollmentSearch(currentEnrollment)
        setFoundStudent(currentStudent)
        setPaymentId(currentPaymentId)

        // Reset form with all values including the fetched payment status
        form.reset({
          subject: classItem.subject,
          date: new Date(classItem.date),
          time: classItem.time ? classItem.time.slice(0, 5) : "09:00",
          duration: classItem.duration,
          value: classItem.value,
          status: classItem.status as any,
          paymentStatus: currentPaymentStatus as 'pending' | 'paid',
          notes: classItem.notes || "",
          studentId: classItem.studentId || "all",
        })

      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    
    if (open) {
      loadData()
    }
  }, [classItem, form, open, initialPayment])

  const handleEnrollmentSearch = async (value: string) => {
    setEnrollmentSearch(value)
    if (value.length === 8 && /^\d+$/.test(value)) {
      try {
        const student = await getStudentByEnrollment(value)
        if (student) {
          setFoundStudent(student)
          form.setValue('studentId', student.id)
        } else {
          setFoundStudent(null)
          form.setValue('studentId', undefined)
          toast({
            variant: "destructive",
            title: "Aluno não encontrado",
            description: "Nenhum aluno encontrado com esta matrícula.",
          })
        }
      } catch (error: any) {
        console.error("Error searching student:", error)
        setFoundStudent(null)
        form.setValue('studentId', undefined)
      }
    } else {
      setFoundStudent(null)
      form.setValue('studentId', undefined)
    }
  }

  async function onSubmit(values: FormValues) {
    console.log("Starting update with values:", values);
    try {
      const formattedDate = format(values.date, "yyyy-MM-dd")
      const timeValue = values.time
      
      const finalStudentId = foundStudent?.id || classItem.studentId || (values.studentId === "all" ? null : values.studentId)
      
      // Update Class
      console.log("Calling updateClass...");
      try {
        await updateClass(classItem.id, {
          subject: values.subject,
          date: formattedDate,
          time: timeValue,
          duration: values.duration,
          value: values.value,
          status: values.status,
          notes: values.notes,
          studentId: finalStudentId,
        })
        console.log("updateClass success");
      } catch (e) {
        console.error("Failed to update class:", e);
        throw e;
      }

      // Handle Payment
      if (finalStudentId) {
        console.log("Handling payment...");
        try {
          const studentIdForPayment = foundStudent?.id || finalStudentId
          if (paymentId) {
            console.log("Updating existing payment:", paymentId);
            await updatePayment(paymentId, {
              status: values.paymentStatus,
              amount: values.value,
              studentId: studentIdForPayment
            })
          } else {
            console.log("Creating new payment");
            // Ensure we have a teacherId
            let teacherId = classItem.teacherId;
            if (!teacherId) {
               const { data: { user } } = await supabase.auth.getUser();
               if (user) teacherId = user.id;
            }

            if (!teacherId) {
              throw new Error("Teacher ID is missing for payment creation");
            }

            await createPayment({
              classId: classItem.id,
              studentId: studentIdForPayment,
              teacherId: teacherId,
              amount: values.value,
              status: values.paymentStatus
            })
          }
          console.log("Payment handled successfully");
        } catch (e: any) {
          console.error("Failed to handle payment:", e);
          if (e && typeof e === 'object') {
            console.error("Payment error details:", {
              message: e.message,
              details: e.details,
              hint: e.hint,
              code: e.code
            });
          }
          // We don't throw here to allow the class update to persist even if payment fails, 
          // but we should probably notify the user.
          toast({
            variant: "destructive",
            title: "Aviso",
            description: "Aula atualizada, mas houve um erro ao atualizar o pagamento.",
          })
        }
      }

      refreshPayments()

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent("classUpdated"))
        window.dispatchEvent(new CustomEvent("paymentUpdated"))
      }

      toast({
        title: "Aula atualizada!",
        description: "As alterações foram salvas com sucesso.",
      })

      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error("Error in onSubmit:", error)
      // Try to log the error object structure
      try {
        console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
      } catch (e) {
        console.error("Could not stringify error");
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error?.message || "Ocorreu um erro ao salvar as alterações. Verifique o console.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Editar Aula
          </DialogTitle>
          <DialogDescription>
            Faça alterações nos detalhes da aula e gerencie o status de pagamento.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Section: Basic Info */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" /> Informações Básicas
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Matéria</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: Matemática" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Aluno (Matrícula)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar matrícula (8 dígitos)"
                            maxLength={8}
                            value={enrollmentSearch}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '')
                              setEnrollmentSearch(value)
                              handleEnrollmentSearch(value)
                            }}
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      {foundStudent && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">{foundStudent.name}</p>
                          </div>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section: Schedule */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Agendamento
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "dd/MM/yyyy") : <span>Selecione</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            locale={ptBR}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duração (min)</FormLabel>
                      <Input type="number" {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section: Financial & Status */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Financeiro e Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status da Aula</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending_approval">Pendente</SelectItem>
                          <SelectItem value="booked">Agendada</SelectItem>
                          <SelectItem value="completed">Concluída</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status do Pagamento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="paid">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} className="resize-none" placeholder="Adicione notas sobre a aula..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
