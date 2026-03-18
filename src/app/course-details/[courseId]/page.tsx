"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useFirebase } from "@/firebase"
import {
  ref, onValue, off, push, get
} from "firebase/database"
import { motion } from "framer-motion"
import {
  Clock, Timer, Layers, Languages, Award, CreditCard,
  ChevronRight, CheckCircle2, School, ArrowRight, Phone,
  Mail, MapPin, Facebook, Instagram, Youtube, Video,
  FileText, Smartphone, X, Send, Loader2, ShieldCheck,
  Share2, Copy, AlertCircle
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
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

// Fallback default course (used if Firebase data not found)
const DEFAULT_COURSE = {
  name: "2-Year Integrated JEE + Boards (Class 11)",
  description: "Strong foundation + advanced problem solving + weekly tests + DPPs + doubt resolution + performance analysis.",
  image: "https://placehold.co/1200x675/3b82f6/ffffff/png?text=2+Year+JEE",
  type: "Long Term",
  sellingPrice: 98000,
  originalPrice: 125000,
  duration: "24",
  hours: "1200",
  totalChapters: "45",
  language: "English + Hindi",
  provideCertificate: "Yes",
  paymentMode: "Installment Available",
  totalVideos: "380",
  pdfResources: "Yes",
  deviceAccess: "Yes",
  digitalCredential: "Yes",
  courseMode: "Offline + Online Hybrid",
  outcomes: ["Strong JEE Main & Advanced foundation", "Board marks 95%+", "Regular doubt sessions", "All India Test Series"],
  outcomeHeading: "What You Will Achieve",
  syllabus: [
    { title: "Physics – Class 11", content: "Mechanics, Thermodynamics, Waves..." },
    { title: "Chemistry – Class 11", content: "Physical, Organic & Inorganic basics..." },
    { title: "Mathematics – Class 11", content: "Algebra, Coordinate Geometry, Calculus intro..." },
  ],
  faqs: [
    { q: "Is this course suitable for droppers?", a: "Yes — droppers get special fast-track batches." },
    { q: "Do you provide study material?", a: "Yes — complete DPPs, modules, PYQs included." },
  ]
}

export default function CourseDetailPage() {
  const params = useParams()
  const slug = params.slug as string       // from /:slug/courses-detail/:courseId
  const courseId = params.courseId as string

  const { database } = useFirebase()

  const [resolvedUid, setResolvedUid] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [settings, setSettings] = useState<any>(null)
  const [paymentSettings, setPaymentSettings] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false)
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    name: "", phone: "", course: "", message: ""
  })

  // Resolve institute UID from slug
  useEffect(() => {
    if (!database || !slug) return
    get(ref(database, `Slugs/${slug}`))
      .then(snap => {
        const uid = snap.val() || slug
        setResolvedUid(uid)
      })
      .catch(() => setResolvedUid(slug))
  }, [database, slug])

  // Load data
  useEffect(() => {
    if (!database || !resolvedUid || !courseId) return

    const root = `Institutes/${resolvedUid}`

    // Profile, settings, payment
    onValue(ref(database, `${root}/profile`), snap => snap.exists() && setProfile(snap.val()))
    onValue(ref(database, `${root}/website_settings`), snap => snap.exists() && setSettings(snap.val()))
    onValue(ref(database, `${root}/payment-settings`), snap => snap.exists() && setPaymentSettings(snap.val()))

    // All courses (for dropdown)
    onValue(ref(database, `${root}/website_courses`), snap => {
      const data = snap.val() || {}
      setCourses(Object.entries(data).map(([id, val]: any) => ({ id, ...val })))
    })

    // Single course
    onValue(ref(database, `${root}/website_courses/${courseId}`), snap => {
      if (snap.exists()) {
        const c = { ...snap.val(), id: courseId }
        setCourse(c)
        setFormData(prev => ({ ...prev, course: c.name }))
      } else {
        // Fallback to default if course not found
        setCourse({ ...DEFAULT_COURSE, id: courseId })
      }
      setIsLoading(false)
    })

    return () => {
      // cleanup listeners if needed
    }
  }, [database, resolvedUid, courseId])

  const displayedCourse = course || DEFAULT_COURSE

  const discountValue = displayedCourse.originalPrice && displayedCourse.sellingPrice
    ? Math.round(((Number(displayedCourse.originalPrice) - Number(displayedCourse.sellingPrice)) / Number(displayedCourse.originalPrice)) * 100)
    : 0

  const outcomes = displayedCourse.outcomes || []
  const syllabus = displayedCourse.syllabus || []
  const faqs = displayedCourse.faqs || []

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading Course...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header - similar to main page */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-md py-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <Link href={`/${slug}`} className="flex items-center gap-3">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} className="h-16 w-auto object-contain" alt="Logo" />
            ) : (
              <div className="flex items-center gap-3">
                <School className="w-8 h-8 text-primary" />
                <span className="font-black text-xl">{profile?.instituteName || "Institute"}</span>
              </div>
            )}
          </Link>

          <nav className="hidden lg:flex gap-8 font-black uppercase text-sm text-zinc-700">
            <Link href={`/${slug}`}>Home</Link>
            <Link href={`/${slug}#about`}>About</Link>
            <Link href={`/${slug}#courses`}>Courses</Link>
            <Link href={`/${slug}/gallery`}>Gallery</Link>
            <Link href={`/${slug}#blog`}>Blogs</Link>
            <Link href={`/${slug}#contact`}>Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">Login</Button>
            <Button onClick={() => setIsApplyModalOpen(true)} className="bg-primary text-white">
              Enquiry Now
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-zinc-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <nav className="flex items-center gap-2 text-sm text-zinc-400">
                <Link href={`/${slug}`}>Home</Link>
                <ChevronRight className="w-4 h-4" />
                <Link href={`/${slug}#courses`}>Courses</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white">{displayedCourse.name}</span>
              </nav>

              <Badge className={cn(
                "px-4 py-1.5 font-black uppercase text-sm",
                displayedCourse.type === "Online" ? "bg-blue-600" : "bg-rose-600"
              )}>
                {displayedCourse.type} Program
              </Badge>

              <h1 className="text-4xl lg:text-6xl font-black leading-tight">
                {displayedCourse.name}
              </h1>
            </div>

            <div className="flex-1">
              <img
                src={displayedCourse.image}
                alt={displayedCourse.name}
                className="rounded-2xl shadow-2xl w-full aspect-video object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left - Description, Tabs */}
          <div className="lg:col-span-2 space-y-12">
            {/* Specs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 border-b pb-10">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-zinc-500">Duration</p>
                  <p className="font-bold">{displayedCourse.duration || "N/A"} Months</p>
                </div>
              </div>
              {/* Add other specs similarly */}
            </div>

            {/* Tabs - Description, Syllabus, FAQ */}
            <Tabs defaultValue="description">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                <TabsTrigger value="faq">FAQ</TabsTrigger>
              </TabsList>

              <TabsContent value="description">
                <p className="text-lg text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  {displayedCourse.description}
                </p>
              </TabsContent>

              <TabsContent value="syllabus">
                {/* Syllabus list */}
              </TabsContent>

              <TabsContent value="faq">
                {/* Accordion FAQ */}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right - Sticky Pricing Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white border rounded-2xl shadow-xl p-8 space-y-6">
              <h3 className="text-2xl font-black">Enroll Now</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black">
                  ₹{Number(displayedCourse.sellingPrice || 0).toLocaleString()}
                </span>
                {discountValue > 0 && (
                  <span className="text-xl text-zinc-400 line-through">
                    ₹{Number(displayedCourse.originalPrice).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" onClick={() => setIsApplyModalOpen(true)}>
                  Enquiry
                </Button>
                <Button onClick={() => setIsPayModalOpen(true)}>
                  Buy Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modals - Enquiry & Payment (copy from your provided code) */}
      {/* ... paste your Dialogs here ... */}

      {/* Footer */}
      <footer className="bg-zinc-950 text-white py-16">
        {/* your footer content */}
      </footer>
    </div>
  )
}