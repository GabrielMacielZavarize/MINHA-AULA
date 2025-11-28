"use client"

import { useState, useEffect } from "react"
import {
  getClasses,
  createClass as createClassDb,
  updateClass as updateClassDb,
  deleteClass as deleteClassDb,
  type Class,
  type ClassTag,
} from "@/lib/supabase-db"

export type { Class, ClassTag }

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      setLoading(true)
      const allClasses = await getClasses()
      setClasses(allClasses)
    } catch (error) {
      console.error("Error loading classes:", error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const createClass = async (data: Omit<Class, "id" | "createdAt" | "updatedAt" | "teacherId" | "status">) => {
    try {
      const newClass = await createClassDb(data)
      refresh()
      return newClass
    } catch (error) {
      console.error("Error creating class:", error)
      throw error
    }
  }

  const updateClass = async (id: string, data: Partial<Class>) => {
    try {
      const updatedClass = await updateClassDb(id, data)
      refresh()
      return updatedClass
    } catch (error) {
      console.error("Error updating class:", error)
      throw error
    }
  }

  const deleteClass = async (id: string) => {
    try {
      await deleteClassDb(id)
      refresh()
    } catch (error) {
      console.error("Error deleting class:", error)
      throw error
    }
  }

  const getStudentClasses = (studentId: string) => {
    return classes.filter(c => c.studentId === studentId)
  }

  return {
    classes,
    loading,
    refresh,
    createClass,
    updateClass,
    deleteClass,
    getStudentClasses,
  }
}
