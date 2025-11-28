"use client"

import { useState, useEffect } from "react"
import {
  getPayments,
  createPayment as createPaymentDb,
  updatePayment as updatePaymentDb,
  deletePayment as deletePaymentDb,
  type Payment,
} from "@/lib/supabase-db"

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      setLoading(true)
      const allPayments = await getPayments()
      setPayments(allPayments)
    } catch (error) {
      console.error("Error loading payments:", error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const createPayment = async (data: Omit<Payment, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newPayment = await createPaymentDb(data)
      refresh()
      return newPayment
    } catch (error) {
      console.error("Error creating payment:", error)
      throw error
    }
  }

  const updatePayment = async (id: string, data: Partial<Payment>) => {
    try {
      const updatedPayment = await updatePaymentDb(id, data)
      refresh()
      return updatedPayment
    } catch (error) {
      console.error("Error updating payment:", error)
      throw error
    }
  }

  const deletePayment = async (id: string) => {
    try {
      await deletePaymentDb(id)
      refresh()
    } catch (error) {
      console.error("Error deleting payment:", error)
      throw error
    }
  }

  const markAsPaid = async (id: string) => {
    try {
      const updatedPayment = await updatePaymentDb(id, { status: "paid" })
      refresh()
      return true
    } catch (error) {
      console.error("Error marking payment as paid:", error)
      throw error
    }
  }

  const getStudentPayments = (studentId: string) => {
    return payments.filter(p => p.studentId === studentId)
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
