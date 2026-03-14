
"use client"

import AttendancePage from "@/app/attendance/page"

/**
 * Staff-Specific Attendance Wrapper
 * Uses the core Attendance module but runs under the staff portal context.
 * useResolvedId handles the parent institute sync.
 */
export default function StaffAttendancePage() {
  return <AttendancePage />
}
