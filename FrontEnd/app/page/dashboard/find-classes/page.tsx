"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, Clock, DollarSign, User, BookOpen, Mail, MessageCircle } from "lucide-react"
import { getOpenClasses, bookClass, searchTeachers, type Class, type Profile } from "@/lib/supabase-db"
import { toast } from "@/hooks/use-toast"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import { formatCurrency } from "@/lib/utils"

export default function FindClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [teachers, setTeachers] = useState<Profile[]>([])
  const [subjectFilter, setSubjectFilter] = useState("")
  const [teacherFilter, setTeacherFilter] = useState("")
  const [bookingId, setBookingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const searchTerm = subjectFilter || teacherFilter || ""
      const [openClasses, teacherProfiles] = await Promise.all([
        getOpenClasses({
          subject: searchTerm || undefined,
          teacherName: searchTerm || undefined
        }),
        searchTeachers({
          subject: searchTerm || undefined,
          name: searchTerm || undefined
        })
      ])
      setClasses(openClasses)
      setTeachers(teacherProfiles)
    } catch (error) {
      console.error("Error fetching classes:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aulas.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh when classes are updated
  useEffect(() => {
    const handleUpdate = () => {
      fetchData()
    }
    window.addEventListener("classUpdated", handleUpdate)
    return () => window.removeEventListener("classUpdated", handleUpdate)
  }, [])

  // Auto-search when filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData()
    }, 400)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectFilter, teacherFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  const handleBookClass = async (classId: string) => {
    setBookingId(classId)
    try {
      await bookClass(classId)
      toast({
        title: "Sucesso",
        description: "Aula agendada com sucesso!",
      })
      // Refresh list
      fetchData()
    } catch (error) {
      console.error("Error booking class:", error)
      toast({
        title: "Erro",
        description: "Erro ao agendar aula.",
        variant: "destructive"
      })
    } finally {
      setBookingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Encontrar Aulas</h1>
        <p className="text-muted-foreground">
          Busque por matéria ou professor e agende sua próxima aula.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Busca</CardTitle>
          <CardDescription>
            Busque por matéria específica ou professor específico para encontrar aulas disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por matéria ou professor (ex: Matemática, João Silva)..."
                  className="pl-9"
                  value={subjectFilter || teacherFilter}
                  onChange={(e) => {
                    const value = e.target.value
                    setSubjectFilter(value)
                    setTeacherFilter(value)
                  }}
                />
              </div>
            </div>
            {(subjectFilter || teacherFilter) && (
              <Button 
                type="button" 
                variant="outline" 
                className="md:w-auto"
                onClick={() => {
                  setSubjectFilter("")
                  setTeacherFilter("")
                  fetchData()
                }}
              >
                Limpar
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <p className="col-span-full text-center py-10 text-muted-foreground">Carregando aulas...</p>
        ) : classes.length === 0 ? (
          <div className="col-span-full text-center py-10 space-y-4">
            <p className="text-muted-foreground">Nenhuma aula encontrada com os filtros selecionados.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSubjectFilter("")
                setTeacherFilter("")
                fetchData()
              }}
            >
              Limpar filtros
            </Button>
          </div>
        ) : (
          classes.map((cls) => (
            <Card key={cls.id} className="flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{cls.subject}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      {cls.teacherName}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="font-bold">
                    {formatCurrency(cls.value)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(parseISO(cls.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{cls.time} ({cls.duration} min)</span>
                </div>
                {cls.tags && cls.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cls.tags.map((tag) => (
                      <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {cls.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {cls.notes}
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleBookClass(cls.id)}
                  disabled={bookingId === cls.id}
                >
                  {bookingId === cls.id ? "Agendando..." : "Agendar Aula"}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>

      {teachers.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Professores disponíveis</h2>
            <p className="text-muted-foreground">Veja professores prontos para novas aulas</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <Card key={teacher.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{teacher.name}</CardTitle>
                  {teacher.subject && (
                    <CardDescription>{teacher.subject}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {teacher.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{teacher.bio}</p>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {teacher.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        asChild
                      >
                        <a href={`mailto:${teacher.email}`}>
                          <Mail className="mr-2 h-4 w-4" />
                          Email
                        </a>
                      </Button>
                    )}
                    {teacher.phone && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        asChild
                      >
                         <a 
                           href={`https://wa.me/55${teacher.phone.replace(/\D/g, '')}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                         >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
