"use client"

import { useState, useEffect } from "react"
import {
  getAllPayments,
  createPayment as createPaymentStorage,
  updatePayment as updatePaymentStorage,
  deletePayment as deletePaymentStorage,
  markPaymentAsPaid,
  getPaymentsByStudent,
  initializeStorage,
  type Payment,
} from "@/lib/storage"

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    try {
      const allPayments = getAllPayments()
      setPayments(allPayments)
    } catch (error) {
      console.error("Error loading payments:", error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeStorage()
    refresh()
  }, [])

  const createPayment = (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newPayment = createPaymentStorage(data)
      refresh()
      return newPayment
    } catch (error) {
      console.error("Error creating payment:", error)
      throw error
    }
  }

  const updatePayment = async (id: string, data: Partial<Payment>) => {
    try {
      const updatedPayment = updatePaymentStorage(id, data)
      refresh()
      return updatedPayment
    } catch (error) {
      console.error("Error updating payment:", error)
      throw error
    }
  }

  const deletePayment = async (id: string) => {
    try {
      deletePaymentStorage(id)
      refresh()
    } catch (error) {
      console.error("Error deleting payment:", error)
      throw error
    }
  }

  const markAsPaid = async (id: string) => {
    try {
      const success = markPaymentAsPaid(id)
      if (success) {
        refresh()
      }
      return success
    } catch (error) {
      console.error("Error marking payment as paid:", error)
      throw error
    }
  }

  const getStudentPayments = (studentId: string) => {
    return getPaymentsByStudent(studentId)
  }

  return {
    payments,
    loading,
    refresh,
    createPayment,
    updatePayment,
    deletePayment,
    markAsPaid,
    getStudentPayments,
  }
}
