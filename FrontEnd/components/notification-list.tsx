"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getNotifications, markNotificationAsRead, respondToReschedule, Notification } from "@/lib/supabase-db"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for notifications every minute
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    } catch (error) {
      console.error("Error marking as read:", error)
    }
  }

  const handleResponse = async (notification: Notification, status: 'accepted' | 'rejected') => {
    if (!notification.metadata?.requestId) return

    setProcessing(notification.id)
    try {
      await respondToReschedule(notification.metadata.requestId, status)
      await handleRead(notification.id)
      
      toast({
        title: status === 'accepted' ? "Aula remarcada!" : "Solicitação recusada",
        description: status === 'accepted' ? "O horário da aula foi atualizado." : "O professor será notificado.",
      })
      
      fetchNotifications()
    } catch (error) {
      console.error("Error responding:", error)
      toast({
        title: "Erro",
        description: "Não foi possível processar a resposta.",
        variant: "destructive",
      })
    } finally {
      setProcessing(null)
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white rounded-full text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border">
          <h4 className="font-semibold leading-none">Notificações</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div key={notification.id} className={`p-4 ${notification.read ? 'opacity-60' : 'bg-secondary/20'}`}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-[10px] text-muted-foreground pt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    {!notification.read && notification.type !== 'reschedule' && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => handleRead(notification.id)}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {notification.type === 'reschedule' && !notification.read && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        className="w-full h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleResponse(notification, 'accepted')}
                        disabled={!!processing}
                      >
                        {processing === notification.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aceitar"}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full h-8 text-xs"
                        onClick={() => handleResponse(notification, 'rejected')}
                        disabled={!!processing}
                      >
                        Recusar
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
