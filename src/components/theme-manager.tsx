"use client"

import { useEffect } from "react"
import { useFirebase } from "@/firebase"
import { ref, onValue } from "firebase/database"
import { hexToHslValues } from "@/lib/theme-utils"
import { useResolvedId } from "@/hooks/use-resolved-id"

/**
 * ThemeManager listens to the institute's primary color and font-family in the database
 * and applies it globally to the CSS variables.
 * Uses resolvedId to support Admin, Staff, and Student contexts.
 */
export function ThemeManager() {
  const { database } = useFirebase()
  const { resolvedId } = useResolvedId()

  useEffect(() => {
    if (!database || !resolvedId) return

    const profileRef = ref(database, `Institutes/${resolvedId}/profile`)
    
    // Use the returned unsubscribe function for reliable cleanup
    const unsubscribe = onValue(profileRef, (snapshot) => {
      const data = snapshot.val()
      if (!data) return

      // Apply Theme Color
      if (data.themeColor) {
        const hslValues = hexToHslValues(data.themeColor)
        document.documentElement.style.setProperty('--primary', hslValues)
        document.documentElement.style.setProperty('--ring', hslValues)
        document.documentElement.style.setProperty('--chart-1', hslValues)
      }

      // Apply Font Family
      if (data.fontFamily) {
        document.documentElement.style.setProperty('--font-dynamic', `'${data.fontFamily}', sans-serif`)
      }
    }, (error) => {
      console.error("ThemeManager listener error:", error)
    })

    return () => {
      unsubscribe()
    }
  }, [database, resolvedId])

  return null
}
