"use client"

import { useState, useEffect } from "react"
import {
  getAllClasses,
  createClass as createClassStorage,
  updateClass as updateClassStorage,
  deleteClass as deleteClassStorage,
  getClassesByStudent,
  initializeStorage,
  type Class,
  type ClassTag,
} from "@/lib/storage"

export type { Class, ClassTag }

export function useClasses() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    try {
      const allClasses = getAllClasses()
      setClasses(allClasses)
    } catch (error) {
      console.error("Error loading classes:", error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeStorage()
    refresh()
  }, [])

  const createClass = (data: Omit<Class, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newClass = createClassStorage(data)
      refresh()
      return newClass
    } catch (error) {
      console.error("Error creating class:", error)
      throw error
    }
  }

  const updateClass = async (id: string, data: Partial<Class>) => {
    try {
      const updatedClass = updateClassStorage(id, data)
      refresh()
      return updatedClass
    } catch (error) {
      console.error("Error updating class:", error)
      throw error
    }
  }

  const deleteClass = async (id: string) => {
    try {
      deleteClassStorage(id)
      refresh()
    } catch (error) {
      console.error("Error deleting class:", error)
      throw error
    }
  }

  const getStudentClasses = (studentId: string) => {
    return getClassesByStudent(studentId)
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
