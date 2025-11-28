"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mail, Phone, User } from "lucide-react"
import { getMyTeachers, type Profile } from "@/lib/supabase-db"
import { toast } from "@/hooks/use-toast"

export default function MyTeachersPage() {
  const [teachers, setTeachers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await getMyTeachers()
        setTeachers(data)
      } catch (error) {
        console.error("Error fetching teachers:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus professores.",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTeachers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh when classes are updated
  useEffect(() => {
    const handleUpdate = () => {
      fetchTeachers()
    }
    window.addEventListener("classUpdated", handleUpdate)
    return () => window.removeEventListener("classUpdated", handleUpdate)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Professores</h1>
        <p className="text-muted-foreground">
          Visualize seus professores anteriores e entre em contato novamente quando precisar.
        </p>
      </div>

      {loading ? (
        <p className="text-center py-10 text-muted-foreground">Carregando professores...</p>
      ) : teachers.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Você ainda não teve aulas com nenhum professor.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teachers.map((teacher) => (
            <Card key={teacher.id}>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={teacher.avatar} alt={teacher.name} />
                  <AvatarFallback>{teacher.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg">{teacher.name}</CardTitle>
                  <CardDescription>{teacher.subject || "Professor"}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {teacher.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {teacher.bio}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{teacher.email}</span>
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{teacher.phone}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button 
                  className="flex-1" 
                  variant="outline" 
                  onClick={() => {
                    window.location.href = `mailto:${teacher.email}`
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  E-mail
                </Button>
                {teacher.phone && (
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => {
                      window.location.href = `tel:${teacher.phone}`
                    }}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Telefone
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
