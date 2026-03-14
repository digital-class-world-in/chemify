
"use client"

import { useState, useEffect, useMemo, useRef, use } from "react"
import { useFirebase, useUser, useTranslation } from "@/firebase"
import { ref, onValue, off, push, set, increment, update as dbUpdate, get } from "firebase/database"
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useInView } from "framer-motion"
import { 
  GraduationCap, 
  ArrowRight, 
  Play, 
  Star, 
  Users, 
  BookOpen, 
  Award, 
  Calendar, 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram,
  CheckCircle2,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  Sparkles,
  FileText,
  ShieldCheck,
  TrendingUp,
  Monitor,
  Check,
  Send,
  UserCheck,
  Image as ImageIcon,
  Rocket,
  Target,
  Trophy,
  Globe,
  Briefcase,
  Zap,
  Building2,
  School,
  XCircle,
  AlertCircle,
  MessageSquare,
  HelpCircle,
  Download,
  Search,
  Users2,
  Heart,
  Cpu,
  Laptop,
  Code,
  PieChart,
  Headset,
  BookMarked,
  Eye,
  Layers,
  Loader2,
  Newspaper,
  Languages,
  Timer,
  CreditCard,
  Smartphone,
  Compass,
  Youtube,
  Quote,
  ChevronDown,
  User,
  ClipboardList,
  Wallet,
  UserPlus,
  Receipt,
  Megaphone,
  Video
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useEmblaCarousel from "embla-carousel-react"
import { format, parseISO } from "date-fns"

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
}

const DEFAULT_BLOGS = [
  {
    id: 'b1',
    title: "Top Career Options After 12th in 2026",
    category: "Career Guidance",
    image: "https://picsum.photos/seed/edu1/600/400",
    description: "Discover the most high-paying and stable career paths for students finishing their high school education this year.",
    author: "Academic Board",
    date: "Feb 15, 2024",
    readTime: "5 min",
    slug: "top-career-options-after-12th"
  },
  {
    id: 'b2',
    title: "Why Skill-Based Education Is Important",
    category: "Education Trends",
    image: "https://picsum.photos/seed/edu2/600/400",
    description: "Moving beyond degrees: how practical skills are becoming the new global currency in the job market.",
    author: "Dr. R. Sharma",
    date: "Feb 12, 2024",
    readTime: "8 min",
    slug: "importance-of-skill-based-education"
  }
]

const DEFAULT_STATS = [
  { id: 'def-1', label: "Years", value: 19, suffix: "+", subLabel: "of Legacy", icon: 'Award', color: 'bg-amber-50 border-amber-100' },
  { id: 'def-2', label: "Students", value: 10, suffix: " Lakh+", subLabel: "Nurtured", icon: 'Users', color: 'bg-blue-50 border-blue-100' },
  { id: 'def-3', label: "Centers", value: 80, suffix: "+", subLabel: "Across India", icon: 'Building2', color: 'bg-emerald-50 border-emerald-100' },
  { id: 'def-4', label: "Downloads", value: 10, suffix: " Lakh+", subLabel: "App Downloads", icon: 'Smartphone', color: 'bg-purple-50 border-purple-100' },
]

const STAT_ICONS: Record<string, any> = {
  Award: Award,
  Users: Users,
  Building2: Building2,
  Smartphone: Smartphone,
  GraduationCap: GraduationCap,
  Trophy: Trophy,
  Zap: Zap
}

export default function InstitutePublicWebsite({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { database } = useFirebase()
  
  const [resolvedUid, setResolvedUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  
  const [courses, setCourses] = useState<any[]>([])
  const [blogs, setBlogs] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    course: "",
    message: ""
  })

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 })

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

    // Analytics update (One-time)
    const analyticsRef = ref(database, `${rootPath}/analytics`)
    dbUpdate(analyticsRef, {
      websiteVisitors: increment(1)
    }).catch(err => console.error("Analytics error:", err))

    // Profile Listener
    const profileRef = ref(database, `${rootPath}/profile`)
    const unsubProfile = onValue(profileRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setProfile(data)
        setInstituteName(data.instituteName || "Your Institute")
      }
    })

    // Website Settings Listener
    const settingsRef = ref(database, `${rootPath}/website_settings`)
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) setSettings(snapshot.val())
      setIsLoading(false)
    })

    // Courses Listener
    const coursesRef = ref(database, `${rootPath}/website_courses`)
    const unsubCourses = onValue(coursesRef, (s) => {
      const data = s.val() || {}
      const list = Object.keys(data)
        .map(k => ({ ...data[k], id: k }))
        .filter(c => c.status !== 'Draft')
      setCourses(list)
    })

    // Blogs Listener
    const blogsRef = ref(database, `${rootPath}/website_blogs`)
    const unsubBlogs = onValue(blogsRef, (s) => {
      const data = s.val() || {}
      const list = Object.keys(data).map(k => ({ ...data[k], id: k }))
      setBlogs(list.length > 0 ? list.reverse() : DEFAULT_BLOGS)
    })

    // Visitors Analytics (Counter)
    const visitorsRef = ref(database, `${rootPath}/analytics/websiteVisitors`)
    const unsubVisitors = onValue(visitorsRef, (snapshot) => {
      // Logic for total visitors if needed globally
    })

    // Cleanup all listeners on unmount or re-resolve
    return () => {
      off(profileRef)
      off(settingsRef)
      off(coursesRef)
      off(blogsRef)
      off(visitorsRef)
    }
  }, [database, resolvedUid])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!database || !resolvedUid || isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const dbPath = `Institutes/${resolvedUid}/website_inquiries`
      await push(ref(database, dbPath), {
        ...formData,
        submittedAt: new Date().toISOString(),
        status: "New"
      })
      setIsSubmitted(true)
    } catch (err) {
      console.error("Submission failed", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !settings) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">Connecting...</p>
      </div>
    </div>
  )

  const sectionPadding = {
    paddingTop: `${settings.styling?.sectionSpacing || 120}px`,
    paddingBottom: `${settings.styling?.sectionSpacing || 120}px`
  }

  const setInstituteName = (name: string) => {
    // Local helper to avoid direct profile mutation
  }

  const publicContact = {
    phone: profile?.contactPhone || profile?.phone || settings.contact?.phone || "",
    email: profile?.contactEmail || profile?.email || settings.contact?.email || "",
    address: profile?.address || settings.contact?.address || ""
  }

  const heroTitleStyle = {
    fontSize: `${settings.styling?.titleFontSize || 64}px`,
    fontFamily: settings.styling?.heroTitleFontFamily ? `'${settings.styling.heroTitleFontFamily}', sans-serif` : 'inherit'
  }

  const heroDescStyle = {
    fontSize: `${settings.styling?.descFontSize || 18}px`,
    fontFamily: settings.styling?.heroDescFontFamily ? `'${settings.styling.heroDescFontFamily}', sans-serif` : 'inherit'
  }

  const sliderWidthStyle = {
    width: `${settings.styling?.sliderWidth || 100}%`,
    height: `${settings.styling?.sliderHeight || 550}px`,
    marginTop: `${settings.styling?.sliderMarginTop || 0}px`,
    marginBottom: `${settings.styling?.sliderMarginBottom || 0}px`,
    marginLeft: `${settings.styling?.sliderMarginLeft || 0}px`,
    marginRight: `${settings.styling?.sliderMarginRight || 0}px`
  }

  const displayedStats = settings.stats?.length > 0 ? settings.stats : DEFAULT_STATS

  return (
    <div className="min-h-screen bg-white overflow-x-hidden selection:bg-primary/20" style={{ fontFamily: settings.styling?.fontFamily || 'Poppins' }}>
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
            <Link href="#home" className="hover:text-primary transition-colors">Home</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="#courses" className="hover:text-primary transition-colors">Courses</Link>
            <Link href={`/sites/${id}/infrastructure`} className="hover:text-primary transition-colors">Facilities</Link>
            <Link href={`/sites/${id}/gallery`} className="hover:text-primary transition-colors">Gallery</Link>
            <Link href="#blog" className="hover:text-primary transition-colors">Blogs</Link>
            <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
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
              Enquiry Now
            </Button>
          </div>
        </div>
      </header>

      {settings.visibility?.hero !== false && (
        <section
          id="home"
          className="relative flex items-center bg-[#f8fafc] overflow-hidden"
          style={{ minHeight: `${settings.styling?.heroImageHeight || 600}px` }}
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform origin-top-right translate-x-32 hidden lg:block" />

          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full relative z-10 pt-12 lg:pt-16">
            <motion.div {...fadeIn} className="space-y-6 lg:space-y-8">
              <h1
                className="font-black leading-[1.1] tracking-tight text-zinc-900"
                style={heroTitleStyle}
              >
                {settings.hero?.title}
              </h1>

              <p
                className="text-base lg:text-lg font-medium leading-relaxed max-w-xl text-zinc-600"
                style={heroDescStyle}
              >
                {settings.hero?.description}
              </p>

              <div className="flex flex-wrap gap-4 pt-2 lg:pt-4">
                <Button
                  onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                  className="
                    h-12 lg:h-14 px-8 lg:px-12
                    bg-primary hover:opacity-90 text-white
                    rounded-xl lg:rounded-2xl
                    font-black uppercase text-sm lg:text-[14px]
                    tracking-widest shadow-xl lg:shadow-2xl
                    border-none transition-all active:scale-95
                  "
                >
                  {settings.hero?.buttonText || "View Courses"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>

            <motion.div
              {...fadeIn}
              transition={{ delay: 0.3 }}
              className="relative hidden lg:flex items-center justify-end"
              style={sliderWidthStyle}
            >
              <VarietySlider
                slides={settings.hero?.slides}
                height={settings.styling?.sliderHeight || 500}
              />
            </motion.div>
          </div>
        </section>
      )}

      {settings.visibility?.courses !== false && (
        <section id="courses" style={sectionPadding} className="bg-zinc-100 -mt-16 lg:-mt-24">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 space-y-6 lg:space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight">Popular Courses</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
              {courses.filter((c) => c.showOnHomepage && c.status !== 'Draft').map((course, i) => (
                <motion.div key={i} {...fadeIn} transition={{ delay: i * 0.06 }}>
                  <DetailedCourseCard course={course} instId={id} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.visibility?.stats !== false && (
        <section className="bg-white border-y border-zinc-100 overflow-hidden py-0 pb-0">
          <div className="max-w-7xl mx-auto px-5 sm:px-6 space-y-6 lg:space-y-8 pb-0">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-public-sans leading-tight tracking-tight pt-8 lg:pt-12"
                style={{
                  color: settings.milestoneHeading?.color || "#000000",
                  fontFamily: settings.milestoneHeading?.fontFamily ? `'${settings.milestoneHeading.fontFamily}', sans-serif` : 'inherit',
                }}
              >
                {settings.milestoneHeading?.text || "Our institutional impact & global reach"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6 pb-10">
              {displayedStats.map((stat: any, i: number) => {
                const bgColors = ['bg-amber-50 border-amber-100', 'bg-blue-50 border-blue-100', 'bg-emerald-50 border-emerald-100', 'bg-purple-50 border-purple-100'];
                const IconComp = STAT_ICONS[stat.icon] || STAT_ICONS[DEFAULT_STATS[i % 4].icon];
                return (
                  <motion.div key={stat.id || i} {...fadeIn} transition={{ delay: i * 0.07 }}>
                    <Card className={cn("border shadow-sm rounded-xl p-4 lg:p-5 flex flex-col items-center justify-center text-center transition-all duration-400 hover:shadow-xl hover:-translate-y-1.5", stat.color || bgColors[i % 4])}>
                      <div className="mb-3 p-2.5 bg-white rounded-lg shadow-sm"><IconComp className="w-5 h-5 text-primary" /></div>
                      <div className="space-y-1 text-center">
                        <h4 className="text-2xl lg:text-3xl xl:text-4xl font-black text-primary tracking-tight leading-none flex items-center justify-center gap-1">
                          <AnimatedCounter value={stat.value} />
                          <span className="text-lg lg:text-xl font-black text-primary">{stat.suffix}</span>
                        </h4>
                        <p className="text-sm lg:text-base font-semibold text-zinc-800 uppercase tracking-tight">{stat.label}</p>
                        {stat.subLabel && <p className="text-[10px] lg:text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.subLabel}</p>}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {settings.visibility?.about !== false && (
        <section id="about" style={{ ...sectionPadding, paddingTop: '60px' }} className="bg-zinc-50">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <motion.div {...fadeIn} className="relative group lg:sticky lg:top-32">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-8 border-zinc-100">
                <img src={settings.about?.imageUrl || "https://picsum.photos/seed/about-main/800/1000"} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Institute" />
              </div>
              {settings.about?.rankingTitle && (
                <div className="absolute -bottom-6 -right-6 bg-primary p-8 rounded-3xl text-white shadow-2xl animate-in zoom-in-50 duration-700">
                  <div className="flex items-center gap-4">
                    <Trophy className="w-10 h-10 text-white/40" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Achievement</p>
                      <h4 className="text-lg font-black uppercase tracking-tight">{settings.about.rankingTitle}</h4>
                      <p className="text-xs font-medium text-white/80">{settings.about.rankingSubtitle}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[10px] px-4 tracking-widest rounded-full">{settings.about?.badge || 'Institutional Overview'}</Badge>
                <h2 className="text-4xl lg:text-6xl font-black text-zinc-900 uppercase tracking-tight leading-[0.9]">{settings.about?.title || 'Pioneering Academic Excellence'}</h2>
              </div>
              <div className="space-y-6 text-zinc-500 text-lg leading-relaxed font-medium">
                <p>{settings.about?.description1}</p>
                <p>{settings.about?.description2}</p>
              </div>
              {settings.about?.mission?.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-zinc-800 uppercase tracking-tight flex items-center gap-3">
                    <Target className="w-6 h-6 text-primary" /> Our Core Mission
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {settings.about.mission.map((m: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white shadow-sm border border-zinc-50">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-sm font-bold text-zinc-600 leading-tight">{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {settings.visibility?.blog !== false && (
        <section id="blog" style={sectionPadding} className="bg-zinc-100">
          <div className="max-w-7xl mx-auto px-6 space-y-16">
            <div className="text-center space-y-4">
              <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-widest rounded-full">Latest Insights</Badge>
              <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight leading-tight">Our Educational Blogs & Guidance</h2>
            </div>
            <div className="relative group px-12">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex -ml-8">
                  {blogs.map((blog, i) => (
                    <div key={blog.id || i} className="flex-[0_0_100%] min-w-0 pl-8 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                      <Link href={`/sites/${id}/blog/${blog.id}`} className="block h-full group">
                        <Card className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group h-full flex flex-col">
                          <div className="h-60 rounded-2xl overflow-hidden relative">
                            <img src={blog.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={blog.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/60 to-transparent" />
                            <Badge className="absolute top-6 left-6 bg-white/90 text-zinc-900 border-none font-black text-[8px] uppercase px-3 rounded-full">{blog.category}</Badge>
                          </div>
                          <div className="p-8 space-y-6 flex-1 flex flex-col">
                            <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-primary transition-colors">{blog.title}</h4>
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed line-clamp-3">{blog.description}</p>
                            <div className="pt-6 border-t border-zinc-50 flex items-center justify-between mt-auto text-[10px] font-black uppercase tracking-widest text-zinc-300">
                              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {blog.date}</span>
                              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {blog.readTime || '5 min'}</span>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => emblaApi?.scrollPrev()} className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-zinc-400 hover:text-primary z-20 border-none"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={() => emblaApi?.scrollNext()} className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-zinc-400 hover:text-primary z-20 border-none"><ChevronRight className="w-6 h-6" /></button>
            </div>
          </div>
        </section>
      )}

      {settings.visibility?.testimonials !== false && settings.testimonials?.length > 0 && (
        <section id="testimonials" style={sectionPadding} className="bg-white overflow-hidden py-20">
          <div className="max-w-7xl mx-auto px-6 mb-16 text-center space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight">Testimonials!</h2>
          </div>
          
          <div className="flex flex-col gap-8">
            <div className="relative flex overflow-x-hidden">
              <motion.div 
                animate={{ x: [0, -1920] }} 
                transition={{ ease: "linear", duration: 40, repeat: Infinity }}
                className="flex gap-8 whitespace-nowrap"
              >
                {[...settings.testimonials, ...settings.testimonials].map((t, i) => (
                  <TestimonialCard key={i} t={t} />
                ))}
              </motion.div>
            </div>

            <div className="relative flex overflow-x-hidden">
              <motion.div 
                animate={{ x: [-1920, 0] }} 
                transition={{ ease: "linear", duration: 40, repeat: Infinity }}
                className="flex gap-8 whitespace-nowrap"
              >
                {[...settings.testimonials, ...settings.testimonials].map((t, i) => (
                  <TestimonialCard key={i} t={t} />
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {settings.visibility?.contact !== false && (
        <section id="contact" style={sectionPadding} className="bg-[#f8fafc]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
              <motion.div {...fadeIn} className="lg:col-span-5 space-y-12">
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-widest rounded-full">Admission Desk</Badge>
                  <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight">Let's Connect</h2>
                  <p className="text-zinc-500 font-medium leading-relaxed">Reach out to our expert counselors for personalized career guidance and admission support.</p>
                </div>
                <div className="space-y-6">
                  <ContactCard icon={<Phone className="w-6 h-6 text-primary" />} label="Phone Inquiries" value={publicContact.phone} />
                  <ContactCard icon={<Mail className="w-6 h-6 text-primary" />} label="Email Support" value={publicContact.email} />
                  <ContactCard icon={<MapPin className="w-6 h-6 text-primary" />} label="Campus Address" value={publicContact.address} />
                </div>
              </motion.div>

              <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="lg:col-span-7">
                <Card className="border-none shadow-2xl rounded-2xl bg-white p-12 lg:p-16 relative overflow-hidden">
                  {isSubmitted ? (
                    <div className="py-20 text-center space-y-8 animate-in zoom-in duration-500">
                      <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                        <CheckCircle2 className="w-12 h-12" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-3xl font-black text-zinc-800 uppercase tracking-tight">Thank You!</h3>
                        <p className="text-zinc-500 font-medium leading-relaxed max-sm mx-auto">Your inquiry has been received. Our counselor will contact you within 24 business hours.</p>
                      </div>
                      <button onClick={() => setIsSubmitted(false)} className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border border-zinc-100 hover:bg-zinc-50 transition-all bg-transparent">Submit Another Inquiry</button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-8 relative z-10">
                        <h3 className="text-3xl font-black text-zinc-800 uppercase tracking-tight">Send Inquiry</h3>
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Full Name</Label>
                              <Input 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required 
                                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 shadow-inner font-medium" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Mobile Number</Label>
                              <Input 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10)})}
                                required 
                                className="h-14 rounded-2xl border-zinc-100 bg-zinc-50/50 shadow-inner font-medium" 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Program of Interest</Label>
                            <Select value={formData.course} onValueChange={(val) => setFormData({...formData, course: val})}>
                              <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 shadow-inner font-medium">
                                <SelectValue placeholder="Select a course" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Message / Questions</Label>
                            <Textarea 
                              value={formData.message} 
                              onChange={(e) => setFormData({...formData, message: e.target.value})}
                              required 
                              className="rounded-3xl border-zinc-100 bg-zinc-50 focus-visible:ring-primary shadow-inner min-h-[150px] p-6 font-medium" 
                            />
                          </div>
                          <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-teal-900/20 active:scale-95 transition-all border-none">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Submit Request
                          </Button>
                        </form>
                      </div>
                      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                        <Sparkles className="w-48 h-48 text-primary" />
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      <footer className="bg-zinc-950 text-white pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 relative z-10">
          <div className="space-y-8">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} className="h-12 w-auto" alt="Logo" />
            ) : (
              <h3 className="text-2xl font-black uppercase tracking-tighter">Institute<span className="text-primary">Node</span></h3>
            )}
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">Developing professional excellence through industry-standard skill acquisition.</p>
            <div className="flex gap-4">
              {settings.social?.facebook && <SocialBtn href={settings.social.facebook} icon={<Facebook className="w-4 h-4" />} />}
              {settings.social?.twitter && <SocialBtn href={settings.social.twitter} icon={<Twitter className="w-4 h-4" />} />}
              {settings.social?.linkedin && <SocialBtn href={settings.social.linkedin} icon={<Linkedin className="w-4 h-4" />} />}
              {settings.social?.instagram && <SocialBtn href={settings.social.instagram} icon={<Instagram className="w-4 h-4" />} />}
              {settings.social?.youtube && <SocialBtn href={settings.social.youtube} icon={<Youtube className="w-4 h-4" />} />}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-10 text-white">Quick Access</h4>
            <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-tight">
              <li><Link href="#home" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Home</Link></li>
              <li><Link href="#about" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> About Us</Link></li>
              <li><Link href={`/sites/${id}/infrastructure`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Facilities</Link></li>
              <li><Link href={`/sites/${id}/gallery`} className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Gallery</Link></li>
              <li><Link href="#blog" className="hover:text-primary transition-colors flex items-center gap-2"><ChevronRight className="w-3 h-3" /> Blogs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-black uppercase tracking-widest mb-10 text-white">Contact Info</h4>
            <ul className="space-y-4 text-zinc-500 text-xs font-bold uppercase tracking-tight">
              <li className="flex items-center gap-3"><Phone className="w-4 h-4 text-primary" /> {publicContact.phone}</li>
              <li className="flex items-center gap-3"><Mail className="w-4 h-4 text-primary" /> {publicContact.email}</li>
              <li className="flex items-start gap-3"><MapPin className="w-4 h-4 text-primary shrink-0" /> {publicContact.address}</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">© {format(new Date(), "yyyy")} All Rights Reserved | {profile?.instituteName || "Your Institute"}</p>
        </div>
      </footer>

      <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
        <DialogContent
          className="
            max-w-[95vw] md:max-w-[500px]
            p-0 gap-0
            border-none rounded-[32px]
            overflow-hidden shadow-2xl bg-white
            [&_[data-radix-dialog-close]]:hidden
            focus:outline-none
          "
        >
          <div className="relative bg-primary px-10 py-10 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            <DialogClose className="absolute right-6 top-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white border-none outline-none transition-all">
              <X className="h-6 w-6" />
            </DialogClose>
            <div className="space-y-2.5">
              <DialogTitle className="text-3xl font-black tracking-tight leading-tight uppercase">Submit Inquiry</DialogTitle>
              <p className="text-sm text-white/90 font-medium leading-relaxed">Our counselors will review your inquiry and get back to you within 24 business hours.</p>
            </div>
          </div>

          <ScrollArea className="max-h-[70vh]">
            <div className="p-10">
              {isSubmitted ? (
                <div className="py-10 text-center space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-zinc-800 uppercase tracking-tight">Thank You!</h3>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">Your application has been received. Our counselor will contact you shortly.</p>
                  </div>
                  <Button onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(false); }} className="h-12 px-10 bg-zinc-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border-none">Close Window</Button>
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
                      <SelectTrigger className="h-14 rounded-2xl border-zinc-100 bg-zinc-50 shadow-inner font-bold text-black">
                        <SelectValue placeholder="Choose a program..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-zinc-100 shadow-2xl">
                        {courses.map(c => <SelectItem key={c.id} value={c.name} className="rounded-xl font-bold">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">Message (Optional)</Label>
                    <Textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="rounded-2xl bg-zinc-50 border-zinc-100 min-h-[120px] text-black font-medium" placeholder="Ask about timings, fees, etc." />
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-900/20 active:scale-95 transition-all border-none">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Submit Application
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

function VarietySlider({ slides, height }: { slides: any[], height: number }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  useEffect(() => { if (!emblaApi) return; const timer = setInterval(() => { emblaApi.scrollNext() }, 4000); return () => clearInterval(timer) }, [emblaApi])
  const placeholders = ["https://picsum.photos/seed/academic1/800/1000", "https://picsum.photos/seed/lab2/800/1000"]
  const displaySlides = slides?.length > 0 ? slides : placeholders.map(url => ({ imageUrl: url }))
  return (
    <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ height: `${height}px`, width: '100%' }} ref={emblaRef}>
      <div className="flex h-full">
        {displaySlides.map((s: any, i: number) => (
          <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
            <img src={s.imageUrl} className="w-full h-full object-cover" alt="Slide" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/20 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailedCourseCard({ course, instId }: any) {
  const discountVal = (Number(course.originalPrice) && Number(course.sellingPrice) && Number(course.originalPrice) > Number(course.sellingPrice)) 
    ? Math.round(((Number(course.originalPrice) - Number(course.sellingPrice)) / Number(course.originalPrice)) * 100) 
    : 0;

  return (
    <Link href={`/sites/${instId}/course/${course.id}`} className="block h-full group">
      <Card className="border-2 border-zinc-200 shadow-sm rounded-2xl overflow-hidden group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-500 flex flex-col h-full bg-white relative">
        <div className={cn(
          "absolute top-0 left-0 w-24 h-24 overflow-hidden z-20 pointer-events-none",
          "before:content-[attr(data-label)] before:absolute before:top-4 before:-left-8 before:w-[140px] before:py-1",
          "before:text-[9px] before:font-black before:text-white before:text-center before:uppercase before:tracking-widest before:-rotate-45",
          course.type === 'Online' ? "before:bg-blue-600" : "before:bg-rose-600"
        )} data-label={course.type} />

        <div className="h-48 relative overflow-hidden">
          <img src={course.image || `https://picsum.photos/seed/${course.name}/600/400`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt={course.name} />
        </div>
        <CardContent className="p-6 flex flex-col justify-between flex-1">
          <div className="space-y-2">
            <p className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">{course.duration || '0'} Months • {course.totalChapters || '0'} Chapters</p>
            <h4 className="text-lg font-black text-zinc-800 uppercase tracking-tight group-hover:text-primary transition-colors leading-tight">{course.name}</h4>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed line-clamp-2">{course.description}</p>
          </div>
          <div className="pt-3 flex flex-col gap-3 mt-3 border-t border-zinc-50">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-zinc-900 font-public-sans tracking-tight">₹ {Number(course.sellingPrice || course.price).toLocaleString()}</span>
              {course.originalPrice && (
                <span className="text-sm font-bold text-zinc-400 line-through tracking-tight">₹ {Number(course.originalPrice).toLocaleString()}</span>
              )}
              {discountVal > 0 && (
                <Badge className="bg-[#FF7A1A] text-white border-none text-[9px] font-black uppercase px-2 py-1 rounded-lg">{discountVal}% off</Badge>
              )}
            </div>
            <Button className="w-full h-10 bg-primary text-white rounded-xl font-black uppercase text-[9px] tracking-widest border-none shadow-md active:scale-95 transition-all">
              View More
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function TestimonialCard({ t }: { t: any }) {
  return (
    <div className="min-w-[450px] p-8 rounded-[32px] bg-white border border-zinc-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-zinc-50 shadow-inner shrink-0 bg-zinc-100">
            <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <h5 className="font-black text-zinc-800 uppercase tracking-tight leading-none mb-1">{t.name}</h5>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{t.role}</p>
          </div>
        </div>
        <Quote className="w-10 h-10 text-primary opacity-10 transform rotate-180" />
      </div>
      <p className="text-[15px] text-zinc-500 font-medium leading-relaxed whitespace-normal line-clamp-4">
        {t.message}
      </p>
    </div>
  )
}

function ContactCard({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-6 p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm group hover:shadow-md transition-all">
      <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
        {icon}
      </div>
      <div className="font-public-sans">
        <p className="text-[11px] font-bold text-black uppercase tracking-widest mb-0.5">
          {label}
        </p>
        <p className="text-sm font-bold text-zinc-700 uppercase">
          {value || '-'}
        </p>
      </div>
    </div>
  )
}

function SocialBtn({ icon, href }: { icon: any, href: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-primary hover:text-white transition-all border-none outline-none"
    >
      {icon}
    </a>
  )
}

function AnimatedCounter({ value, duration = 2 }: { value: number, duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, { duration })
      return controls.stop
    }
  }, [value, duration, inView, count])

  return <motion.span ref={ref}>{rounded}</motion.span>
}
