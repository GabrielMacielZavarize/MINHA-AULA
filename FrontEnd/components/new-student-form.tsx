"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useStudents } from "@/hooks/use-students"
import { useToast } from "@/hooks/use-toast"
import { formatPhoneInput, formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"

interface NewStudentFormProps {
  student?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function NewStudentForm({ student, onSuccess, onCancel }: NewStudentFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [hourlyRate, setHourlyRate] = useState("")
  const [classRate, setClassRate] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { createStudent, updateStudent } = useStudents()
  const { toast } = useToast()

  useEffect(() => {
    if (student) {
      setName(student.name || "")
      setEmail(student.email || "")
      setPhone(formatPhoneInput(student.phone || ""))
      setSubject(student.subject || "")
      setHourlyRate(student.hourlyRate ? formatCurrencyInput(String(student.hourlyRate * 100)) : "")
      setClassRate(student.classRate ? formatCurrencyInput(String(student.classRate * 100)) : "")
      setNotes(student.notes || "")
    }
  }, [student])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value)
    setPhone(formatted)
  }

  const handleHourlyRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setHourlyRate(formatted)
  }

  const handleClassRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setClassRate(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const studentData = {
        name,
        email,
        phone: phone.replace(/\D/g, ""),
        subject,
        hourlyRate: parseCurrencyInput(hourlyRate),
        classRate: parseCurrencyInput(classRate),
        notes,
      }

      if (student) {
        await updateStudent(student.id, studentData)
        toast({
          title: "Sucesso",
          description: "Aluno atualizado com sucesso",
        })
      } else {
        await createStudent(studentData)
        toast({
          title: "Sucesso",
          description: "Aluno cadastrado com sucesso",
        })
      }

      window.dispatchEvent(new CustomEvent("studentUpdated"))

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: student ? "Erro ao atualizar aluno" : "Erro ao cadastrar aluno",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do aluno" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone *</Label>
        <Input
          id="phone"
          value={phone}
          onChange={handlePhoneChange}
          placeholder="(00) 00000-0000"
          maxLength={15}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Matéria</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ex: Matemática, Português"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hourlyRate">Valor por Hora</Label>
        <Input id="hourlyRate" value={hourlyRate} onChange={handleHourlyRateChange} placeholder="R$ 0,00" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="classRate">Valor por Aula</Label>
        <Input id="classRate" value={classRate} onChange={handleClassRateChange} placeholder="R$ 0,00" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Informações adicionais sobre o aluno"
          rows={3}
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 bg-transparent"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : student ? "Atualizar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  )
}
