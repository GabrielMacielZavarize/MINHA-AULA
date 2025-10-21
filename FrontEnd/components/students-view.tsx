"use client"

import { useState, useEffect } from "react"
import { Users, Search, Phone, Mail, BookOpen, Calendar, Edit, Trash2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useI18n } from "@/lib/i18n"
import { useStudents } from "@/hooks/use-students"
import { useClasses } from "@/hooks/use-classes"
import { NewStudentForm } from "@/components/new-student-form"
import { useToast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"

export function StudentsView() {
  const [searchTerm, setSearchTerm] = useState("")
  const [newStudentOpen, setNewStudentOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const { t } = useI18n()
  const { students, deleteStudent, refresh } = useStudents()
  const { classes } = useClasses()
  const { toast } = useToast()

  useEffect(() => {
    const handleStudentUpdate = () => {
      refresh()
    }

    window.addEventListener("studentUpdated", handleStudentUpdate)
    return () => {
      window.removeEventListener("studentUpdated", handleStudentUpdate)
    }
  }, [refresh])

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm),
  )

  const handleStudentSuccess = () => {
    setNewStudentOpen(false)
    setEditingStudent(null)
    refresh()
    window.dispatchEvent(new CustomEvent("studentUpdated"))
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await deleteStudent(studentId)
      window.dispatchEvent(new CustomEvent("studentUpdated"))
      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao remover aluno",
        variant: "destructive",
      })
    }
  }

  const getStudentStats = (studentId: string) => {
    const studentClasses = classes.filter((c) => c.studentId === studentId)
    const completedClasses = studentClasses.filter((c) => c.status === "completed").length
    const scheduledClasses = studentClasses.filter((c) => c.status === "scheduled").length
    const totalEarnings = studentClasses.filter((c) => c.status === "completed").reduce((sum, c) => sum + c.value, 0)

    return {
      totalClasses: studentClasses.length,
      completedClasses,
      scheduledClasses,
      totalEarnings,
      lastClass:
        studentClasses.length > 0
          ? studentClasses.sort(
              (a, b) => new Date(b.date + " " + b.time).getTime() - new Date(a.date + " " + a.time).getTime(),
            )[0]
          : null,
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Alunos</h2>

          <Dialog open={newStudentOpen} onOpenChange={setNewStudentOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white">
                <UserPlus className="h-5 w-5 shrink-0" />
                <span className="hidden sm:inline truncate">Novo Aluno</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] bg-background border">
              <DialogHeader>
                <DialogTitle>Adicionar Aluno</DialogTitle>
              </DialogHeader>
              <ScrollArea className="max-h-[70vh]">
                <NewStudentForm onSuccess={handleStudentSuccess} onCancel={() => setNewStudentOpen(false)} />
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar alunos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente ajustar sua busca" : "Comece adicionando seu primeiro aluno"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredStudents.map((student) => {
            const stats = getStudentStats(student.id)
            return (
              <Card key={student.id} className="touch-manipulation hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 shrink-0">
                        <AvatarImage src="/placeholder-user.jpg" alt={student.name} />
                        <AvatarFallback className="text-lg font-semibold">
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold line-clamp-1">{student.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {stats.totalClasses} aula{stats.totalClasses !== 1 ? "s" : ""}
                          </Badge>
                          {stats.totalEarnings > 0 && (
                            <Badge variant="default" className="text-xs bg-success text-success-foreground">
                              {formatCurrency(stats.totalEarnings)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Dialog
                        open={editingStudent?.id === student.id}
                        onOpenChange={(open) => !open && setEditingStudent(null)}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingStudent(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] bg-background border">
                          <DialogHeader>
                            <DialogTitle>Editar Aluno</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="max-h-[70vh]">
                            <NewStudentForm
                              student={editingStudent}
                              onSuccess={handleStudentSuccess}
                              onCancel={() => setEditingStudent(null)}
                            />
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-error hover:text-error">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o aluno "{student.name}"? Esta ação não pode ser desfeita e
                              todas as aulas relacionadas também serão removidas.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStudent(student.id)}
                              className="bg-error text-error-foreground hover:bg-error/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{student.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{student.email}</span>
                    </div>
                    {student.subject && (
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate">{student.subject}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div>
                        <div className="font-medium">Concluídas</div>
                        <div className="text-lg font-bold text-success">{stats.completedClasses}</div>
                      </div>
                      <div>
                        <div className="font-medium">Agendadas</div>
                        <div className="text-lg font-bold text-primary">{stats.scheduledClasses}</div>
                      </div>
                    </div>

                    {stats.lastClass && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3 shrink-0" />
                          <span>
                            Última aula: {format(parseISO(stats.lastClass.date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {student.notes && (
                    <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{student.notes}</div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
