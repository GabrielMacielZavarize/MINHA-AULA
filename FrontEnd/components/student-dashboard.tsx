"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Search,
  BookOpen,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { EmptyState } from "@/components/empty-state"
import { formatCurrency } from "@/lib/utils"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Profile, getOpenClasses, bookClass, getStudentClasses, Class } from "@/lib/supabase-db"
import { useToast } from "@/hooks/use-toast"

interface StudentDashboardProps {
  profile: Profile
}

function StudentDashboardContent({ profile }: StudentDashboardProps) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [openClasses, setOpenClasses] = useState<Class[]>([])
  const [myClasses, setMyClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'marketplace')

  const fetchData = async () => {
    try {
      setLoading(true)
      const [open, my] = await Promise.all([
        getOpenClasses(),
        getStudentClasses(profile.id)
      ])
      setOpenClasses(open)
      setMyClasses(my)
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) setActiveTab(tab)
  }, [searchParams])

  const handleBookClass = async (classId: string) => {
    try {
      await bookClass(classId)
      toast({
        title: "Aula agendada!",
        description: "Você agendou a aula com sucesso.",
      })
      fetchData()
      setActiveTab("schedule")
    } catch (error) {
      console.error("Error booking class:", error)
      toast({
        title: "Erro",
        description: "Não foi possível agendar a aula.",
        variant: "destructive",
      })
    }
  }

  const filteredClasses = openClasses.filter(c =>
    c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <PageHeader title="Painel do Aluno" description={`Bem-vindo, ${profile.name}`} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="marketplace">Encontrar Aulas</TabsTrigger>
          <TabsTrigger value="schedule">Minhas Aulas</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por matéria ou professor..."
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />)}
            </div>
          ) : filteredClasses.length === 0 ? (
            <EmptyState
              icon={Search}
              message={searchTerm ? "Nenhuma aula encontrada com esses termos." : "Nenhuma aula disponível no momento."}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredClasses.map((c) => (
                <Card key={c.id} className="border-border flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold text-foreground truncate">
                          {c.subject}
                        </CardTitle>
                        <CardDescription className="text-sm mt-0.5">
                          Prof. {c.teacherName}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-sm font-semibold shrink-0">
                        {formatCurrency(c.value)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-between gap-4">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        {format(parseISO(c.date), "dd 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {c.time} · {c.duration} min
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => handleBookClass(c.id)}
                    >
                      Agendar Aula
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Minhas Aulas Agendadas</CardTitle>
            </CardHeader>
            <CardContent>
              {myClasses.length === 0 ? (
                <EmptyState icon={BookOpen} message="Você ainda não tem aulas agendadas." />
              ) : (
                <div className="space-y-3">
                  {myClasses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-foreground">{c.subject}</p>
                          <p className="text-xs text-muted-foreground">Prof. {c.teacherName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(c.date), "dd/MM/yyyy", { locale: ptBR })} às {c.time}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-200 shrink-0">
                        Confirmada
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function StudentDashboard({ profile }: StudentDashboardProps) {
  return (
    <Suspense fallback={
      <div className="space-y-8">
        <div className="space-y-1">
          <div className="h-7 w-44 bg-muted animate-pulse rounded-md" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="h-10 w-60 bg-muted animate-pulse rounded-md" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    }>
      <StudentDashboardContent profile={profile} />
    </Suspense>
  )
}
