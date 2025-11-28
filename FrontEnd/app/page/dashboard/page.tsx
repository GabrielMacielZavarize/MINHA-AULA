"use client"

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation"
import { getProfile, type Profile, supabase } from "@/lib/supabase-db"
import { TeacherDashboard } from "@/components/teacher-dashboard"
import { Loader2 } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setLoading(false)
          return
        }
        const userProfile = await getProfile(session.user.id)
        if (userProfile) {
          setProfile(userProfile)
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    if (profile?.role === 'student') {
      router.replace("/page/dashboard/find-classes")
    }
  }, [profile, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    )
  }

  if (profile.role === 'student') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <TeacherDashboard profile={profile} />
}