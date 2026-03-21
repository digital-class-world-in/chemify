
"use client"

import { useState, useEffect, useMemo } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  CalendarDays, 
  Trash2, 
  Edit2, 
  Loader2,
  Save,
  Calendar as CalendarIcon,
  Info,
  Clock,
  PartyPopper,
  Badge
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, push, remove, off, update } from "firebase/database"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from "date-fns"
import { usePathname } from "next/navigation"
import { Textarea } from "@/components/ui/textarea"

const ENTRY_TYPES = ["Holiday", "Activity", "Event"]
const COLORS: Record<string, any> = {
  "Emerald": { value: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  "Blue": { value: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  "Rose": { value: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  "Amber": { value: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  "Indigo": { value: "bg-indigo-500", text: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" }
}

export default function HolidayCalendarPage() {
  const pathname = usePathname()
  const isPortal = pathname.startsWith('/staff') || pathname.startsWith('/student') || pathname.startsWith('/branch')

  const { database } = useFirebase()
  const { user } = useUser()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [holidays, setHolidays] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingHoliday, setEditingHoliday] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!database || !user) return
    const rootPath = `Institutes/${user.uid}/holidays`
    onValue(ref(database, rootPath), (snapshot) => {
      const data = snapshot.val()
      if (data) setHolidays(Object.keys(data).map(key => ({ ...data[key], id: key })))
      else setHolidays([])
      setIsLoading(false)
    })
    return () => off(ref(database, rootPath))
  }, [database, user])

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth))
    const end = endOfWeek(endOfMonth(currentMonth))
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const handleSaveHoliday = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user || !database || isSaving) return
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      entryType: formData.get("entryType") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string || formData.get("startDate") as string,
      color: formData.get("color") as string,
      description: formData.get("description") as string || "",
      updatedAt: Date.now()
    }
    const dbPath = `Institutes/${user.uid}/holidays`
    try {
      if (editingHoliday) {
        await update(ref(database, `${dbPath}/${editingHoliday.id}`), data)
      } else {
        await push(ref(database, dbPath), { ...data, createdAt: Date.now() })
      }
      toast({ title: "Calendar Node Updated", description: "The institutional schedule has been synchronized." })
      setIsModalOpen(false)
      setEditingHoliday(null)
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = (id: string) => {
    if (!database || !user) return
    if (confirm("Permanently purge this calendar node?")) {
      remove(ref(database, `Institutes/${user.uid}/holidays/${id}`))
        .then(() => {
          toast({ title: "Event Removed" })
          setIsModalOpen(false)
          setEditingHoliday(null)
        })
    }
  }

  const mainContent = (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 w-full overflow-x-hidden font-public-sans text-black text-[14px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 font-headline uppercase tracking-tight leading-none">Holiday Registry</h2>
          <p className="text-sm text-zinc-400 font-medium mt-1">Manage institutional breaks and academic milestones</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-zinc-100 flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="h-9 w-9 rounded-xl transition-all hover:bg-zinc-50"><ChevronLeft className="w-4 h-4 text-zinc-400" /></Button>
            <div className="px-6 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-800 min-w-[200px] text-center">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="h-9 w-9 rounded-xl transition-all hover:bg-zinc-50"><ChevronRight className="w-4 h-4 text-zinc-400" /></Button>
          </div>
          <Button 
            onClick={() => { setEditingHoliday(null); setIsModalOpen(true); }} 
            className="bg-primary hover:opacity-90 text-white rounded-2xl h-12 px-8 font-black text-xs uppercase tracking-widest border-none shadow-lg active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Event
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] rounded-[48px] overflow-hidden bg-white border border-zinc-100 relative">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} className="py-6 text-center text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 border-r border-zinc-100 last:border-r-0">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 border-l border-zinc-100">
          {calendarDays.map((day, idx) => {
            const dayHolidays = holidays.filter(h => {
              const start = parseISO(h.startDate)
              const end = parseISO(h.endDate || h.startDate)
              return (isSameDay(day, start) || isSameDay(day, end) || (day > start && day < end))
            })

            return (
              <div key={idx} className={cn(
                "min-h-[160px] p-4 border-r border-b border-zinc-100 relative group transition-all duration-500", 
                !isSameMonth(day, currentMonth) && "bg-zinc-50/30 grayscale-[0.5] opacity-20"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black mb-4 transition-all duration-500", 
                  isToday(day) ? "bg-[#1e3a8a] text-white shadow-xl scale-110 z-10" : "text-zinc-300 group-hover:text-zinc-800"
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-2">
                  {dayHolidays.map((h, i) => {
                    const colorSet = COLORS[h.color] || COLORS["Emerald"]
                    return (
                      <div 
                        key={i} 
                        onClick={() => { setEditingHoliday(h); setIsModalOpen(true); }}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[9px] font-black uppercase truncate cursor-pointer shadow-sm border-l-4 transition-all hover:scale-105 active:scale-95", 
                          colorSet.bg, 
                          colorSet.text,
                          colorSet.border
                        )}
                      >
                        {h.name}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl">
          <div className="bg-[#1e3a8a] px-10 py-10 text-white relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl" />
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-2">
                <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase tracking-widest px-3">Node Entry</Badge>
                <DialogTitle className="text-3xl font-black uppercase tracking-tight font-headline">
                  {editingHoliday ? 'Refine Event' : 'New Schedule'}
                </DialogTitle>
              </div>
              <DialogClose className="p-2 hover:bg-white/10 rounded-full border-none outline-none transition-all"><X className="h-6 w-6 text-white" /></DialogClose>
            </div>
          </div>
          
          <form onSubmit={handleSaveHoliday} className="p-10 space-y-8">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Event Descriptor *</Label>
                <Input name="name" defaultValue={editingHoliday?.name} required placeholder="e.g. Summer Vacation 2026" className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold text-black shadow-inner" />
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Category</Label>
                  <Select name="entryType" defaultValue={editingHoliday?.entryType || "Holiday"}>
                    <SelectTrigger className="h-12 rounded-2xl border-zinc-100 bg-zinc-50/50 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-zinc-100 shadow-xl">
                      {ENTRY_TYPES.map(t => <SelectItem key={t} value={t} className="font-bold text-xs uppercase">{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Visual Skin</Label>
                  <Select name="color" defaultValue={editingHoliday?.color || "Emerald"}>
                    <SelectTrigger className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                      {Object.keys(COLORS).map(c => (
                        <SelectItem key={c} value={c} className="font-bold text-xs uppercase">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Commencement</Label>
                  <Input name="startDate" type="date" required defaultValue={editingHoliday?.startDate || isToday} className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Conclusion</Label>
                  <Input name="endDate" type="date" defaultValue={editingHoliday?.endDate || isToday} className="h-12 rounded-xl border-zinc-100 bg-zinc-50/50 font-bold" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Institutional Note</Label>
                <Textarea name="description" defaultValue={editingHoliday?.description} placeholder="Provide details for students & staff..." className="rounded-3xl border-zinc-100 bg-zinc-50/50 min-h-[120px] font-medium" />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-4">
              <Button 
                type="submit" 
                disabled={isSaving} 
                className="w-full h-16 bg-zinc-900 hover:bg-black text-white rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl border-none active:scale-95 transition-all"
              >
                {isSaving ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="mr-3 w-5 h-5" />} 
                Commit Registry Node
              </Button>
              {editingHoliday && (
                <Button 
                  type="button" 
                  variant="ghost"
                  onClick={() => handleDelete(editingHoliday.id)}
                  className="w-full h-12 text-rose-500 hover:bg-rose-50 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Purge from Calendar
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  )

  if (isPortal) return mainContent

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-body overflow-x-hidden">
      <Sidebar />
      <div className="lg:pl-[300px] flex flex-col flex-1 w-full overflow-x-hidden">
        <TopNav />
        {mainContent}
      </div>
    </div>
  )
}
