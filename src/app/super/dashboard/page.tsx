
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ShieldCheck,
  Activity,
  Layers,
  FileEdit,
  XCircle,
  PauseCircle,
  Bug,
  Info,
  AlertCircle
} from "lucide-react"
import { useFirebase } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { cn } from "@/lib/utils"

const PROJECT_STATUSES = [
  "Yet not Started",
  "On Going",
  "Delivery Completed",
  "In Client Revision",
  "Stopped by DC",
  "Client Side Hold",
  "Client Side Requirement Pending",
  "Bug Solving"
]

const STATUS_ICONS: Record<string, any> = {
  "Yet not Started": <Clock className="text-zinc-400" />,
  "On Going": <Activity className="text-blue-500" />,
  "Delivery Completed": <CheckCircle2 className="text-emerald-500" />,
  "In Client Revision": <FileEdit className="text-amber-500" />,
  "Stopped by DC": <XCircle className="text-rose-500" />,
  "Client Side Hold": <PauseCircle className="text-orange-500" />,
  "Client Side Requirement Pending": <Info className="text-indigo-500" />,
  "Bug Solving": <Bug className="text-purple-500" />
}

export default function SuperDashboardPage() {
  const { database } = useFirebase()
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!database) return
    
    // Fetch Projects for aggregated stats
    const projectsRef = ref(database, 'MasterProjects')
    const unsubProjects = onValue(projectsRef, (snapshot) => {
      const data = snapshot.val() || {}
      setProjects(Object.keys(data).map(k => ({ ...data[k], id: k })))
      setIsLoading(false)
    })

    return () => off(projectsRef)
  }, [database])

  const totals = useMemo(() => {
    let sales = 0
    let received = 0
    let due = 0

    projects.forEach(p => {
      sales += (Number(p.totalAmount) || 0)
      received += (Number(p.receivedAmount) || 0)
      due += (Number(p.dueAmount) || 0)
    })

    return { sales, received, due }
  }, [projects])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    PROJECT_STATUSES.forEach(s => counts[s] = 0)
    projects.forEach(p => {
      if (p.status && counts[p.status] !== undefined) {
        counts[p.status]++
      }
    })
    return counts
  }, [projects])

  if (isLoading) return <div className="p-20 text-center font-black text-zinc-400 uppercase animate-pulse tracking-widest font-public-sans">Initializing Global Hub...</div>

  return (
    <main className="flex-1 p-8 space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-32 bg-white min-h-screen font-public-sans text-black">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-800 tracking-tight uppercase font-headline">Dashboard</h2>
          <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest mt-1">Real-time Enterprise Portfolio Overview</p>
        </div>
      </div>

      {/* 💰 PRIMARY FINANCIAL CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <MetricCard label="Total Sales Portfolio" value={`₹${totals.sales.toLocaleString()}`} icon={<Layers className="text-indigo-500" />} />
        <MetricCard label="Aggregate Received" value={`₹${totals.received.toLocaleString()}`} icon={<CheckCircle2 className="text-emerald-500" />} color="text-emerald-600" />
        <MetricCard label="Total Outstanding Due" value={`₹${totals.due.toLocaleString()}`} icon={<AlertCircle className="text-rose-500" />} color="text-rose-600" />
      </div>

      {/* 📊 PROJECT STATUS MATRIX */}
      <div className="space-y-8">
        <div className="flex items-center gap-3 px-2 border-b border-zinc-50 pb-4">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400">Node Lifecycle Distribution</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {PROJECT_STATUSES.map(status => (
            <Card key={status} className="border border-zinc-100 shadow-sm rounded-[24px] bg-zinc-50/30 p-6 flex items-center justify-between transition-all hover:bg-white hover:shadow-md group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  {STATUS_ICONS[status] || <Info className="text-zinc-300" />}
                </div>
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">{status}</p>
                  <h4 className="text-xl font-black text-zinc-800 leading-none">{statusCounts[status] || 0}</h4>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div className="pt-10 border-t border-zinc-100">
        <div className="flex items-center gap-3 px-2">
          <TrendingUp className="w-5 h-5 text-zinc-300" />
          <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">Enterprise Infrastructure Management Protocol V2.0</p>
        </div>
      </div>
    </main>
  )
}

function MetricCard({ label, value, icon, color = "text-zinc-800" }: any) {
  return (
    <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-8 group hover:shadow-xl transition-all duration-500 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-zinc-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
      <div className="flex flex-col gap-6 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center shadow-inner group-hover:bg-white transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</p>
          <h4 className={cn("text-3xl font-black tracking-tight", color)}>{value}</h4>
        </div>
      </div>
    </Card>
  )
}
