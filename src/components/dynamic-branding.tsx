
"use client"

import { useEffect } from "react"
import { useFirebase } from "@/firebase"
import { ref, onValue, off } from "firebase/database"
import { usePathname } from "next/navigation"
import { useResolvedId } from "@/hooks/use-resolved-id"

/**
 * DynamicBranding handles real-time synchronization of Favicon and Page Title.
 * It modifies existing tags to avoid 'removeChild' errors with React 19 / Next.js 15.
 */
export function DynamicBranding() {
  const { database } = useFirebase()
  const { resolvedId } = useResolvedId()
  const pathname = usePathname()

  useEffect(() => {
    if (!database || !resolvedId) return

    const profileRef = ref(database, `Institutes/${resolvedId}/profile`)
    
    const unsubscribe = onValue(profileRef, (snapshot) => {
      if (!snapshot.exists()) return

      const profile = snapshot.val()
      const instituteName = profile.instituteName || "Institute"
      const logoUrl = profile.logoUrl || ""
      
      const pageName = getPageTitle(pathname)
      
      // Defensively update title without triggering head unmounts
      if (typeof document !== 'undefined') {
        document.title = `${instituteName} / ${pageName}`

        if (logoUrl) {
          // Update favicon only if tags exist, avoiding manual removal
          const iconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement
          if (iconLink) iconLink.href = logoUrl

          const appleLink = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement
          if (appleLink) appleLink.href = logoUrl
        }
      }
    })

    return () => off(profileRef)
  }, [database, resolvedId, pathname])

  return null
}

function getPageTitle(path: string): string {
  if (path === "/" || path === "/student/dashboard" || path === "/staff/dashboard" || path === "/branch/dashboard" || path === "/super/dashboard") {
    return "Dashboard"
  }
  const parts = path.split('/').filter(Boolean)
  const lastPart = parts[parts.length - 1] || "Home"
  return lastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}
