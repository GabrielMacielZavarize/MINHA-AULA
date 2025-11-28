"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Search,
  BookOpen,
  Clock,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      fetchData() // Refresh list
      setActiveTab("schedule") // Switch to schedule tab
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Painel do Aluno
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Bem-vindo, {profile.name}!</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="marketplace">Encontrar Aulas</TabsTrigger>
            <TabsTrigger value="schedule">Minhas Aulas</TabsTrigger>
          </TabsList>

          <TabsContent value="marketplace" className="space-y-8">
            <Card className="bg-gradient-to-br from-blue-50/50 to-slate-50/50 dark:from-blue-900/40 dark:via-slate-900/40 dark:to-slate-900/40 border-border dark:border-blue-500/20 backdrop-blur-xl shadow-lg dark:shadow-blue-900/10">
              <CardHeader>
                <CardTitle className="text-2xl text-foreground dark:text-white">Encontrar Aulas</CardTitle>
                <CardDescription className="text-muted-foreground dark:text-slate-400">Busque por matéria ou professor para começar a aprender</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative group">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
                  <Input 
                    placeholder="Ex: Matemática, Inglês, Professor João..." 
                    className="pl-12 h-12 bg-black/40 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-blue-500/50 focus-visible:border-blue-500/50 rounded-xl transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClasses.length === 0 ? (
                <div className="col-span-full text-center py-16 text-slate-500">
                  {loading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                      <p>Carregando aulas...</p>
                    </div>
                  ) : (
                    <>
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Nenhuma aula encontrada com esses termos.</p>
                    </>
                  )}
                </div>
              ) : (
                filteredClasses.map((c) => (
                  <Card key={c.id} className="group bg-slate-900/40 backdrop-blur-xl border-white/5 hover:border-blue-500/30 hover:bg-slate-900/60 transition-all duration-300 shadow-lg shadow-black/20">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors">{c.subject}</CardTitle>
                          <CardDescription className="text-slate-400 mt-1">Prof. {c.teacherName}</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-3 py-1 text-sm font-bold whitespace-nowrap">
                          {formatCurrency(c.value)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-500/70" />
                          {format(parseISO(c.date), "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500/70" />
                          {c.time} • {c.duration} min
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all" 
                        onClick={() => handleBookClass(c.id)}
                      >
                        Agendar Aula
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule">
            <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 shadow-lg shadow-black/20">
              <CardHeader>
                <CardTitle className="text-xl text-slate-200">Minhas Aulas Agendadas</CardTitle>
              </CardHeader>
              <CardContent>
                {myClasses.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    Você ainda não tem aulas agendadas.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myClasses.map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-4 border border-white/5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
                            <BookOpen className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-200 text-lg">{c.subject}</h3>
                            <p className="text-sm text-slate-400">Prof. {c.teacherName}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              {format(parseISO(c.date), "dd/MM/yyyy", { locale: ptBR })} às {c.time}
                            </div>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-0 px-3 py-1">
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
    <Suspense fallback={<div className="space-y-8"><p>Carregando...</p></div>}>
      <StudentDashboardContent profile={profile} />
    </Suspense>
  )
}
