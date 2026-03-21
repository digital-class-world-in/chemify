
"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Download, 
  Printer, 
  ShieldCheck, 
  Info,
  Loader2,
  CheckCircle2,
  Share2,
  Maximize,
  User,
  MapPin,
  Phone,
  Mail,
  X,
  Copy,
  IdCard,
  Check
} from "lucide-react"
import { useFirebase, useUser } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { toPng } from 'html-to-image'
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { useResolvedId } from "@/hooks/use-resolved-id"
import { useToast } from "@/hooks/use-toast"

export default function StudentIdCardPage() {
  const { database } = useFirebase()
  const { user } = useUser()
  const { toast } = useToast()
  const { resolvedId, staffId: studentId, isLoading: idLoading } = useResolvedId()
  const cardRef = useRef<HTMLDivElement>(null)
  
  const [student, setStudent] = useState<any>(null)
  const [instituteProfile, setInstituteProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!database || !resolvedId || !studentId) {
      if (!idLoading && !studentId) setIsLoading(false)
      return
    }

    const rootPath = `Institutes/${resolvedId}`
    
    // Fetch Institute Profile
    onValue(ref(database, `${rootPath}/profile`), (s) => {
      if (s.exists()) setInstituteProfile(s.val())
    })

    // Fetch Student Profile
    const studentRef = ref(database, `${rootPath}/admissions/${studentId}`)
    onValue(studentRef, (snapshot) => {
      if (snapshot.exists()) {
        setStudent({ ...snapshot.val(), id: studentId })
      }
      setIsLoading(false)
    })

    return () => {
      off(studentRef)
    }
  }, [database, resolvedId, studentId, idLoading])

  const handleDownload = async () => {
    if (!cardRef.current) return
    setIsDownloading(true)
    try {
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1.0, 
        pixelRatio: 3,
        skipFonts: true,
        cacheBust: true
      });
      const link = document.createElement('a');
      link.download = `ID_CARD_${student.studentName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "ID Card Exported", description: "High-resolution PNG is ready." })
    } catch (err) {
      toast({ variant: "destructive", title: "Export Failed" })
    } finally {
      setIsDownloading(false)
    }
  }

  if (isLoading || idLoading) return <div className="p-20 text-center font-black text-zinc-300 uppercase tracking-[0.2em] animate-pulse">Authenticating Identity Credentials...</div>
  if (!student) return <div className="p-20 text-center text-zinc-400 font-bold uppercase">Record Mapping Failed</div>

  const instituteName = instituteProfile?.instituteName || "ACADEMIC INSTITUTE"

  return (
    <main className="flex-1 p-8 space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto pb-32">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div>
          <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tight font-headline">My Identity Card</h2>
          <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest">Official digital credential for the current session</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => window.print()} variant="outline" className="h-12 px-6 rounded-2xl border-zinc-200 bg-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm transition-all hover:bg-zinc-50">
            <Printer className="h-4 w-4" /> Print Copy
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="h-12 px-8 bg-[#1e3a8a] hover:bg-[#162e6a] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/20 active:scale-95 border-none transition-all gap-2"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isDownloading ? "Generating..." : "Download PNG"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-6 flex flex-col items-center">
          <div ref={cardRef} className="w-[350px] h-[550px] bg-white flex flex-col relative border border-zinc-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] overflow-hidden print:shadow-none print:border print:m-0 rounded-[48px]">
            <div className="h-[45%] w-full relative flex flex-col items-center justify-start pt-10 overflow-hidden bg-[#1e3a8a]">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
               <div className="absolute bottom-0 left-0 w-full h-24 bg-white" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
               
               {/* 🏢 INSTITUTE NAME AT THE TOP */}
               <div className="relative z-10 text-center space-y-1 mb-6 w-full px-6">
                 <h3 className="text-white font-black uppercase text-lg tracking-[0.05em] leading-tight truncate drop-shadow-sm">{instituteName}</h3>
                 <p className="text-white/60 text-[9px] font-black uppercase tracking-[0.3em]">STUDENT IDENTITY CARD</p>
               </div>

               <div className="relative z-20">
                 <div className="w-32 h-32 rounded-full border-[6px] border-white shadow-2xl overflow-hidden bg-zinc-50 flex items-center justify-center">
                   {student.studentPhotoUrl ? (
                     <img src={student.studentPhotoUrl} className="w-full h-full object-cover" alt="Student" />
                   ) : (
                     <span className="text-4xl font-black text-zinc-200 uppercase">{student.studentName?.charAt(0)}</span>
                   )}
                 </div>
                 <div className="absolute -bottom-2 right-2 bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg border-2 border-white flex items-center justify-center">
                   <ShieldCheck className="w-4 h-4" />
                 </div>
               </div>
            </div>
            <div className="flex-1 p-10 flex flex-col justify-between">
              <div className="space-y-4">
                <CardDetailRow label="ADM NO." value={student.admissionNo} />
                <CardDetailRow label="ROLL NO." value={student.rollNo || '-'} />
                <CardDetailRow label="STUDENT NAME" value={student.studentName} />
                <CardDetailRow label="FATHER NAME" value={student.fatherName || '-'} />
                <CardDetailRow label="CLASS / SEC" value={`${student.course} - ${student.section || 'A'}`} />
                <CardDetailRow label="EMERGENCY" value={student.mobile || '-'} />
              </div>
              <div className="pt-6 border-t border-zinc-100 text-center">
                <p className="text-[9px] font-bold text-zinc-400 uppercase leading-relaxed max-w-[250px] mx-auto">
                  {instituteProfile?.address || 'Main Campus, Academic Block'}
                </p>
              </div>
            </div>
            <div className="h-2 w-full bg-[#1e3a8a]" />
          </div>
        </div>

        <div className="lg:col-span-6 space-y-8">
          <Card className="border border-zinc-100 shadow-sm rounded-[32px] bg-white p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight">Identity Verified</h4>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Digital Node Synced: {format(new Date(), "PP")}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] border-b border-zinc-50 pb-2">Institutional Compliance</h5>
              <div className="space-y-4">
                <PolicyItem icon={<Maximize className="w-4 h-4" />} text="Valid for academic session 2024-2025 across all campus nodes." />
                <PolicyItem icon={<ShieldCheck className="w-4 h-4" />} text="Digital ID is equivalent to physical copy for on-campus verification." />
                <PolicyItem icon={<Share2 className="w-4 h-4" />} text="Unique Admission No. is required for portal login and exam entry." />
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-50 grid grid-cols-2 gap-6">
              <ContactMini label="Office Line" value={instituteProfile?.phone || '-'} icon={<Phone />} />
              <ContactMini label="Admin Email" value={instituteProfile?.email || '-'} icon={<Mail />} />
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[32px] bg-zinc-900 p-8 text-white flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                Found an error? <br />
                <span className="text-white">Request Modification</span>
              </p>
            </div>
            <Button variant="ghost" className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-all">Support Desk</Button>
          </Card>
        </div>
      </div>
    </main>
  )
}

function CardDetailRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex items-baseline gap-4 group">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest min-w-[110px]">{label}</span>
      <span className="text-[10px] text-zinc-400">:</span>
      <span className="text-[11px] font-black text-zinc-800 uppercase tracking-tight flex-1 truncate">{value}</span>
    </div>
  )
}

function PolicyItem({ icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="text-zinc-300 mt-0.5">{icon}</div>
      <p className="text-xs text-zinc-500 font-medium leading-relaxed">{text}</p>
    </div>
  )
}

function ContactMini({ label, value, icon }: { label: string, value: string, icon: any }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-zinc-300 uppercase tracking-tighter">{label}</span>
        <span className="text-[10px] font-bold text-zinc-600 truncate max-w-[120px]">{value}</span>
      </div>
    </div>
  )
}
