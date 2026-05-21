"use client"

import { useState, useMemo, useRef } from "react"
import { Calendar, ChevronLeft, ChevronRight, Plus, Clock, BookOpen, FilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useI18n } from "@/lib/i18n"
import { useClasses } from "@/hooks/use-classes"
import { useStudents } from "@/hooks/use-students"
import { CreateClassModal } from "@/components/create-class-modal"
import { ClassActionsMenu } from "@/components/class-actions-menu"
import { ClassStatusBadge } from "@/components/class-status-badge"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { formatCurrency } from "@/lib/utils"
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
} from "date-fns"
import { ptBR } from "date-fns/locale"

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"all" | "day" | "week" | "month">("all")
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [newClassOpen, setNewClassOpen] = useState(false)
  const [filterStudent, setFilterStudent] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [customStartDate, setCustomStartDate] = useState("")
  const [customEndDate, setCustomEndDate] = useState("")
  const monthClassesRef = useRef<HTMLDivElement>(null)
  const { t } = useI18n()
  const { classes, refresh } = useClasses()
  const { students } = useStudents()

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const handleClassSuccess = () => {
    setNewClassOpen(false)
    refresh()
  }

  const handleClassUpdate = () => {
    refresh()
  }

  const handleDayClick = (dateStr: string) => {
    const dayClasses = classes.filter((c) => c.date === dateStr)
    if (dayClasses.length > 0 && monthClassesRef.current) {
      monthClassesRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const filteredClasses = useMemo(() => {
    let filtered = classes

    if (filterStudent !== "all") {
      filtered = filtered.filter((c) => c.studentId === filterStudent)
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((c) => c.status === filterStatus)
    }

    if (viewMode === "all" && customStartDate && customEndDate) {
      const startDate = parseISO(customStartDate)
      const endDate = parseISO(customEndDate)
      filtered = filtered.filter((c) => {
        const classDate = parseISO(c.date)
        return classDate >= startDate && classDate <= endDate
      })
    }

    switch (viewMode) {
      case "day":
        const dayStr = format(selectedDate, "yyyy-MM-dd")
        return filtered.filter((c) => c.date === dayStr)

      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
        return filtered.filter((c) => {
          const classDate = parseISO(c.date)
          return classDate >= weekStart && classDate <= weekEnd
        })

      case "month":
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        return filtered.filter((c) => {
          const classDate = parseISO(c.date)
          return classDate >= monthStart && classDate <= monthEnd
        })

      default:
        return filtered
    }
  }, [classes, viewMode, currentDate, selectedDate, filterStudent, filterStatus, customStartDate, customEndDate])

  const navigatePrevious = () => {
    switch (viewMode) {
      case "day":
        setSelectedDate((prev) => addDays(prev, -1))
        break
      case "week":
        setCurrentDate((prev) => subWeeks(prev, 1))
        break
      case "month":
        setCurrentDate((prev) => subMonths(prev, 1))
        break
    }
  }

  const navigateNext = () => {
    switch (viewMode) {
      case "day":
        setSelectedDate((prev) => addDays(prev, 1))
        break
      case "week":
        setCurrentDate((prev) => addWeeks(prev, 1))
        break
      case "month":
        setCurrentDate((prev) => addMonths(prev, 1))
        break
    }
  }

  const getTitle = () => {
    switch (viewMode) {
      case "day":
        return format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      case "week":
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
        return `${format(weekStart, "dd/MM", { locale: ptBR })} - ${format(weekEnd, "dd/MM", { locale: ptBR })}`
      case "month":
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
      default:
        return "Todas as Aulas"
    }
  }

  const groupedByDate = useMemo(() => {
    if (viewMode !== "week") return {}

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(currentDate, { weekStartsOn: 0 }),
    })

    const grouped: { [key: string]: typeof classes } = {}

    weekDays.forEach((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      grouped[dayStr] = filteredClasses.filter((c) => c.date === dayStr)
    })

    return grouped
  }, [filteredClasses, currentDate, viewMode])

  const monthCalendarData = useMemo(() => {
    if (viewMode !== "month") return []

    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      const dayClasses = filteredClasses.filter((c) => c.date === dayStr)
      return {
        date: day,
        dateStr: dayStr,
        classes: dayClasses,
        classCount: dayClasses.length,
        isCurrentMonth: day >= monthStart && day <= monthEnd,
      }
    })
  }, [currentDate, filteredClasses, viewMode])

const renderClassTags = (classItem: any, showNames = true) => {
    if (!classItem.tags || classItem.tags.length === 0) return null

    if (showNames) {
      return (
        <div className="flex gap-1 mt-1 flex-wrap">
          {classItem.tags.map((tag: any) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs px-1 py-0"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )
    } else {
      return (
        <div className="flex gap-1 mt-1">
          {classItem.tags.map((tag: any) => (
            <div
              key={tag.id}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: tag.color }}
              title={tag.name}
            />
          ))}
        </div>
      )
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-4">
        <PageHeader title="Agenda" description="Visualize e gerencie suas aulas.">
          <CreateClassModal
            open={newClassOpen}
            onOpenChange={setNewClassOpen}
            onSuccess={handleClassSuccess}
          />
          <Button
            onClick={() => setNewClassOpen(true)}
            className="h-9 gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Aula
          </Button>
        </PageHeader>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12">
            <TabsTrigger value="all" className="text-sm">
              Todas
            </TabsTrigger>
            <TabsTrigger value="day" className="text-sm">
              Dia
            </TabsTrigger>
            <TabsTrigger value="week" className="text-sm">
              Semana
            </TabsTrigger>
            <TabsTrigger value="month" className="text-sm">
              Mês
            </TabsTrigger>
          </TabsList>

          {viewMode !== "all" && (
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" size="icon" className="h-12 w-12 bg-transparent" onClick={navigatePrevious}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="text-center">
                <h3 className="text-lg font-semibold">{getTitle()}</h3>
                {viewMode === "day" && (
                  <p className="text-sm text-muted-foreground">
                    {filteredClasses.length} aula{filteredClasses.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
              <Button variant="outline" size="icon" className="h-12 w-12 bg-transparent" onClick={navigateNext}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {viewMode === "day" && (
            <div className="flex justify-center mt-4">
              <div className="w-full max-w-xs">
                <Label htmlFor="date-picker">Selecionar Data</Label>
                <Input
                  id="date-picker"
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="h-12 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
          )}

          <TabsContent value="all" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FilterIcon className="h-5 w-5" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="filter-student">Aluno</Label>
                    <Select value={filterStudent} onValueChange={setFilterStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os alunos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os alunos</SelectItem>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter-status">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="scheduled">Agendada</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                        <SelectItem value="cancelled">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="custom-start-date">Data Inicial</Label>
                    <Input
                      id="custom-start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="h-12 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="custom-end-date">Data Final</Label>
                    <Input
                      id="custom-end-date"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="h-12 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                {(filterStudent !== "all" || filterStatus !== "all" || customStartDate || customEndDate) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilterStudent("all")
                      setFilterStatus("all")
                      setCustomStartDate("")
                      setCustomEndDate("")
                    }}
                    className="w-full"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>

            <div className="text-center mb-4">
              <p className="text-muted-foreground">
                Total: {filteredClasses.length} aula{filteredClasses.length !== 1 ? "s" : ""}
              </p>
            </div>

            {filteredClasses.length === 0 ? (
              <EmptyState
                icon={Calendar}
                message="Nenhuma aula encontrada"
                description={filterStudent !== "all" || filterStatus !== "all" || customStartDate || customEndDate ? "Tente ajustar os filtros" : "Comece agendando sua primeira aula"}
              />
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filteredClasses
                  .sort((a, b) => new Date(b.date + " " + b.time).getTime() - new Date(a.date + " " + a.time).getTime())
                  .map((classItem) => (
                    <Card key={classItem.id} className="touch-manipulation hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-1">
                              {classItem.studentName}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <BookOpen className="h-3 w-3 shrink-0" />
                              <span className="truncate">{classItem.subject}</span>
                            </div>
                            {renderClassTags(classItem, true)}
                          </div>
                          <div className="flex items-center gap-2">
                            <ClassStatusBadge status={classItem.status} />
                            <ClassActionsMenu classItem={classItem} onUpdate={handleClassUpdate} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>{format(parseISO(classItem.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>{classItem.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm text-muted-foreground">{classItem.duration} min</div>
                          <div className="text-lg font-bold text-primary">{formatCurrency(classItem.value)}</div>
                        </div>

                        {classItem.notes && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">{classItem.notes}</div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="day" className="space-y-4 mt-6">
            {filteredClasses.length === 0 ? (
              <EmptyState icon={Calendar} message="Nenhuma aula neste dia" description="Selecione outro dia ou agende uma nova aula" />
            ) : (
              <div className="space-y-3">
                {filteredClasses
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((classItem) => (
                    <Card key={classItem.id} className="touch-manipulation">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="text-2xl font-bold text-primary min-w-[80px] bg-primary/10 rounded-lg p-3 text-center">
                              {classItem.time}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-lg">{classItem.studentName}</div>
                              <div className="text-muted-foreground flex items-center gap-2">
                                <BookOpen className="h-4 w-4 shrink-0" />
                                <span className="truncate">{classItem.subject}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">{classItem.duration} minutos</div>
                              {renderClassTags(classItem, true)}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-2">
                              <ClassStatusBadge status={classItem.status} />
                              <ClassActionsMenu classItem={classItem} onUpdate={handleClassUpdate} />
                            </div>
                            <div className="text-xl font-bold text-primary">{formatCurrency(classItem.value)}</div>
                          </div>
                        </div>
                        {classItem.notes && (
                          <div className="mt-3 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            {classItem.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="week" className="space-y-4 mt-6">
            <Accordion type="multiple" className="w-full">
              {Object.entries(groupedByDate).map(([dateStr, dayClasses]) => {
                const date = parseISO(dateStr)
                const dayName = format(date, "EEEE", { locale: ptBR })
                const dayDate = format(date, "dd/MM", { locale: ptBR })

                return (
                  <AccordionItem key={dateStr} value={dateStr}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="font-semibold capitalize">{dayName}</div>
                            <div className="text-sm text-muted-foreground">{dayDate}</div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {dayClasses.length} aula{dayClasses.length !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {dayClasses.length === 0 ? (
                        <EmptyState icon={Calendar} message="Nenhuma aula neste dia" />
                      ) : (
                        <div className="space-y-3">
                          {dayClasses
                            .sort((a, b) => a.time.localeCompare(b.time))
                            .map((classItem) => (
                              <div
                                key={classItem.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <div className="text-lg font-bold text-primary min-w-[60px]">{classItem.time}</div>
                                  <div className="flex-1">
                                    <div className="font-medium">{classItem.studentName}</div>
                                    <div className="text-sm text-muted-foreground">{classItem.subject}</div>
                                    {renderClassTags(classItem, true)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <ClassStatusBadge status={classItem.status} />
                                  <div className="text-lg font-bold text-primary">
                                    {formatCurrency(classItem.value)}
                                  </div>
                                  <ClassActionsMenu classItem={classItem} onUpdate={handleClassUpdate} />
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </TabsContent>

          <TabsContent value="month" className="space-y-4 mt-6">
            <div className="text-center mb-4">
              <p className="text-muted-foreground">
                {filteredClasses.length} aula{filteredClasses.length !== 1 ? "s" : ""} neste mês
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Calendário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => (
                    <div key={day} className="p-2 text-xs font-medium text-center border-b">
                      {day}
                    </div>
                  ))}

                  {monthCalendarData.map((day, index) => (
                    <div
                      key={index}
                      className={`p-2 min-h-[60px] border border-border/50 touch-manipulation relative cursor-pointer hover:bg-muted/50 transition-colors ${
                        !day.isCurrentMonth ? "opacity-30" : ""
                      }`}
                      onClick={() => handleDayClick(day.dateStr)}
                    >
                      <div className="text-xs font-medium mb-1">{format(day.date, "d")}</div>
                      {day.classCount > 0 && (
                        <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {day.classCount}
                        </div>
                      )}
                      {day.classes.length > 0 && (
                        <div className="absolute top-1 left-1 flex gap-1">
                          {day.classes.slice(0, 3).map((classItem, idx) => {
                            if (!classItem.tags || classItem.tags.length === 0) return null
                            return (
                              <div
                                key={idx}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: classItem.tags[0]?.color || "#3b82f6" }}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {filteredClasses.length > 0 && (
              <div ref={monthClassesRef} className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {filteredClasses
                  .sort((a, b) => new Date(a.date + " " + a.time).getTime() - new Date(b.date + " " + b.time).getTime())
                  .map((classItem) => (
                    <Card key={classItem.id} className="touch-manipulation hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg font-semibold line-clamp-1">
                              {classItem.studentName}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <BookOpen className="h-3 w-3 shrink-0" />
                              <span className="truncate">{classItem.subject}</span>
                            </div>
                            {renderClassTags(classItem, true)}
                          </div>
                          <div className="flex items-center gap-2">
                            <ClassStatusBadge status={classItem.status} />
                            <ClassActionsMenu classItem={classItem} onUpdate={handleClassUpdate} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>{format(parseISO(classItem.date), "dd/MM", { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                            <span>{classItem.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t">
                          <div className="text-sm text-muted-foreground">{classItem.duration} min</div>
                          <div className="text-lg font-bold text-primary">{formatCurrency(classItem.value)}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
