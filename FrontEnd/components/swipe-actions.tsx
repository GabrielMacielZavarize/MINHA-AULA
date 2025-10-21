"use client"

import { useState, useRef, useEffect } from "react"
import { Phone, Mail, Edit, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SwipeActionsProps {
  children: React.ReactNode
  onCall?: () => void
  onEmail?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export function SwipeActions({ 
  children, 
  onCall, 
  onEmail, 
  onEdit, 
  onDelete,
  className 
}: SwipeActionsProps) {
  const [swipeOffset, setSwipeOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const actions = [
    { icon: Phone, onClick: onCall, color: "bg-blue-500", label: "Ligar" },
    { icon: Mail, onClick: onEmail, color: "bg-green-500", label: "E-mail" },
    { icon: Edit, onClick: onEdit, color: "bg-orange-500", label: "Editar" },
    { icon: Trash2, onClick: onDelete, color: "bg-red-500", label: "Excluir" },
  ].filter(action => action.onClick)

  const maxSwipe = actions.length * 80

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    
    currentX.current = e.touches[0].clientX
    const diff = startX.current - currentX.current
    
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, maxSwipe))
    } else {
      setSwipeOffset(Math.max(diff, -20))
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    
    if (swipeOffset > 40) {
      setSwipeOffset(Math.min(swipeOffset, maxSwipe))
    } else {
      setSwipeOffset(0)
    }
  }

  const handleActionClick = (action: () => void) => {
    action()
    setSwipeOffset(0)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSwipeOffset(0)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div 
      ref={containerRef}
      className={cn("relative overflow-hidden", className)}
    >
      {/* Action Buttons */}
      <div 
        className="absolute right-0 top-0 h-full flex items-center"
        style={{ transform: `translateX(${Math.max(0, maxSwipe - swipeOffset)}px)` }}
      >
        {actions.map((action, index) => (
          <Button
            key={index}
            size="icon"
            className={cn("h-full w-20 rounded-none", action.color)}
            onClick={() => handleActionClick(action.onClick!)}
          >
            <action.icon className="h-5 w-5" />
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div
        className="relative z-10 bg-background transition-transform duration-200"
        style={{ 
          transform: `translateX(-${Math.max(0, swipeOffset)}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
