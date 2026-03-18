"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { useFirebase } from "@/firebase"
import {
  ref,
  onValue,
  push,
  increment,
  update as dbUpdate,
  get,
} from "firebase/database"
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  useInView,
} from "framer-motion"
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  Clock,
  Trophy,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  CheckCircle2,
  Loader2,
  X,
  Users,
  Award,
  Calendar,
  ChevronDown,
  Building2,
  Smartphone,
  Zap,
} from "lucide-react"
import Link from "next/link"
import Head from "next/head"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import useEmblaCarousel from "embla-carousel-react"
import { format } from "date-fns"

// ─── ANIMATIONS ──────────────────────────────────────────────────
const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: "easeOut" }
}

// ─── DEFAULT / FALLBACK DATA ──────────────────────────────────────
const DEFAULT_HERO = {
  title: "Your Bright Future Begins Here",
  description: "Expert guidance • Proven results • Personalized mentoring • 18+ years of excellence in competitive exam preparation",
  buttonText: "Explore All Courses",
  slides: [
    { imageUrl: "https://placehold.co/800x1000/3b82f6/ffffff/png?text=Hero+Slide+1" },
    { imageUrl: "https://placehold.co/800x1000/8b5cf6/ffffff/png?text=Hero+Slide+2" },
    { imageUrl: "https://placehold.co/800x1000/ec4899/ffffff/png?text=Hero+Slide+3" },
  ]
}

const DEFAULT_ABOUT = {
  badge: "Who We Are",
  title: "Empowering Students Since 2008",
  description1: "We don't just teach — we build strong foundations, exam temperament, discipline, and unshakable confidence.",
  description2: "With systematic teaching methods, weekly performance tracking, individual attention, and a motivating environment, our students consistently secure top ranks in JEE, NEET, GUJCET & Boards.",
  imageUrl: "https://placehold.co/800x1000/10b981/ffffff/png?text=About+Us+Campus"
}

const DEFAULT_BLOGS = [
  {
    id: 'b1',
    title: "How to Score 300+ in JEE Main Physics in 2026",
    category: "JEE Strategy",
    image: "https://placehold.co/600x400/3b82f6/ffffff/png?text=JEE+Physics+2026",
    description: "Chapter-wise weightage, best books, daily routine, important formulas & last 3 months revision plan...",
    date: "March 10, 2026",
    readTime: "8 min",
  },
  {
    id: 'b2',
    title: "NEET Biology – 350+ in 90 Days Strategy",
    category: "NEET Tips",
    image: "https://placehold.co/600x400/10b981/ffffff/png?text=NEET+Biology+90+Days",
    description: "High-yield chapters, diagram tricks, NCERT line-by-line strategy, previous year trends...",
    date: "March 05, 2026",
    readTime: "7 min",
  },
  {
    id: 'b3',
    title: "How to Balance Boards + Entrance Exams in Class 12",
    category: "Time Management",
    image: "https://placehold.co/600x400/ec4899/ffffff/png?text=Balance+Class+12",
    description: "Smart timetable, avoiding burnout, best study hours, revision techniques used by toppers...",
    date: "Feb 28, 2026",
    readTime: "6 min",
  }
]

const DEFAULT_COURSES = [
  {
    id: 'c1',
    name: "2-Year Integrated JEE + Boards (Class 11)",
    description: "Strong foundation + advanced problem solving + weekly tests + DPPs + doubt resolution + performance analysis.",
    image: "https://placehold.co/600x400/3b82f6/ffffff/png?text=2+Year+JEE",
    type: "Long Term",
    sellingPrice: 98000,
    originalPrice: 125000,
    showOnHomepage: true,
    status: "Published"
  },
  {
    id: 'c2',
    name: "1-Year NEET Crash Course (Class 12 / Droppers)",
    description: "Intensive revision + 50+ full mocks + daily practice + error analysis + personal mentoring.",
    image: "https://placehold.co/600x400/10b981/ffffff/png?text=NEET+Crash",
    type: "Crash Course",
    sellingPrice: 68000,
    originalPrice: 90000,
    showOnHomepage: true,
    status: "Published"
  },
  {
    id: 'c3',
    name: "Foundation + Olympiad Batch (Class 9 & 10)",
    description: "NTSE, Olympiads, Maths & Science foundation for future JEE/NEET preparation.",
    image: "https://placehold.co/600x400/ec4899/ffffff/png?text=Foundation+9-10",
    type: "Foundation",
    sellingPrice: 52000,
    originalPrice: 68000,
    showOnHomepage: true,
    status: "Published"
  }
]

const DEFAULT_TESTIMONIALS = [
  {
    name: "Rahul Sharma",
    role: "JEE Advanced 2025 – AIR 142",
    message: "The regular tests, detailed analysis, and 24/7 doubt support helped me improve my rank dramatically. Best decision ever!",
    image: null
  },
  {
    name: "Sneha Patel",
    role: "NEET 2025 – 692/720",
    message: "Biology concepts became crystal clear with amazing faculty and revision tricks. Truly grateful!",
    image: null
  },
  {
    name: "Aryan Desai",
    role: "Gujarat Board Topper – 99.1%",
    message: "Weekly performance tracking and personal mentoring made all the difference. Highly recommended!",
    image: null
  }
]

const DEFAULT_STATS = [
  { id: 's1', label: "Years", value: 18, suffix: "+", subLabel: "of Excellence", icon: 'Award', color: 'bg-amber-50 border-amber-100' },
  { id: 's2', label: "Students", value: 85000, suffix: "+", subLabel: "Guided Successfully", icon: 'Users', color: 'bg-blue-50 border-blue-100' },
  { id: 's3', label: "Success Rate", value: 91, suffix: "%", subLabel: "in Top Exams", icon: 'Trophy', color: 'bg-emerald-50 border-emerald-100' },
  { id: 's4', label: "Faculty", value: 65, suffix: "+", subLabel: "Expert Mentors", icon: 'GraduationCap', color: 'bg-purple-50 border-purple-100' },
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

export default function InstitutePublicWebsite() {
  const slug = process.env.NEXT_PUBLIC_DB_SLUG || ""

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

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    slidesToScroll: 1,
    containScroll: 'trimSnaps'
  })

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!database || !slug) return
    get(ref(database, `Slugs/${slug}`))
      .then((snapshot) => {
        const uid = snapshot.val() || slug
        setResolvedUid(uid)
      })
      .catch(() => setResolvedUid(slug))
  }, [database, slug])

  useEffect(() => {
    if (!database || !resolvedUid) return

    const rootPath = `Institutes/${resolvedUid}`

    dbUpdate(ref(database, `${rootPath}/analytics`), {
      websiteVisitors: increment(1)
    }).catch(console.error)

    const unsubs: Array<() => void> = []

    unsubs.push(
      onValue(ref(database, `${rootPath}/profile`), (snap) => {
        if (snap.exists()) setProfile(snap.val())
      })
    )

    unsubs.push(
      onValue(ref(database, `${rootPath}/website_settings`), (snap) => {
        if (snap.exists()) setSettings(snap.val())
        setIsLoading(false)
      })
    )

    unsubs.push(
      onValue(ref(database, `${rootPath}/website_courses`), (snap) => {
        const data = snap.val() || {}
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ ...val, id }))
          .filter(c => c.status !== 'Draft')
        setCourses(list)
      })
    )

    unsubs.push(
      onValue(ref(database, `${rootPath}/website_blogs`), (snap) => {
        const data = snap.val() || {}
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ ...val, id }))
        setBlogs(list.length > 0 ? list.reverse() : DEFAULT_BLOGS)
      })
    )

    return () => unsubs.forEach(fn => fn())
  }, [database, resolvedUid])

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!database || !resolvedUid || isSubmitting) return

    setIsSubmitting(true)
    try {
      await push(ref(database, `Institutes/${resolvedUid}/website_inquiries`), {
        ...formData,
        submittedAt: new Date().toISOString(),
        status: "New"
      })
      setIsSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-[0.3em]">Loading...</p>
        </div>
      </div>
    )
  }

  const sectionPadding = {
    paddingTop: `${settings.styling?.sectionSpacing ?? 120}px`,
    paddingBottom: `${settings.styling?.sectionSpacing ?? 120}px`
  }

  const displayedHero = {
    ...DEFAULT_HERO,
    ...(settings.hero || {})
  }

  const displayedAbout = {
    ...DEFAULT_ABOUT,
    ...(settings.about || {})
  }

  const displayedStats = settings.stats?.length > 0 ? settings.stats : DEFAULT_STATS
  const displayedCourses = courses.length > 0 ? courses : DEFAULT_COURSES
  const displayedBlogs = blogs.length > 0 ? blogs : DEFAULT_BLOGS
  const displayedTestimonials = settings.testimonials?.length > 0 ? settings.testimonials : DEFAULT_TESTIMONIALS

  const publicContact = {
    phone: profile?.contactPhone || profile?.phone || settings.contact?.phone || "+91 98765 43210",
    email: profile?.contactEmail || profile?.email || settings.contact?.email || "info@yourinstitute.com",
    address: profile?.address || settings.contact?.address || "Near Science City Road, Sola, Ahmedabad - 380060"
  }

  const instituteName = profile?.instituteName || "EduFuture Academy"

  const heroTitleStyle = {
    fontSize: `${settings.styling?.titleFontSize ?? 64}px`,
    fontFamily: settings.styling?.heroTitleFontFamily
      ? `'${settings.styling.heroTitleFontFamily}', sans-serif`
      : 'inherit'
  }

  const heroDescStyle = {
    fontSize: `${settings.styling?.descFontSize ?? 18}px`,
    fontFamily: settings.styling?.heroDescFontFamily
      ? `'${settings.styling.heroDescFontFamily}', sans-serif`
      : 'inherit'
  }

  const sliderStyle = {
    width: `${settings.styling?.sliderWidth ?? 100}%`,
    height: `${settings.styling?.sliderHeight ?? 550}px`,
    marginTop: `${settings.styling?.sliderMarginTop ?? 0}px`,
    marginBottom: `${settings.styling?.sliderMarginBottom ?? 0}px`,
    marginLeft: `${settings.styling?.sliderMarginLeft ?? 0}px`,
    marginRight: `${settings.styling?.sliderMarginRight ?? 0}px`
  }

  return (
    <>
      <Head>
        <title>{instituteName}</title>
        {profile?.logoUrl && (
          <>
            <link rel="icon" href={profile.logoUrl} />
            <link rel="apple-touch-icon" href={profile.logoUrl} />
          </>
        )}
      </Head>

      <div className="min-h-screen bg-white overflow-x-hidden selection:bg-primary/20" style={{ fontFamily: settings.styling?.fontFamily || 'Poppins' }}>

        {/* HEADER */}
        <header
          className={cn(
            "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
            isScrolled ? "bg-white/90 backdrop-blur-xl shadow-xl py-3" : "bg-transparent py-6"
          )}
        >
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-all">
              {profile?.logoUrl ? (
                <img 
                  src={profile.logoUrl} 
                  className="h-20 w-auto object-contain" 
                  alt="Institute Logo" 
                />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h1 className="text-xl font-black uppercase tracking-tighter text-zinc-900 hidden sm:block">
                    {instituteName}
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

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-zinc-200 text-zinc-700 rounded-full font-black text-[14px] uppercase px-8 h-11 shadow-sm hover:bg-zinc-50 border-none transition-all active:scale-95">
                    Login <ChevronDown className="ml-2 w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-0 border-zinc-100 shadow-2xl rounded-2xl overflow-hidden mt-4 bg-white">
                  <DropdownMenuItem asChild className="p-0">
                    <Link href="/login" className="block px-4 py-2 text-sm font-bold text-zinc-700 uppercase tracking-tight hover:bg-zinc-100">
                      Admin Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="p-0">
                    <Link href="/staff/login" className="block px-4 py-2 text-sm font-bold text-zinc-700 uppercase tracking-tight hover:bg-zinc-100">
                      Staff Login
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="p-0">
                    <Link href="/student/login" className="block px-4 py-2 text-sm font-bold text-zinc-700 uppercase tracking-tight hover:bg-zinc-100">
                      Student Login
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(true) }}
                className="bg-primary hover:opacity-90 text-white rounded-full font-black text-[14px] uppercase px-8 h-11 shadow-lg border-none active:scale-95"
              >
                Enquiry Now
              </Button>
            </div>
          </div>
        </header>

        {/* HERO */}
        {settings.visibility?.hero !== false && (
          <section
            id="home"
            className="relative flex items-center bg-[#f8fafc] overflow-hidden pt-24 lg:pt-32"
            style={{ minHeight: `${settings.styling?.heroImageHeight ?? 700}px` }}
          >
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 transform origin-top-right translate-x-32 hidden lg:block" />

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center w-full relative z-10">
              <motion.div {...fadeIn} className="space-y-6 lg:space-y-8">
                <h1 className="font-black leading-[1.1] tracking-tight text-zinc-900" style={heroTitleStyle}>
                  {displayedHero.title}
                </h1>

                <p className="text-base lg:text-lg font-medium leading-relaxed max-w-xl text-zinc-600" style={heroDescStyle}>
                  {displayedHero.description}
                </p>

                <div className="flex flex-wrap gap-4 pt-2 lg:pt-4">
                  <Button
                    onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
                    className="h-12 lg:h-14 px-8 lg:px-12 bg-primary hover:opacity-90 text-white rounded-xl lg:rounded-2xl font-black uppercase text-sm lg:text-[14px] tracking-widest shadow-xl lg:shadow-2xl border-none transition-all active:scale-95"
                  >
                    {displayedHero.buttonText}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>

              <motion.div
                {...fadeIn}
                transition={{ delay: 0.3 }}
                className="relative hidden lg:flex items-center justify-end"
                style={sliderStyle}
              >
                {displayedHero.slides?.length > 0 ? (
                  <VarietySlider
                    slides={displayedHero.slides}
                    height={settings.styling?.sliderHeight || 500}
                  />
                ) : (
                  <img
                    src={displayedHero.image || "https://placehold.co/800x1000/3b82f6/ffffff/png?text=Hero+Image"}
                    alt="Institute Campus"
                    className="w-full h-full object-cover rounded-3xl shadow-2xl"
                  />
                )}
              </motion.div>
            </div>
          </section>
        )}

        {/* COURSES - Updated Link to /course-details/[id] */}
        {settings.visibility?.courses !== false && (
          <section id="courses" style={sectionPadding} className="bg-zinc-100 -mt-16 lg:-mt-2">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 space-y-6 lg:space-y-8">
              <div className="text-center space-y-2">
                <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight">
                  Our Flagship Programs
                </h2>
                <p className="text-zinc-600 max-w-3xl mx-auto">
                  Result-oriented batches for JEE, NEET, GUJCET, Boards & Foundation
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-7">
                {displayedCourses
                  .filter(c => c.showOnHomepage !== false)
                  .map((course, i) => (
                    <motion.div key={course.id} {...fadeIn} transition={{ delay: i * 0.06 }}>
                      {/* Changed link here */}
                      <Link href={`/course-details/${course.id}`} className="block h-full group">
                        <DetailedCourseCard course={course} />
                      </Link>
                    </motion.div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* STATS */}
        {settings.visibility?.stats !== false && (
          <section className="bg-white border-y border-zinc-100 py-16 overflow-hidden">
            <div className="max-w-7xl mx-auto px-5 sm:px-6 space-y-6 lg:space-y-8">
              <div className="text-center max-w-3xl mx-auto">
                <h2
                  className="text-3xl lg:text-4xl xl:text-5xl leading-tight tracking-tight pt-8 lg:pt-12"
                  style={{
                    color: settings.milestoneHeading?.color || "#000000",
                    fontFamily: settings.milestoneHeading?.fontFamily ? `'${settings.milestoneHeading.fontFamily}', sans-serif` : 'inherit',
                  }}
                >
                  {settings.milestoneHeading?.text || "Numbers That Define Our Journey"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-10">
                {displayedStats.map((stat: any, i: number) => {
                  const IconComp = STAT_ICONS[stat.icon] || Award
                  return (
                    <motion.div key={stat.id || i} {...fadeIn} transition={{ delay: i * 0.07 }}>
                      <Card className={cn(
                        "border shadow-sm rounded-xl p-6 text-center hover:shadow-lg transition",
                        stat.color
                      )}>
                        <IconComp className="w-10 h-10 mx-auto mb-4 text-primary" />
                        <h4 className="text-3xl lg:text-4xl font-black text-primary">
                          <AnimatedCounter value={stat.value} />{stat.suffix}
                        </h4>
                        <p className="text-lg font-semibold mt-2">{stat.label}</p>
                        {stat.subLabel && <p className="text-sm text-zinc-500">{stat.subLabel}</p>}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ABOUT */}
        {settings.visibility?.about !== false && (
          <section id="about" style={{ ...sectionPadding, paddingTop: '60px' }} className="bg-zinc-50">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              <motion.div {...fadeIn} className="relative group lg:sticky lg:top-32">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border-8 border-zinc-100">
                  <img
                    src={displayedAbout.imageUrl}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    alt="Institute Campus"
                  />
                </div>
              </motion.div>

              <motion.div {...fadeIn} transition={{ delay: 0.3 }} className="space-y-8">
                <div className="space-y-4">
                  <Badge className="bg-primary/10 text-primary border-none uppercase font-black text-[10px] px-4 tracking-widest rounded-full">
                    {displayedAbout.badge}
                  </Badge>
                  <h2 className="text-4xl lg:text-6xl font-black text-zinc-900 uppercase tracking-tight leading-[0.9]">
                    {displayedAbout.title}
                  </h2>
                </div>
                <div className="space-y-6 text-zinc-600 text-lg leading-relaxed">
                  <p>{displayedAbout.description1}</p>
                  <p>{displayedAbout.description2}</p>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* BLOG SECTION */}
        {settings.visibility?.blog !== false && (
          <section id="blog" style={sectionPadding} className="bg-zinc-100">
            <div className="max-w-7xl mx-auto px-6 space-y-16">
              <div className="text-center space-y-4">
                <Badge className="bg-primary/10 text-primary border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-widest rounded-full">
                  Learning Resources & Tips
                </Badge>
                <h2 className="text-4xl lg:text-5xl font-black text-zinc-900 uppercase tracking-tight">
                  Latest Articles & Exam Strategies
                </h2>
              </div>

              <div className="relative group px-4 md:px-12">
                <div className="overflow-hidden" ref={emblaRef}>
                  <div className="flex -ml-4 md:-ml-8">
                    {displayedBlogs.map((blog, i) => (
                      <div key={blog.id} className="flex-[0_0_100%] min-w-0 pl-4 md:pl-8 md:flex-[0_0_50%] lg:flex-[0_0_33.33%]">
                        <Link href={`/blog/${blog.id}`} className="block h-full group">
                          <Card className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                            <div className="h-56 md:h-64 rounded-t-2xl overflow-hidden relative">
                              <img
                                src={blog.image}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                alt={blog.title}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                              <Badge className="absolute top-4 left-4 bg-white/90 text-zinc-900 border-none font-black text-xs uppercase px-3 py-1 rounded-full">
                                {blog.category}
                              </Badge>
                            </div>
                            <div className="p-6 md:p-8 flex-1 flex flex-col">
                              <h4 className="text-lg md:text-xl font-black text-zinc-900 line-clamp-2 mb-3 group-hover:text-primary transition-colors">
                                {blog.title}
                              </h4>
                              <p className="text-sm text-zinc-600 line-clamp-3 mb-6 flex-1">
                                {blog.description}
                              </p>
                              <div className="flex items-center justify-between text-xs text-zinc-500 font-medium">
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="w-4 h-4" /> {blog.date}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" /> {blog.readTime || '6 min'}
                                </span>
                              </div>
                            </div>
                          </Card>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  className="absolute left-0 md:left-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-600 hover:text-primary z-10 border-none"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => emblaApi?.scrollNext()}
                  className="absolute right-0 md:right-2 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-600 hover:text-primary z-10 border-none"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TESTIMONIALS - Two rows, opposite scroll, exact card match */}
        {settings.visibility?.testimonials !== false && (
          <section className="py-10 md:py-14 bg-white overflow-hidden">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8 md:mb-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 tracking-tight">
                  What Our Students Say
                </h2>
              </div>

              <div className="space-y-6 md:space-y-8">
                {/* Row 1 - scrolling LEFT */}
                <div className="overflow-hidden">
                  <motion.div
                    className="flex gap-4 sm:gap-5 whitespace-nowrap"
                    animate={{ x: [0, -3200] }}
                    transition={{
                      ease: "linear",
                      duration: 42,
                      repeat: Infinity,
                    }}
                  >
                    {(() => {
                      const testimonials =
                        Array.isArray(settings?.testimonials) && settings.testimonials.length > 0
                          ? settings.testimonials
                          : DEFAULT_TESTIMONIALS

                      const repeated = Array(7).fill(testimonials).flat()

                      return repeated.map((t, i) => (
                        <div
                          key={i}
                          className="w-[300px] sm:w-[340px] lg:w-[360px] flex-shrink-0 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm"
                        >
                          <div className="flex items-start gap-3.5">
                            {t.image ? (
                              <img
                                src={t.image}
                                alt={t.name}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xl flex-shrink-0">
                                {t.name?.charAt(0) || "?"}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-zinc-900 text-base sm:text-lg leading-tight uppercase tracking-wide truncate">
                                {t.name}
                              </p>
                              <p className="text-xs sm:text-sm text-zinc-500 font-medium uppercase mt-0.5">
                                {t.role || "STUDENT"}
                              </p>
                              <p className="mt-3 text-sm sm:text-[15px] text-zinc-600 leading-relaxed line-clamp-3">
                                {t.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </motion.div>
                </div>

                {/* Row 2 - scrolling RIGHT */}
                <div className="overflow-hidden">
                  <motion.div
                    className="flex gap-4 sm:gap-5 whitespace-nowrap"
                    animate={{ x: [-3200, 0] }}
                    transition={{
                      ease: "linear",
                      duration: 48,
                      repeat: Infinity,
                    }}
                  >
                    {(() => {
                      const testimonials =
                        Array.isArray(settings?.testimonials) && settings.testimonials.length > 0
                          ? settings.testimonials
                          : DEFAULT_TESTIMONIALS

                      const repeated = Array(7).fill(testimonials).flat()

                      return repeated.map((t, i) => (
                        <div
                          key={`row2-${i}`}
                          className="w-[300px] sm:w-[340px] lg:w-[360px] flex-shrink-0 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm"
                        >
                          <div className="flex items-start gap-3.5">
                            {t.image ? (
                              <img
                                src={t.image}
                                alt={t.name}
                                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xl flex-shrink-0">
                                {t.name?.charAt(0) || "?"}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-zinc-900 text-base sm:text-lg leading-tight uppercase tracking-wide truncate">
                                {t.name}
                              </p>
                              <p className="text-xs sm:text-sm text-zinc-500 font-medium uppercase mt-0.5">
                                {t.role || "STUDENT"}
                              </p>
                              <p className="mt-3 text-sm sm:text-[15px] text-zinc-600 leading-relaxed line-clamp-3">
                                {t.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </motion.div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CONTACT */}
        {settings.visibility?.contact !== false && (
          <section id="contact" style={sectionPadding} className="bg-gradient-to-b from-zinc-50 to-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <motion.div {...fadeIn} className="space-y-10">
                  <div>
                    <Badge className="bg-primary/10 text-primary px-4 py-1.5 font-black uppercase text-xs tracking-widest rounded-full mb-4">
                      Contact & Counselling
                    </Badge>
                    <h2 className="text-4xl lg:text-5xl font-black text-zinc-900">Get Expert Guidance</h2>
                    <p className="mt-4 text-lg text-zinc-600">
                      Confused about stream, course or career path? Talk to our counsellor today.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <ContactCard icon={<Phone className="w-6 h-6" />} label="Helpline" value={publicContact.phone} />
                    <ContactCard icon={<Mail className="w-6 h-6" />} label="Email" value={publicContact.email} />
                    <ContactCard icon={<MapPin className="w-6 h-6" />} label="Location" value={publicContact.address} />
                  </div>
                </motion.div>

                <motion.div {...fadeIn} transition={{ delay: 0.2 }} className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12 relative overflow-hidden">
                  {isSubmitted ? (
                    <div className="py-16 text-center space-y-6">
                      <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                      </div>
                      <h3 className="text-3xl font-bold text-zinc-800">Thank You!</h3>
                      <p className="text-zinc-600">We received your message. Our team will contact you within 24 hours.</p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline">
                        Send Another Message
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Full Name</Label>
                          <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="h-12 rounded-xl"
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-2 block">Phone Number</Label>
                          <Input
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            required
                            className="h-12 rounded-xl"
                            placeholder="10-digit mobile number"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Interested In</Label>
                        <Select value={formData.course} onValueChange={val => setFormData({ ...formData, course: val })}>
                          <SelectTrigger className="h-12 rounded-xl">
                            <SelectValue placeholder="Select course or exam" />
                          </SelectTrigger>
                          <SelectContent>
                            {displayedCourses.map(c => (
                              <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                            ))}
                            <SelectItem value="other">Other / Not sure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-sm font-medium mb-2 block">Your Query</Label>
                        <Textarea
                          value={formData.message}
                          onChange={e => setFormData({ ...formData, message: e.target.value })}
                          className="min-h-[140px] rounded-xl"
                          placeholder="Current class • Target exam • Any specific problem or question..."
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          "Submit Your Query"
                        )}
                      </Button>
                    </form>
                  )}
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="bg-zinc-950 text-white pt-20 pb-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />

          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="space-y-6">
                {profile?.logoUrl ? (
                  <img src={profile.logoUrl} className="h-12" alt="Logo" />
                ) : (
                  <h3 className="text-2xl font-black">EduFuture Academy</h3>
                )}
                <p className="text-zinc-400 text-sm">
                  Premier institute for JEE | NEET | Boards & Foundation since 2009
                </p>
                <div className="flex gap-4">
                  <SocialBtn href={settings.social?.facebook || "#"} icon={Facebook} />
                  <SocialBtn href={settings.social?.instagram || "#"} icon={Instagram} />
                  <SocialBtn href={settings.social?.youtube || "#"} icon={Youtube} />
                </div>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-6">Quick Links</h4>
                <ul className="space-y-3 text-zinc-400">
                  <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                  <li><Link href="/infrastructure" className="hover:text-white transition">Our Facilities</Link></li>
                  <li><Link href="/gallery" className="hover:text-white transition">Campus Gallery</Link></li>
                  <li><Link href="#blog" className="hover:text-white transition">Latest Articles</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-6">Popular Batches</h4>
                <ul className="space-y-3 text-zinc-400">
                  {displayedCourses.slice(0, 5).map(c => (
                    <li key={c.id}>
                      <Link href={`/course-details/${c.id}`} className="hover:text-white transition">
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-lg mb-6">Get in Touch</h4>
                <ul className="space-y-4 text-zinc-400">
                  <li className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 mt-1 text-primary" />
                    <span>{publicContact.address}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-primary" />
                    <span>{publicContact.phone}</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>{publicContact.email}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-10 border-t border-zinc-800 text-center text-zinc-500 text-sm">
              © {format(new Date(), "yyyy")} {instituteName} • All rights reserved.
            </div>
          </div>
        </footer>

        {/* ENQUIRY MODAL */}
        <Dialog open={isApplyModalOpen} onOpenChange={setIsApplyModalOpen}>
          <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-primary to-purple-600 p-10 text-white relative">
              <DialogClose className="absolute right-6 top-6 rounded-full p-2 bg-white/20 hover:bg-white/30 transition">
                <X className="w-6 h-6" />
              </DialogClose>

              <DialogTitle className="text-3xl font-black mb-3">Begin Your Success Journey</DialogTitle>
              <p className="text-white/90 mb-8">Fill this quick form — our counsellor will call you within 24 hours.</p>

              {isSubmitted ? (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-10 text-center">
                  <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
                  <p className="text-white/90">We have received your details. Expect a call very soon.</p>
                  <Button
                    onClick={() => { setIsSubmitted(false); setIsApplyModalOpen(false) }}
                    className="mt-6 bg-white text-primary hover:bg-white/90"
                  >
                    Close Window
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-white/90 mb-2 block">Full Name</Label>
                      <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white h-12 rounded-xl"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <Label className="text-white/90 mb-2 block">Mobile Number</Label>
                      <Input
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        required
                        className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white h-12 rounded-xl"
                        placeholder="10-digit number"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-white/90 mb-2 block">Target Exam / Course</Label>
                    <Select value={formData.course} onValueChange={v => setFormData({ ...formData, course: v })}>
                      <SelectTrigger className="bg-white/20 border-white/30 text-white h-12 rounded-xl">
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {displayedCourses.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                        ))}
                        <SelectItem value="doubt">Just have some doubts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-white/90 mb-2 block">Your Message</Label>
                    <Textarea
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:border-white min-h-[120px] rounded-xl"
                      placeholder="Current class • Target exam • Main problem / goal..."
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-white text-primary hover:bg-white/90 font-bold text-lg rounded-xl"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Submit Enquiry"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}

// ─── HELPER COMPONENTS ───────────────────────────────────────────────

function VarietySlider({ slides, height }: { slides: any[]; height: number }) {
  const [emblaRef] = useEmblaCarousel({ loop: true })
  const images = slides?.length > 0 ? slides : DEFAULT_HERO.slides

  return (
    <div className="overflow-hidden rounded-3xl shadow-2xl" style={{ height, width: '100%' }} ref={emblaRef}>
      <div className="flex h-full">
        {images.map((s, i) => (
          <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
            <img 
              src={s.imageUrl} 
              className="w-full h-full object-cover" 
              alt="Institute atmosphere" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailedCourseCard({ course }: { course: any }) {
  const discount = course.originalPrice && course.sellingPrice
    ? Math.round(((course.originalPrice - course.sellingPrice) / course.originalPrice) * 100)
    : 0

  return (
    <Card className="border-2 border-zinc-200 rounded-2xl overflow-hidden group-hover:shadow-2xl group-hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
      <div className="h-56 relative overflow-hidden">
        <img
          src={course.image}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={course.name}
        />
        {course.type && (
          <div className="absolute top-4 left-4 bg-primary/90 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">
            {course.type}
          </div>
        )}
      </div>
      <CardContent className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {course.name}
        </h3>
        <p className="text-zinc-600 text-sm mb-4 flex-1 line-clamp-3">
          {course.description}
        </p>
        <div className="flex items-center gap-3 mt-auto">
          <span className="text-2xl font-black text-primary">
            ₹{Number(course.sellingPrice || course.price || 0).toLocaleString()}
          </span>
          {discount > 0 && (
            <Badge className="bg-green-500 text-white border-none">{discount}% OFF</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ContactCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-5 p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm hover:shadow-md transition-all">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-sm text-zinc-500 font-medium">{label}</p>
        <p className="text-lg font-semibold text-zinc-900">{value || "Information not available"}</p>
      </div>
    </div>
  )
}

function SocialBtn({ href, icon: Icon }: { href: string; icon: any }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-300 hover:bg-primary hover:text-white transition-colors"
    >
      <Icon className="w-5 h-5" />
    </a>
  )
}

function AnimatedCounter({ value, duration = 2 }: { value: number; duration?: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, latest => Math.round(latest))
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration })
    }
  }, [value, inView, count])

  return <motion.span ref={ref}>{rounded}</motion.span>
}

