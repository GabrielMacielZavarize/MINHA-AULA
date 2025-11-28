"use client"

import { useState, useEffect } from "react"
import {
  getTags,
  createTag as createTagDb,
  type ClassTag,
} from "@/lib/supabase-db"

export function useTags() {
  const [tags, setTags] = useState<ClassTag[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      setLoading(true)
      const allTags = await getTags()
      setTags(allTags)
    } catch (error) {
      console.error("Error loading tags:", error)
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const createTag = async (data: Omit<ClassTag, "id">) => {
    try {
      const newTag = await createTagDb(data)
      refresh()
      return newTag
    } catch (error) {
      console.error("Error creating tag:", error)
      throw error
    }
  }

  const updateTag = async (id: string, data: Partial<ClassTag>) => {
    // Note: updateTag is not yet implemented in supabase-db.ts, I should add it there or here.
    // For now, let's assume I'll add it to supabase-db.ts or just log error.
    // Actually, I should implement it in supabase-db.ts first.
    // But to proceed, I'll assume it exists or I'll add it.
    // Let's check supabase-db.ts content again. I didn't add updateTag/deleteTag there.
    // I will add them to supabase-db.ts in the next step.
    console.error("Update tag not implemented yet")
    throw new Error("Not implemented")
  }

  const deleteTag = async (id: string) => {
     // Same here
     console.error("Delete tag not implemented yet")
     throw new Error("Not implemented")
  }

  return {
    tags,
    loading,
    refresh,
    createTag,
    updateTag,
    deleteTag,
  }
}
