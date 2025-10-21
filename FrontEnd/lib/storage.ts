"use client"

// Types
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

export interface ClassTag {
  id: string
  name: string
  color: string
}

export interface Class {
  id: string
  studentId: string
  studentName: string
  subject: string
  date: string
  time: string
  duration: number
  value: number
  status: "scheduled" | "completed" | "cancelled" | "pending"
  notes?: string
  tags?: ClassTag[]
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  studentId: string
  studentName: string
  classId?: string
  subject: string
  date: string
  amount: number
  status: "paid" | "pending"
  notes?: string
  createdAt: string
  updatedAt: string
}

// Storage keys - now include user ID
function getStorageKey(baseKey: string, userId: string): string {
  return `${baseKey}-${userId}`
}

const BASE_STUDENTS_KEY = "minha-aula-students"
const BASE_CLASSES_KEY = "minha-aula-classes"
const BASE_PAYMENTS_KEY = "minha-aula-payments"
const BASE_TAGS_KEY = "minha-aula-tags"

// Get current user ID
function getCurrentUserId(): string {
  try {
    if (typeof window === "undefined") return "default"
    const currentUser = localStorage.getItem("minha-aula-current-user")
    if (currentUser) {
      const user = JSON.parse(currentUser)
      return user.email // Use email as unique identifier
    }
    return "default"
  } catch (error) {
    console.error("Error getting current user ID:", error)
    return "default"
  }
}

// Utility functions
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

function getFromStorage<T>(baseKey: string): T[] {
  try {
    if (typeof window === "undefined") return []
    const userId = getCurrentUserId()
    const key = getStorageKey(baseKey, userId)
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error reading from storage (${baseKey}):`, error)
    return []
  }
}

function saveToStorage<T>(baseKey: string, data: T[]): void {
  try {
    if (typeof window === "undefined") return
    const userId = getCurrentUserId()
    const key = getStorageKey(baseKey, userId)
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to storage (${baseKey}):`, error)
  }
}

// Initialize storage for current user
export function initializeStorage(): void {
  try {
    if (typeof window === "undefined") return

    const userId = getCurrentUserId()
    const studentsKey = getStorageKey(BASE_STUDENTS_KEY, userId)
    const classesKey = getStorageKey(BASE_CLASSES_KEY, userId)
    const paymentsKey = getStorageKey(BASE_PAYMENTS_KEY, userId)
    const tagsKey = getStorageKey(BASE_TAGS_KEY, userId)

    if (!localStorage.getItem(studentsKey)) {
      saveToStorage(BASE_STUDENTS_KEY, [])
    }
    if (!localStorage.getItem(classesKey)) {
      saveToStorage(BASE_CLASSES_KEY, [])
    }
    if (!localStorage.getItem(paymentsKey)) {
      saveToStorage(BASE_PAYMENTS_KEY, [])
    }
    if (!localStorage.getItem(tagsKey)) {
      // Initialize with default tags
      const defaultTags: ClassTag[] = [
        { id: "1", name: "Importante", color: "#ef4444" },
        { id: "2", name: "Revisão", color: "#3b82f6" },
        { id: "3", name: "Prova", color: "#f59e0b" },
        { id: "4", name: "Reposição", color: "#10b981" },
        { id: "5", name: "Primeira Aula", color: "#8b5cf6" },
      ]
      saveToStorage(BASE_TAGS_KEY, defaultTags)
    }
  } catch (error) {
    console.error("Error initializing storage:", error)
  }
}

// Tag operations
export function getAllTags(): ClassTag[] {
  return getFromStorage<ClassTag>(BASE_TAGS_KEY)
}

export function createTag(data: Omit<ClassTag, "id">): ClassTag {
  const tags = getAllTags()
  const newTag: ClassTag = {
    ...data,
    id: generateId(),
  }

  tags.push(newTag)
  saveToStorage(BASE_TAGS_KEY, tags)
  return newTag
}

export function updateTag(id: string, data: Partial<ClassTag>): ClassTag {
  const tags = getAllTags()
  const index = tags.findIndex((t) => t.id === id)

  if (index === -1) {
    throw new Error("Tag not found")
  }

  const updatedTag = {
    ...tags[index],
    ...data,
  }

  tags[index] = updatedTag
  saveToStorage(BASE_TAGS_KEY, tags)
  return updatedTag
}

export function deleteTag(id: string): void {
  const tags = getAllTags()
  const filteredTags = tags.filter((t) => t.id !== id)
  saveToStorage(BASE_TAGS_KEY, filteredTags)

  // Remove tag from all classes
  const classes = getAllClasses()
  const updatedClasses = classes.map((c) => ({
    ...c,
    tags: c.tags?.filter((t) => t.id !== id) || [],
  }))
  saveToStorage(BASE_CLASSES_KEY, updatedClasses)
}

// Student operations
export function getAllStudents(): Student[] {
  return getFromStorage<Student>(BASE_STUDENTS_KEY)
}

export function createStudent(data: Omit<Student, "id" | "createdAt" | "updatedAt">): Student {
  const students = getAllStudents()
  const newStudent: Student = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  students.push(newStudent)
  saveToStorage(BASE_STUDENTS_KEY, students)
  return newStudent
}

export function updateStudent(id: string, data: Partial<Student>): Student {
  const students = getAllStudents()
  const index = students.findIndex((s) => s.id === id)

  if (index === -1) {
    throw new Error("Student not found")
  }

  const updatedStudent = {
    ...students[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  students[index] = updatedStudent
  saveToStorage(BASE_STUDENTS_KEY, students)
  return updatedStudent
}

export function deleteStudent(id: string): void {
  const students = getAllStudents()
  const filteredStudents = students.filter((s) => s.id !== id)
  saveToStorage(BASE_STUDENTS_KEY, filteredStudents)

  // Also delete related classes and payments
  const classes = getAllClasses()
  const filteredClasses = classes.filter((c) => c.studentId !== id)
  saveToStorage(BASE_CLASSES_KEY, filteredClasses)

  const payments = getAllPayments()
  const filteredPayments = payments.filter((p) => p.studentId !== id)
  saveToStorage(BASE_PAYMENTS_KEY, filteredPayments)
}

// Class operations
export function getAllClasses(): Class[] {
  return getFromStorage<Class>(BASE_CLASSES_KEY)
}

export function createClass(data: Omit<Class, "id" | "createdAt" | "updatedAt">): Class {
  const classes = getAllClasses()
  const newClass: Class = {
    ...data,
    id: generateId(),
    status: data.status || "scheduled",
    tags: data.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  classes.push(newClass)
  saveToStorage(BASE_CLASSES_KEY, classes)

  // Create payment if class is completed
  if (newClass.status === "completed") {
    createPayment({
      studentId: newClass.studentId,
      studentName: newClass.studentName,
      classId: newClass.id,
      subject: newClass.subject,
      date: newClass.date,
      amount: newClass.value,
      status: "pending",
    })
  }

  return newClass
}

export function updateClass(id: string, data: Partial<Class>): Class {
  const classes = getAllClasses()
  const index = classes.findIndex((c) => c.id === id)

  if (index === -1) {
    throw new Error("Class not found")
  }

  const updatedClass = {
    ...classes[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  classes[index] = updatedClass
  saveToStorage(BASE_CLASSES_KEY, classes)

  // Create payment if status changed to completed
  if (data.status === "completed" && classes[index].status !== "completed") {
    createPayment({
      studentId: updatedClass.studentId,
      studentName: updatedClass.studentName,
      classId: updatedClass.id,
      subject: updatedClass.subject,
      date: updatedClass.date,
      amount: updatedClass.value,
      status: "pending",
    })
  }

  return updatedClass
}

export function deleteClass(id: string): void {
  const classes = getAllClasses()
  const filteredClasses = classes.filter((c) => c.id !== id)
  saveToStorage(BASE_CLASSES_KEY, filteredClasses)

  // Also delete related payments
  const payments = getAllPayments()
  const filteredPayments = payments.filter((p) => p.classId !== id)
  saveToStorage(BASE_PAYMENTS_KEY, filteredPayments)
}

export function getClassesByStudent(studentId: string): Class[] {
  return getAllClasses().filter((c) => c.studentId === studentId)
}

// Payment operations
export function getAllPayments(): Payment[] {
  return getFromStorage<Payment>(BASE_PAYMENTS_KEY)
}

export function createPayment(data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Payment {
  const payments = getAllPayments()
  const newPayment: Payment = {
    ...data,
    id: generateId(),
    status: data.status || "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  payments.push(newPayment)
  saveToStorage(BASE_PAYMENTS_KEY, payments)
  return newPayment
}

export function updatePayment(id: string, data: Partial<Payment>): Payment {
  const payments = getAllPayments()
  const index = payments.findIndex((p) => p.id === id)

  if (index === -1) {
    throw new Error("Payment not found")
  }

  const updatedPayment = {
    ...payments[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }

  payments[index] = updatedPayment
  saveToStorage(BASE_PAYMENTS_KEY, payments)
  return updatedPayment
}

export function deletePayment(id: string): void {
  const payments = getAllPayments()
  const filteredPayments = payments.filter((p) => p.id !== id)
  saveToStorage(BASE_PAYMENTS_KEY, filteredPayments)
}

export function markPaymentAsPaid(id: string): boolean {
  const payments = getAllPayments()
  const index = payments.findIndex((p) => p.id === id)

  if (index === -1) {
    return false
  }

  payments[index] = {
    ...payments[index],
    status: "paid",
    updatedAt: new Date().toISOString(),
  }

  saveToStorage(BASE_PAYMENTS_KEY, payments)
  return true
}

export function getPaymentsByStudent(studentId: string): Payment[] {
  return getAllPayments().filter((p) => p.studentId === studentId)
}

export function clearAllData(): void {
  if (typeof window === "undefined") return
  const userId = getCurrentUserId()
  const studentsKey = getStorageKey(BASE_STUDENTS_KEY, userId)
  const classesKey = getStorageKey(BASE_CLASSES_KEY, userId)
  const paymentsKey = getStorageKey(BASE_PAYMENTS_KEY, userId)
  const tagsKey = getStorageKey(BASE_TAGS_KEY, userId)

  localStorage.removeItem(studentsKey)
  localStorage.removeItem(classesKey)
  localStorage.removeItem(paymentsKey)
  localStorage.removeItem(tagsKey)
  initializeStorage()
}

export function exportData() {
  const data = {
    students: getAllStudents(),
    classes: getAllClasses(),
    payments: getAllPayments(),
    tags: getAllTags(),
    exportDate: new Date().toISOString(),
    userId: getCurrentUserId(),
  }
  return JSON.stringify(data, null, 2)
}

export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData)

    if (data.students) saveToStorage(BASE_STUDENTS_KEY, data.students)
    if (data.classes) saveToStorage(BASE_CLASSES_KEY, data.classes)
    if (data.payments) saveToStorage(BASE_PAYMENTS_KEY, data.payments)
    if (data.tags) saveToStorage(BASE_TAGS_KEY, data.tags)

    return true
  } catch (error) {
    console.error("Error importing data:", error)
    return false
  }
}
