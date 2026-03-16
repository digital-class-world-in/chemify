
"use client"

import { useState, useEffect, use } from "react"
import { useFirebase } from "@/firebase"
import { ref, onValue, off, push, get } from "firebase/database"
import { motion } from "framer-motion"
import { 
  Building2, 
  ChevronRight, 
  Layers, 
  Monitor, 
  Zap, 
  ShieldCheck, 
  Trophy, 
  CheckCircle2,
  CalendarCheck,
  GraduationCap,
  Briefcase,
  Play,
  ArrowRight,
  School,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Menu,
  X,
  Award,
  BookOpen,
  UserPlus,
  Clock,
  Star,
  TrendingUp,
  Loader2,
  Send,
  Youtube,
  ChevronDown,
  User,
  Users
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
}

const DEFAULT_INFRA = [
  {
    id: '1',
    title: "Smart Classrooms",
    description: "Equipped with interactive touch-panels and digital audio systems for a modern learning experience.",
    image: "https://images.unsplash.com/photo-1523050853064-8521a3930ff4?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: '2',
    title: "Computer Labs",
    description: "High-performance systems with the latest software and 24/7 high-speed fiber optic internet.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: '3',
    title: "Digital Library",
    description: "Access to thousands of e-books, research papers, and technical journals from around the globe.",
    image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2070&auto=format&fit=crop"
  }
]

const DEFAULT_LIFECYCLE = [
  { id: 1, title: "Admission", icon: 'UserPlus', desc: "Simple registration and counseling process to identify your goals." },
  { id: 2, title: "Orientation", icon: 'Award', desc: "Introduction to campus culture, tools, and the academic roadmap." },
  { id: 3, title: "Classroom Learning", icon: 'BookOpen', desc: "Concept-focused learning in our modern smart-classroom environments." },
  { id: 4, title: "Practical Training", icon: 'Monitor', desc: "Developing hands-on skills with real-world software and projects." },
  { id: 5, title: "Internship", icon: 'Briefcase', desc: "Applying skills in a professional corporate setting with partners." },
  { id: 6, title: "Placement", icon: 'Trophy', desc: "Direct hiring by top-tier global companies through our cell." }
]

const ICON_MAP: Record<string, any> = {
  UserPlus: <UserPlus className="w-6 h-6" />,
  Award: <Award className="w-6 h-6" />,
  BookOpen: <BookOpen className="w-6 h-6" />,
  Monitor: <Monitor className="w-6 h-6" />,
  Briefcase: <Briefcase className="w-6 h-6" />,
  Trophy: <Trophy className="w-6 h-6" />,
  Star: <Star className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
}

export default function InfrastructurePage({ params }: { params: Promise<{ id: string }> }) {
  const id = "DLTr4nGsqOcmEuUi8SbHm2JMsmD2";
  const { database } = useFirebase()
  
  const [resolvedUid, setResolvedUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [infraData, setInfraData] = useState<any[]>([])
  const [lifecycleSteps, setLifecycleSteps] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [hero, setHero] = useState<any>({
    title: "Campus Lifecycle & Modern Infrastructure",
    description: "Experience a Smart Learning Environment Designed for Excellence.",
    buttonText: "Explore Facilities"
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    course: "",
    message: ""
  })

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!database || !id) return
    get(ref(database, `Slugs/${id}`)).then((snapshot) => {
      const uid = snapshot.val() || id; 
      setResolvedUid(uid);
    });
  }, [database, id])

  useEffect(() => {
    if (!database || !resolvedUid) return
    const rootPath = `Institutes/${resolvedUid}`
    
    const profileRef = ref(database, `${rootPath}/profile`)
    const unsubProfile = onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) setProfile(snapshot.val())
    })

    const settingsRef = ref(database, `${rootPath}/website_settings`)
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.val())
    })

    const coursesRef = ref(database, `${rootPath}/website_courses`)
    const unsubCourses = onValue(coursesRef, (s) => {
      const data = s.val() || {}
      setCourses(Object.keys(data).map(k => ({ ...data[k], id: k })))
    })

    const infraRef = ref(database, `${rootPath}/website_settings/infrastructure`)
    const unsubInfra = onValue(infraRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        if (data.hero) setHero(data.hero)
        if (data.items) setInfraData(Object.values(data.items))
        else setInfraData(DEFAULT_INFRA)
        if (data.lifecycle) {
          setLifecycleSteps(Object.values(data.lifecycle).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)))
        } else {
          setLifecycleSteps(DEFAULT_LIFECYCLE)
        }
      } else {
        setInfraData(DEFAULT_INFRA)
        setLifecycleSteps(DEFAULT_LIFECYCLE)
      }
      setIsLoading(false)
    })

    return () => {
      off(profileRef)
      off(settingsRef)
      off(coursesRef)
      off(infraRef)
    }
  }, [database, resolvedUid])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!database || !resolvedUid || isSubmitting) return
    setIsSubmitting(true)
    try {
      const dbPath = `Institutes/${resolvedUid}/website_inquiries`
      await push(ref(database, dbPath), { ...formData, submittedAt: new Date().toISOString(), status: "New" })
      setIsSubmitted(true)
    } catch (err) {
      console.error("Submission failed", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">Loading Campus Node...</p>
      </div>
    </div>
  )

  const publicContact = {
    phone: profile?.contactPhone || profile?.phone || settings?.contact?.phone || "",
    email: profile?.contactEmail || profile?.email || settings?.contact?.email || "",
    address: profile?.address || settings?.contact?.address || ""
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-primary/20" style={{ fontFamily: settings?.styling?.fontFamily || 'Poppins' }}>
      <header className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
        isScrolled ? "bg-white/90 backdrop-blur-xl shadow-xl py-3" : "bg-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href={`/sites/${id}`} className="flex items-center gap-3 hover:opacity-80 transition-all">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} className="h-12 w-auto" alt="Logo" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                  <School className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-zinc-900 hidden sm:block">
                  {profile?.instituteName || "INSTITUTE"}
                </h1>
              </>
            )}
          </Link>

           <nav className="hidden lg:flex gap-8 font-black uppercase text-[14px] tracking-widest text-zinc-600">
                     <Link href="#home">Home</Link>
                     <Link href="#about">About Us</Link>
                     <Link href="#courses">Courses</Link>
                     <Link href="/infrastructure">Facilities</Link>
                     <Link href="/gallery">Gallery</Link>
                     <Link href="#blog">Blogs</Link>
                     <Link href="#contact">Contact</Link>
                   </nav>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-zinc-200 text-zinc-700 rounded-full font-black text-[10px] uppercase px-8 h-11 shadow-sm hover:bg-zinc-50 border-none transition-all active:scale-95">
                  Login <ChevronDown className="ml-2 w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-0 border-zinc-100 shadow-2xl rounded-2xl overflow-hidden mt-4 bg-white">
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none border-b border-zinc-50">
                  <Link href="/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Admin Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none border-b border-zinc-50">
                  <Link href="/staff/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Staff Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none border-b border-zinc-50">
                  <Link href="/student/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Student Login</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="px-6 py-4 cursor-pointer focus:bg-zinc-50 rounded-none">
                  <Link href="/branch/login" className="text-sm font-bold text-zinc-700 uppercase tracking-tight">Branch Login</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(true); }} className="bg-primary hover:opacity-90 text-white rounded-full font-black text-[10px] uppercase px-8 h-11 shadow-lg border-none active:scale-95">
              Apply Now
            </Button>
          </div>
        </div>
      </header>

      <section className="relative pt-40 pb-32 bg-[#f8fafc] overflow-hidden min-h-[600px] flex items-center">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform origin-top-right translate-x-32 hidden lg:block" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <motion.div {...fadeIn} className="max-w-3xl space-y-8">
            <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">
              <Link href={`/sites/${id}`} className="hover:text-primary">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-zinc-900">Infrastructure</span>
            </nav>
            <h1 className="text-5xl lg:text-7xl font-black text-zinc-900 uppercase tracking-tight leading-[0.9]">
              {hero.title}
            </h1>
            <p className="text-lg font-medium text-zinc-500 leading-relaxed max-w-2xl italic">
              {hero.description}
            </p>
            <div className="pt-4">
              <Button onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(true); }} className="h-16 px-12 bg-primary text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl border-none active:scale-95">
                {hero.buttonText} <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
          <div className="text-center space-y-4">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1 font-black text-[10px] uppercase tracking-widest rounded-full">Core Facilities</Badge>
            <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight">Modern Academic Assets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {infraData.map((item, i) => (
              <motion.div key={item.id} {...fadeIn} transition={{ delay: i * 0.1 }}>
                <Card className="border-none shadow-xl rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-700 bg-white h-full flex flex-col">
                  <div className="h-64 relative overflow-hidden">
                    <img src={item.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={item.title} />
                  </div>
                  <div className="p-10 text-center space-y-6 flex-1">
                    <h4 className="text-2xl font-black uppercase tracking-tight text-zinc-800 leading-tight group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed px-4">{item.description}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#f8fafc] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 space-y-24">
          <div className="text-center space-y-4">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1 font-black text-[10px] uppercase tracking-widest rounded-full">Journey Roadmap</Badge>
            <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight">Your Academic Lifecycle</h2>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-zinc-200 -translate-x-1/2 hidden md:block" />
            <div className="space-y-20 relative z-10">
              {lifecycleSteps.map((step, i) => (
                <motion.div key={step.id || i} {...fadeIn} transition={{ delay: i * 0.1 }} className={cn("flex flex-col md:flex-row items-center gap-10", i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse")}>
                  <div className="flex-1 text-center md:text-right">{i % 2 === 0 ? <div className="space-y-3"><h4 className="text-xl font-black text-zinc-800 uppercase tracking-tight group-hover:text-primary transition-colors">{step.title}</h4><p className="text-sm text-zinc-400 font-medium leading-relaxed">{step.desc}</p></div> : null}</div>
                  <div className="w-16 h-16 rounded-full bg-primary shadow-xl flex items-center justify-center text-white border-4 border-white shrink-0 group hover:scale-110 transition-transform">{ICON_MAP[step.icon] || <CheckCircle2 className="w-6 h-6" />}</div>
                  <div className="flex-1 text-center md:text-left">{i % 2 !== 0 ? <div className="space-y-3"><h4 className="text-xl font-black text-zinc-800 uppercase tracking-tight group-hover:text-primary transition-colors">{step.title}</h4><p className="text-sm text-zinc-400 font-medium leading-relaxed">{step.desc}</p></div> : null}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 text-white pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 relative z-10">
          <div className="space-y-8">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} className="h-12 w-auto" alt="Logo" />
            ) : (
              <h3 className="text-2xl font-black uppercase tracking-tighter">Institute Node</h3>
            )}
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Developing professional excellence through industry-standard skill acquisition.</p>
            <div className="flex gap-4">
              {settings?.social?.facebook && <SocialBtn href={settings.social.facebook} icon={<Facebook className="w-4 h-4" />} />}
              {settings?.social?.twitter && <SocialBtn href={settings.social.twitter} icon={<Twitter className="w-4 h-4" />} />}
              {settings?.social?.linkedin && <SocialBtn href={settings.social.linkedin} icon={<Linkedin className="w-4 h-4" />} />}
              {settings?.social?.instagram && <SocialBtn href={settings.social.instagram} icon={<Instagram className="w-4 h-4" />} />}
              {settings?.social?.youtube && <SocialBtn href={settings.social.youtube} icon={<Youtube className="w-4 h-4" />} />}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-10 text-white">Quick Access</h4>
            <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-tight">
              <li><Link href={`/sites/${id}`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Home</Link></li>
              <li><Link href={`/sites/${id}#about`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> About Us</Link></li>
              <li><Link href={`/sites/${id}#courses`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Courses</Link></li>
              <li><Link href="#" className="text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Facilities</Link></li>
              <li><Link href={`/sites/${id}/gallery`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Gallery</Link></li>
              <li><Link href={`/sites/${id}#blog`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Blogs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-10 text-white">Contact Info</h4>
            <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-tight">
              <li className="flex items-center gap-3 font-public-sans text-white"><Phone className="w-4 h-4 text-primary" /> {publicContact.phone}</li>
              <li className="flex items-center gap-3 font-public-sans text-white"><Mail className="w-4 h-4 text-primary" /> {publicContact.email}</li>
              <li className="flex items-start gap-3 font-public-sans text-white"><MapPin className="w-4 h-4 text-primary shrink-0" /> {publicContact.address}</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">© {format(new Date(), "yyyy")} All Rights Reserved | {profile?.instituteName || "Your Institute"}</p>
        </div>
      </footer>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent className="max-w-[95vw] md:max-w-[500px] p-0 border-none rounded-[40px] overflow-hidden bg-white shadow-2xl [&_[data-radix-dialog-close]]:hidden focus:outline-none">
          <div className="bg-primary p-10 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border-none outline-none transition-all">
              <X className="h-6 w-6" />
            </DialogClose>
            <div className="space-y-4">
              <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase tracking-widest px-3">Admission Desk</Badge>
              <DialogTitle className="text-3xl font-black uppercase tracking-tight leading-none">Apply for Admission</DialogTitle>
              <p className="text-sm text-blue-100 font-medium">Start your academic journey with us today.</p>
            </div>
          </div>
          <ScrollArea className="max-h-[85vh]">
            <div className="p-10">
              {isSubmitted ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner"><CheckCircle2 className="w-12 h-12" /></div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">Inquiry Received</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed">We have received your application. Our counselor will contact you shortly.</p>
                  <Button onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(false); }} className="w-full h-12 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border-none">Close Window</Button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Full Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 shadow-inner font-bold text-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Mobile Number</Label>
                    <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})} required className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 shadow-inner font-bold text-black" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Select Program</Label>
                    <Select value={formData.course} onValueChange={val => setFormData({...formData, course: val})} required>
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 shadow-inner font-bold text-black"><SelectValue placeholder="Choose a course..." /></SelectTrigger>
                      <SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Additional Notes</Label>
                    <Textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} placeholder="Ask about timings, fees, etc." className="rounded-2xl bg-zinc-50 border-zinc-100 min-h-[120px] text-black font-medium" />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl border-none active:scale-95 transition-all border-none">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Send Inquiry
                  </Button>
                </form>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SocialBtn({ icon, href }: { icon: any, href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-primary hover:text-white transition-all border-none outline-none">
      {icon}
    </a>
  )
}
