"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, Loader2, Plus, BookOpen, Clock, DollarSign, FileText, Search, Check } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
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
import { useClasses } from "@/hooks/use-classes"
import { useToast } from "@/components/ui/use-toast"
import { getAllStudents, getStudentByEnrollment } from "@/lib/supabase-db"
import { useEffect } from "react"

const formSchema = z.object({
  subject: z.string().min(2, {
    message: "A matéria deve ter pelo menos 2 caracteres.",
  }),
  date: z.date({
    message: "A data é obrigatória.",
  }),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido (HH:MM).",
  }),
  duration: z.coerce.number().min(15, {
    message: "A duração mínima é de 15 minutos.",
  }),
  value: z.coerce.number().min(0, {
    message: "O valor não pode ser negativo.",
  }),
  notes: z.string().optional(),
  studentId: z.string().optional(),
  enrollmentNumber: z.string().optional(),
})

interface CreateClassModalProps {
  defaultSubject?: string
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type FormOutput = z.output<typeof formSchema>
type FormInput = z.input<typeof formSchema>

export function CreateClassModal({ defaultSubject, onSuccess, open: controlledOpen, onOpenChange }: CreateClassModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const { createClass } = useClasses()
  const { toast } = useToast()
  const [students, setStudents] = useState<any[]>([])
  const [foundStudent, setFoundStudent] = useState<any>(null)
  const [enrollmentSearch, setEnrollmentSearch] = useState("")

  const form = useForm<FormInput, any, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: defaultSubject || "",
      duration: 60,
      value: 50,
      time: "09:00",
      // @ts-ignore - Date is required in schema but undefined in defaultValues is handled by react-hook-form
      date: undefined,
    },
  })

  useEffect(() => {
    getAllStudents().then(setStudents).catch(console.error)
  }, [])

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
      } catch (error) {
        console.error("Error searching student:", error)
        setFoundStudent(null)
        form.setValue('studentId', undefined)
      }
    } else {
      setFoundStudent(null)
      form.setValue('studentId', undefined)
    }
  }

  async function onSubmit(values: FormOutput) {
    try {
      const formattedDate = format(values.date, "yyyy-MM-dd")
      
      await createClass({
        ...values,
        date: formattedDate,
        studentId: foundStudent?.id || (values.studentId === "all" ? undefined : values.studentId),
      })

      toast({
        title: "Aula criada!",
        description: "Sua aula foi disponibilizada no marketplace.",
      })

      setOpen(false)
      form.reset()
      setEnrollmentSearch("")
      setFoundStudent(null)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        variant: "destructive",
        title: "Erro ao criar aula",
        description: "Ocorreu um erro ao tentar criar a aula. Tente novamente.",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Plus className="h-6 w-6 text-primary" />
            Criar Nova Aula
          </DialogTitle>
          <DialogDescription>
            Defina os detalhes da aula que você quer oferecer.
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
                  name="enrollmentNumber"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Aluno (Matrícula - Opcional)</FormLabel>
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
                              field.onChange(value)
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
                            disabled={(date) =>
                              date < new Date() || date < new Date("1900-01-01")
                            }
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
                      <Select onValueChange={field.onChange} defaultValue={(field.value as number).toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="30">30 minutos</SelectItem>
                          <SelectItem value="45">45 minutos</SelectItem>
                          <SelectItem value="60">1 hora</SelectItem>
                          <SelectItem value="90">1 hora e 30 min</SelectItem>
                          <SelectItem value="120">2 horas</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section: Financial & Notes */}
            <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" /> Financeiro e Detalhes
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} value={field.value as string | number | undefined} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detalhes adicionais sobre a aula..." 
                          className="resize-none min-h-[38px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Aula
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
