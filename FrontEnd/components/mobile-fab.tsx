"use client"

import { useState } from "react"
import { Plus, Calendar, Users, DollarSign, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MobileFABProps {
  onNewClass: () => void
  onNewStudent: () => void
  onQuickPayment: () => void
}

export function MobileFAB({ onNewClass, onNewStudent, onQuickPayment }: MobileFABProps) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    {
      icon: Calendar,
      label: "Nova Aula",
      onClick: () => {
        onNewClass()
        setIsOpen(false)
      },
      className: "bg-blue-500 hover:bg-blue-600"
    },
    {
      icon: Users,
      label: "Novo Aluno",
      onClick: () => {
        onNewStudent()
        setIsOpen(false)
      },
      className: "bg-green-500 hover:bg-green-600"
    },
    {
      icon: DollarSign,
      label: "Pagamento",
      onClick: () => {
        onQuickPayment()
        setIsOpen(false)
      },
      className: "bg-purple-500 hover:bg-purple-600"
    }
  ]

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      {/* Action Buttons */}
      <div className={cn(
        "flex flex-col gap-3 mb-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="bg-black/80 text-white px-3 py-1 rounded-full text-sm whitespace-nowrap">
              {action.label}
            </div>
            <Button
              size="icon"
              className={cn("h-12 w-12 rounded-full shadow-lg", action.className)}
              onClick={action.onClick}
            >
              <action.icon className="h-5 w-5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB Button */}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
