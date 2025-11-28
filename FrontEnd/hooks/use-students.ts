"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  getStudents, 
  createStudent as createStudentDb, 
  updateStudent as updateStudentDb, 
  deleteStudent as deleteStudentDb,
  type Student 
} from '@/lib/supabase-db'
import { useToast } from "@/hooks/use-toast"

export type { Student }

export interface CreateStudentData {
  name: string
  email: string
  phone: string
  subject: string
  hourlyRate: number
  notes?: string
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const refresh = async () => {
    try {
      setLoading(true)
      const allStudents = await getStudents()
      setStudents(allStudents)
    } catch (error) {
      console.error("Error loading students:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar alunos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const createStudent = async (data: Omit<Student, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newStudent = await createStudentDb(data)
      refresh()
      return newStudent
    } catch (error) {
      console.error("Error creating student:", error)
      throw error
    }
  }

  const updateStudent = async (id: string, data: Partial<Student>) => {
    try {
      const updatedStudent = await updateStudentDb(id, data)
      refresh()
      return updatedStudent
    } catch (error) {
      console.error("Error updating student:", error)
      throw error
    }
  }

  const deleteStudent = async (id: string) => {
    try {
      await deleteStudentDb(id)
      refresh()
    } catch (error) {
      console.error("Error deleting student:", error)
      throw error
    }
  }

  const getStudentById = useCallback((id: string): Student | undefined => {
    return students.find(student => student.id === id)
  }, [students])

  const searchStudents = useCallback((query: string): Student[] => {
    const lowercaseQuery = query.toLowerCase()
    return students.filter(student =>
      student.name.toLowerCase().includes(lowercaseQuery) ||
      student.email.toLowerCase().includes(lowercaseQuery) ||
      (student.subject?.toLowerCase().includes(lowercaseQuery) ?? false)
    )
  }, [students])

  return {
    students,
    loading,
    error,
    createStudent,
    updateStudent,
    deleteStudent,
    getStudentById,
    searchStudents,
    refresh
  }
}
