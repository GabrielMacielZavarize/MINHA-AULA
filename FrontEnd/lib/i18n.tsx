"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useMemo } from "react"

type Language = "pt" | "en"

interface Translations {
  [key: string]: {
    pt: string
    en: string
  }
}

const translations: Translations = {
  dashboard: { pt: "Dashboard", en: "Dashboard" },
  calendar: { pt: "Agenda", en: "Calendar" },
  students: { pt: "Alunos", en: "Students" },
  financial: { pt: "Financeiro", en: "Financial" },
  settings: { pt: "Configurações", en: "Settings" },
  monthlyEarnings: { pt: "Ganhos do Mês", en: "Monthly Earnings" },
  completedClasses: { pt: "Aulas Concluídas", en: "Completed Classes" },
  pendingPayments: { pt: "Pagamentos Pendentes", en: "Pending Payments" },
  totalStudents: { pt: "Total de Alunos", en: "Total Students" },
  todayClasses: { pt: "Aulas de Hoje", en: "Today's Classes" },
  newClass: { pt: "Nova Aula", en: "New Class" },
  newStudent: { pt: "Novo Aluno", en: "New Student" },
  addStudent: { pt: "Adicionar Aluno", en: "Add Student" },
  editStudent: { pt: "Editar Aluno", en: "Edit Student" },
  searchStudents: { pt: "Buscar alunos...", en: "Search students..." },
  noStudentsYet: { pt: "Sem alunos ainda", en: "No students yet" },
  noStudentsFound: { pt: "Nenhum aluno encontrado", en: "No students found" },
  addFirstStudent: { pt: "Adicione seu primeiro aluno para começar", en: "Add your first student to get started" },
  tryDifferentSearch: { pt: "Tente uma busca diferente", en: "Try a different search" },
  studentName: { pt: "Nome Completo", en: "Full Name" },
  email: { pt: "E-mail", en: "Email" },
  phone: { pt: "Telefone", en: "Phone" },
  subject: { pt: "Matéria Principal", en: "Main Subject" },
  hourlyRate: { pt: "Valor por Hora (R$)", en: "Hourly Rate (R$)" },
  notes: { pt: "Observações", en: "Notes" },
  classes: { pt: "Aulas", en: "Classes" },
  earned: { pt: "Ganho", en: "Earned" },
  scheduleClass: { pt: "Agendar Nova Aula", en: "Schedule New Class" },
  student: { pt: "Aluno", en: "Student" },
  date: { pt: "Data", en: "Date" },
  time: { pt: "Horário", en: "Time" },
  duration: { pt: "Duração (minutos)", en: "Duration (minutes)" },
  value: { pt: "Valor (R$)", en: "Value (R$)" },
  confirmed: { pt: "Confirmada", en: "Confirmed" },
  pending: { pt: "Pendente", en: "Pending" },
  completed: { pt: "Concluída", en: "Completed" },
  cancelled: { pt: "Cancelada", en: "Cancelled" },
  scheduled: { pt: "Agendada", en: "Scheduled" },
  totalEarnings: { pt: "Ganhos Totais", en: "Total Earnings" },
  receivedAmount: { pt: "Valores Recebidos", en: "Received Amount" },
  pendingAmount: { pt: "Valores Pendentes", en: "Pending Amount" },
  totalClasses: { pt: "Total de Aulas", en: "Total Classes" },
  averagePerClass: { pt: "Média por Aula", en: "Average per Class" },
  paymentHistory: { pt: "Histórico de Pagamentos", en: "Payment History" },
  markAsPaid: { pt: "Marcar como Pago", en: "Mark as Paid" },
  profile: { pt: "Perfil", en: "Profile" },
  notifications: { pt: "Notificações", en: "Notifications" },
  preferences: { pt: "Preferências", en: "Preferences" },
  personalInfo: { pt: "Informações Pessoais", en: "Personal Information" },
  darkMode: { pt: "Modo Escuro", en: "Dark Mode" },
  language: { pt: "Idioma", en: "Language" },
  portuguese: { pt: "Português (Brasil)", en: "Portuguese (Brazil)" },
  english: { pt: "Inglês (EUA)", en: "English (US)" },
  save: { pt: "Salvar", en: "Save" },
  cancel: { pt: "Cancelar", en: "Cancel" },
  delete: { pt: "Excluir", en: "Delete" },
  edit: { pt: "Editar", en: "Edit" },
  create: { pt: "Criar", en: "Create" },
  update: { pt: "Atualizar", en: "Update" },
  confirmDeletion: { pt: "Confirmar Exclusão", en: "Confirm Deletion" },
  deleteStudentWarning: {
    pt: "Tem certeza que deseja excluir o aluno?",
    en: "Are you sure you want to delete this student?",
  },
  deleteStudentConsequence: {
    pt: "Todas as aulas e pagamentos relacionados também serão excluídos.",
    en: "All related classes and payments will also be deleted.",
  },
  deletedSuccessfully: { pt: "excluído com sucesso", en: "deleted successfully" },
  failedToDeleteStudent: { pt: "Falha ao excluir aluno", en: "Failed to delete student" },
  success: { pt: "Sucesso!", en: "Success!" },
  error: { pt: "Erro", en: "Error" },
  loading: { pt: "Carregando...", en: "Loading..." },
}

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: React.ReactNode
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("minha-aula-language")
        return (saved as Language) || "pt"
      } catch {
        return "pt"
      }
    }
    return "pt"
  })

  const t = useCallback(
    (key: string): string => {
      return translations[key]?.[language] || key
    },
    [language],
  )

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang)
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("minha-aula-language", lang)
      } catch {
        // Ignore localStorage errors
      }
    }
  }, [])

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage: handleSetLanguage,
      t,
    }),
    [language, handleSetLanguage, t],
  )

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
