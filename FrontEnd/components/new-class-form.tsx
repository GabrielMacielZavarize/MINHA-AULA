"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useStudents } from "@/hooks/use-students"
import { useClasses } from "@/hooks/use-classes"
import { toast } from "@/hooks/use-toast"
import { TagSelector } from "@/components/tag-selector"
import { formatCurrencyInput, parseCurrencyInput } from "@/lib/utils"
import type { Tag } from "@/hooks/use-tags"

interface NewClassFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function NewClassForm({ onSuccess, onCancel }: NewClassFormProps) {
  const [studentId, setStudentId] = useState("")
  const [subject, setSubject] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [duration, setDuration] = useState("60")
  const [valueDisplay, setValueDisplay] = useState("")
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)

  const { students } = useStudents()
  const { createClass } = useClasses()

  // Get hourly rate from settings
  const [hourlyRate, setHourlyRate] = useState(0)

  useEffect(() => {
    const settings = localStorage.getItem("minha-aula-settings")
    if (settings) {
      const parsed = JSON.parse(settings)
      setHourlyRate(parsed.hourlyRate || 0)
    }
  }, [])

  // Calculate value based on duration and hourly rate
  useEffect(() => {
    if (hourlyRate > 0 && duration) {
      const hours = Number.parseInt(duration) / 60
      const calculatedValue = hourlyRate * hours
      setValueDisplay(formatCurrencyInput(calculatedValue.toFixed(2).replace(".", "")))
    }
  }, [duration, hourlyRate])

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value)
    setValueDisplay(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!studentId || !subject || !date || !time) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      })
      return
    }

    const value = parseCurrencyInput(valueDisplay)

    if (value <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const student = students.find((s) => s.id === studentId)
      if (!student) {
        throw new Error("Aluno não encontrado")
      }

      await createClass({
        studentId,
        studentName: student.name,
        subject: subject.trim(),
        date,
        time,
        duration: Number.parseInt(duration),
        value,
        status: "scheduled",
        tags: selectedTags,
      })

      toast({
        title: "Sucesso",
        description: "Aula cadastrada com sucesso",
        variant: "success",
      })

      // Reset form
      setStudentId("")
      setSubject("")
      setDate("")
      setTime("")
      setDuration("60")
      setValueDisplay("")
      setSelectedTags([])

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating class:", error)
      toast({
        title: "Erro",
        description: "Erro ao cadastrar aula",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      <div>
        <Label htmlFor="student">Aluno *</Label>
        <Select value={studentId} onValueChange={setStudentId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o aluno" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id}>
                {student.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="subject">Matéria *</Label>
        <Input
          id="subject"
          placeholder="Ex: Matemática, Física, Inglês..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="date">Data *</Label>
          <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>

        <div>
          <Label htmlFor="time">Horário *</Label>
          <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration">Duração (min) *</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
              <SelectItem value="90">1h 30min</SelectItem>
              <SelectItem value="120">2 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="value">Valor *</Label>
          <Input id="value" placeholder="R$ 0,00" value={valueDisplay} onChange={handleValueChange} required />
        </div>
      </div>

      <div>
        <Label>Etiquetas</Label>
        <TagSelector selectedTags={selectedTags} onTagsChange={setSelectedTags} />
      </div>

      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 h-12 bg-transparent">
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 text-base bg-success hover:bg-success/90 text-success-foreground"
        >
          {loading ? "Cadastrando..." : "Cadastrar Aula"}
        </Button>
      </div>
    </form>
  )
}
