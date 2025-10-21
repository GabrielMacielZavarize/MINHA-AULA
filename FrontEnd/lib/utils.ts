import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in Brazilian format
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

// Parse currency input (removes formatting and returns number)
export function parseCurrencyInput(value: string): number {
  const cleanValue = value.replace(/[^\d,]/g, "").replace(",", ".")
  return Number.parseFloat(cleanValue) || 0
}

// Format currency input as user types
export function formatCurrencyInput(value: string): string {
  // Remove tudo exceto números
  const numericValue = value.replace(/\D/g, "")
  if (!numericValue) return ""

  // Converte para número e divide por 100 para ter os centavos
  const number = Number.parseInt(numericValue) / 100

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number)
}

// Format phone number in Brazilian format
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")

  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  }

  return phone
}

// Format phone input as user types
export function formatPhoneInput(value: string): string {
  const cleaned = value.replace(/\D/g, "")

  if (cleaned.length === 0) return ""
  if (cleaned.length <= 2) return `(${cleaned}`
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  if (cleaned.length <= 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }

  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
}
