"use client"

import { useState, useEffect } from "react"
import {
  getAllTags,
  createTag as createTagStorage,
  updateTag as updateTagStorage,
  deleteTag as deleteTagStorage,
  initializeStorage,
  type ClassTag,
} from "@/lib/storage"

export function useTags() {
  const [tags, setTags] = useState<ClassTag[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = () => {
    try {
      const allTags = getAllTags()
      setTags(allTags)
    } catch (error) {
      console.error("Error loading tags:", error)
      setTags([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initializeStorage()
    refresh()
  }, [])

  const createTag = (data: Omit<ClassTag, "id">) => {
    try {
      const newTag = createTagStorage(data)
      refresh()
      return newTag
    } catch (error) {
      console.error("Error creating tag:", error)
      throw error
    }
  }

  const updateTag = async (id: string, data: Partial<ClassTag>) => {
    try {
      const updatedTag = updateTagStorage(id, data)
      refresh()
      return updatedTag
    } catch (error) {
      console.error("Error updating tag:", error)
      throw error
    }
  }

  const deleteTag = async (id: string) => {
    try {
      deleteTagStorage(id)
      refresh()
    } catch (error) {
      console.error("Error deleting tag:", error)
      throw error
    }
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
