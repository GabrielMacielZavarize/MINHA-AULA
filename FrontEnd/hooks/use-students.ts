"use client"

import { useState, useEffect, useCallback } from 'react'
import { 
  getAllStudents, 
  createStudent as createStudentStorage, 
  updateStudent as updateStudentStorage, 
  deleteStudent as deleteStudentStorage 
} from '@/lib/storage'

export interface Student {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  hourlyRate: number
  notes?: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface CreateStudentData {
  name: string
  email: string
  phone: string
  subject: string
  hourlyRate: number
  notes?: string
  avatar?: string
}

export function useStudents() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStudents = useCallback(() => {
    try {
      setLoading(true)
      setError(null)
      const allStudents = getAllStudents()
      setStudents(allStudents)
    } catch (err) {
      console.error('Error loading students:', err)
      setError('Erro ao carregar alunos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const createStudent = useCallback((data: CreateStudentData): Student => {
    try {
      const newStudent = createStudentStorage(data)
      loadStudents() // Reload to get fresh data
      return newStudent
    } catch (err) {
      console.error('Error creating student:', err)
      throw new Error('Erro ao criar aluno')
    }
  }, [loadStudents])

  const updateStudent = useCallback((id: string, data: Partial<Student>): Student => {
    try {
      const updatedStudent = updateStudentStorage(id, data)
      loadStudents() // Reload to get fresh data
      return updatedStudent
    } catch (err) {
      console.error('Error updating student:', err)
      throw new Error('Erro ao atualizar aluno')
    }
  }, [loadStudents])

  const deleteStudent = useCallback((id: string): void => {
    try {
      deleteStudentStorage(id)
      loadStudents() // Reload to get fresh data
    } catch (err) {
      console.error('Error deleting student:', err)
      throw new Error('Erro ao excluir aluno')
    }
  }, [loadStudents])

  const getStudentById = useCallback((id: string): Student | undefined => {
    return students.find(student => student.id === id)
  }, [students])

  const searchStudents = useCallback((query: string): Student[] => {
    const lowercaseQuery = query.toLowerCase()
    return students.filter(student =>
      student.name.toLowerCase().includes(lowercaseQuery) ||
      student.email.toLowerCase().includes(lowercaseQuery) ||
      student.subject.toLowerCase().includes(lowercaseQuery)
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
    refresh: loadStudents
  }
}
