"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet, 
  Building2,
  MoreVertical,
  ArrowRight,
  Trash2
} from "lucide-react"
import { useFirebase } from "@/firebase"
import { ref, onValue, off, remove } from "firebase/database"
import { cn } from "@/lib/utils"
import Link from "next/link"
import * as XLSX from "xlsx"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

export default function ManageInstitutesPage() {
  const { database } = useFirebase()
  const [institutes, setInstitutes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!database) return
    const instRef = ref(database, 'Institutes')
    const unsubscribe = onValue(instRef, (snapshot) => {
      const data = snapshot.val() || {}
      const list = Object.keys(data).map(k => ({ 
        ...data[k].profile, 
        id: k,
        raw: data[k] 
      }))
      
      // Sort by createdAt descending (Latest signup first)
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })

      setInstitutes(list)
      setIsLoading(false)
    })
    return () => off(instRef)
  }, [database])

  const filtered = useMemo(() => {
    return institutes.filter(i => {
      const matchSearch = !searchTerm || 
        i.instituteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.id?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = filterStatus === 'all' || i.status === filterStatus
      return matchSearch && matchStatus
    })
  }, [institutes, searchTerm, filterStatus])

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(i => ({
      "Institute Name": i.instituteName,
      "Owner": i.fullName,
      "Email": i.email,
      "Phone": i.phone,
      "Plan": i.currentPlan,
      "Status": i.status,
      "Registered On": i.createdAt
    })))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Institutes")
    XLSX.writeFile(wb, "SaaS_Institutes_Registry.xlsx")
  }

  const handleDelete = async (inst: any) => {
    if (!database) return
    if (!confirm(`CRITICAL WARNING: This will permanently delete "${inst.instituteName}" and all its associated data (students, staff, finances, website). This action is irreversible. Proceed?`)) return

    try {
      // 1. Remove Institute Data
      await remove(ref(database, `Institutes/${inst.id}`))
      
      // 2. Remove Slug if exists
      if (inst.slug) {
        await remove(ref(database, `Slugs/${inst.slug}`))
      }
      
      toast({ title: "Node Purged", description: "The institute node has been successfully removed from the cloud network." })
    } catch (e) {
      toast({ variant: "destructive", title: "Deletion Failed" })
    }
  }

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-400 uppercase animate-pulse tracking-widest font-public-sans">Establishing Secure Registry Sync...</div>

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto w-full pb-32 bg-white min-h-screen font-public-sans">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-800 tracking-tight uppercase font-headline">Registered Users</h2>
          <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest mt-1">Real-time Node Administration</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} className="h-11 px-6 rounded-xl font-bold text-xs gap-2 border-zinc-200 bg-white text-emerald-600 hover:bg-emerald-50 transition-all uppercase tracking-widest shadow-sm">
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <Card className="border border-zinc-200 shadow-sm rounded-2xl bg-white p-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-300 group-focus-within:text-primary transition-colors" />
            <Input 
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search across all nodes (Name, Owner, ID)..." 
              className="pl-12 h-12 rounded-xl border-zinc-200 bg-zinc-50/50 shadow-inner focus-visible:ring-1 focus-visible:ring-primary font-bold text-sm" 
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['all', 'Active', 'Expired', 'Trial'].map(status => (
              <button
                key={status}
                onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                className={cn(
                  "px-6 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-none",
                  filterStatus === status ? "bg-[#1e3a8a] text-white shadow-xl scale-105" : "bg-zinc-50 text-zinc-400 hover:bg-zinc-100"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="border border-zinc-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-zinc-50/50">
              <TableRow className="border-zinc-200 hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14 pl-10 w-20">SR NO.</TableHead>
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14">NODE IDENTIFIER</TableHead>
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14">OWNERSHIP</TableHead>
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14">TIER</TableHead>
                <TableHead className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">STATUS</TableHead>
                <TableHead className="text-right pr-10 text-[10px] font-black text-zinc-400 uppercase tracking-widest h-14">OPERATIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((inst, idx) => (
                <TableRow key={inst.id} className="border-zinc-100 group hover:bg-zinc-50/30 transition-none">
                  <TableCell className="pl-10 py-6 text-base font-black text-zinc-800">
                    {(currentPage - 1) * itemsPerPage + idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-primary border border-zinc-100 shadow-inner group-hover:scale-110 transition-transform">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-zinc-800 uppercase tracking-tight">{inst.instituteName}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">UID: {inst.id?.substring(0, 12)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-zinc-700 uppercase">{inst.fullName}</p>
                      <p className="text-[9px] font-bold text-zinc-400 lowercase tracking-tighter">{inst.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        inst.currentPlan === 'Trial' ? "text-amber-500" : "text-primary"
                      )}>
                        {inst.currentPlan}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-300 mt-0.5">Exp: {inst.planExpiryDate ? format(new Date(inst.planExpiryDate), "PP") : '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={cn(
                      "rounded-lg px-3 py-1 text-[9px] font-black uppercase border-none shadow-none transition-none",
                      inst.status === 'Active' ? "bg-emerald-50 text-emerald-600" :
                      inst.status === 'Expired' ? "bg-rose-50 text-rose-600" : "bg-zinc-50 text-zinc-400"
                    )}>{inst.status || 'OFFLINE'}</Badge>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="ghost" className="h-9 px-4 rounded-xl text-[#1e3a8a] bg-blue-50/50 hover:bg-blue-100 font-black uppercase text-[10px] tracking-widest border-none transition-all">
                        <Link href={`/super/institutes/${inst.id}`}>
                          Config <ArrowRight className="w-3 h-3 ml-2" />
                        </Link>
                      </Button>
                      <Button onClick={() => handleDelete(inst)} variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-rose-500 hover:bg-rose-50 transition-all border-none">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button 
            variant="ghost" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
            disabled={currentPage === 1}
            className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-primary transition-all"
          >
            <ChevronLeft className="w-4 h-4 mr-2" /> Prev
          </Button>
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={cn(
                  "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                  currentPage === i + 1 ? "bg-[#1e3a8a] text-white shadow-xl scale-110" : "bg-white border border-zinc-100 text-zinc-400 hover:bg-zinc-50"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
            disabled={currentPage >= totalPages}
            className="h-10 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest text-zinc-400 hover:text-primary transition-all"
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </main>
  )
}