"use client"

import { useState } from "react"
import { MoreVertical, Edit, Trash2, CheckCircle, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useClasses } from "@/hooks/use-classes"
import { usePayments } from "@/hooks/use-payments"
import { useI18n } from "@/lib/i18n"
import { toast } from "@/hooks/use-toast"
import { EditClassForm } from "./edit-class-form"
import { formatCurrency } from "@/lib/utils"
import type { Class } from "@/hooks/use-classes"

interface ClassActionsMenuProps {
  classItem: Class
  onUpdate?: () => void
}

export function ClassActionsMenu({ classItem, onUpdate }: ClassActionsMenuProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState(classItem.notes || "")

  const { updateClass, deleteClass } = useClasses()
  const { createPayment } = usePayments()
  const { t } = useI18n()

  const handleCompleteClass = async () => {
    setLoading(true)
    if (!classItem.studentId) {
      toast({
        title: "Erro",
        description: "Esta aula não tem um aluno associado.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Atualizar status da aula para concluída
      await updateClass(classItem.id, { status: "completed" })

      // Criar pagamento pendente
      await createPayment({
        studentId: classItem.studentId!,
        teacherId: classItem.teacherId,
        studentName: classItem.studentName,
        classId: classItem.id,
        subject: classItem.subject,
        date: classItem.date,
        amount: classItem.value,
        status: "pending",

      })

      toast({
        title: "Sucesso",
        description: `Aula concluída! Pagamento de ${formatCurrency(classItem.value)} adicionado como pendente.`,
        variant: "success",
      })

      setCompleteDialogOpen(false)
      if (onUpdate) onUpdate()

      // Disparar evento para atualizar dashboard
      window.dispatchEvent(new CustomEvent("classUpdated"))
    } catch (error) {
      console.error("Error completing class:", error)
      toast({
        title: "Erro",
        description: "Erro ao concluir aula",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClass = async () => {
    setLoading(true)
    try {
      await deleteClass(classItem.id)
      toast({
        title: "Sucesso",
        description: "Aula excluída com sucesso",
        variant: "success",
      })
      setDeleteDialogOpen(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Error deleting class:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir aula",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    setLoading(true)
    try {
      await updateClass(classItem.id, { notes })
      toast({
        title: "Sucesso",
        description: "Anotações salvas com sucesso",
        variant: "success",
      })
      setNotesDialogOpen(false)
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Error saving notes:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar anotações",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditSuccess = () => {
    setEditDialogOpen(false)
    if (onUpdate) onUpdate()
  }

  const canComplete = classItem.status === "booked"
  const canEdit = classItem.status !== "completed"

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menu de ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setNotesDialogOpen(true)} className="cursor-pointer">
            <FileText className="mr-2 h-4 w-4" />
            Anotações da Aula
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem onClick={() => setEditDialogOpen(true)} className="cursor-pointer">
              <Edit className="mr-2 h-4 w-4" />
              Editar Aula
            </DropdownMenuItem>
          )}

          {canComplete && (
            <DropdownMenuItem onClick={() => setCompleteDialogOpen(true)} className="cursor-pointer">
              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
              Marcar como Concluída
            </DropdownMenuItem>
          )}

          {(canEdit || canComplete) && <DropdownMenuSeparator />}

          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir Aula
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto bg-background border">
          <DialogHeader>
            <DialogTitle>Anotações da Aula</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-1">
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{classItem.studentName}</div>
                <div className="text-sm text-muted-foreground">{classItem.subject}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(classItem.date).toLocaleDateString("pt-BR")} às {classItem.time}
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Anotações e observações sobre a aula</Label>
                <Textarea
                  id="notes"
                  placeholder="Digite aqui suas anotações sobre o funcionamento da aula, progresso do aluno, tópicos abordados, etc..."
                  className="min-h-[150px] resize-none mt-2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </ScrollArea>
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 bg-transparent"
              onClick={() => setNotesDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveNotes}
              className="flex-1 h-12 text-base flex items-center justify-center gap-2 bg-success hover:bg-success/90 text-success-foreground"
              disabled={loading}
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate">Salvar</span>
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] bg-background border">
          <DialogHeader>
            <DialogTitle>Editar Aula</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <EditClassForm
              classItem={classItem}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditDialogOpen(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Complete Confirmation Dialog */}
      <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md mx-auto bg-background border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Concluir Aula
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 text-left">
                <div>Tem certeza que deseja marcar esta aula como concluída?</div>
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg space-y-2">
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    A aula será marcada como concluída
                  </div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    Um pagamento de {formatCurrency(classItem.value)} será adicionado como pendente
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteClass}
              disabled={loading}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Concluindo...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Concluir Aula
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md mx-auto bg-background border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Aula
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3">
                <div>Tem certeza que deseja excluir esta aula?</div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">{classItem.studentName}</div>
                  <div className="text-sm text-muted-foreground">{classItem.subject}</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(classItem.date).toLocaleDateString("pt-BR")} às {classItem.time}
                  </div>
                </div>
                <div className="text-sm text-destructive font-medium">Esta ação não pode ser desfeita.</div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClass}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
