"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useTags, type Tag } from "@/hooks/use-tags"

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const { tags, createTag, deleteTag } = useTags()
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return

    setIsCreating(true)
    try {
      const tag = await createTag(newTagName.trim(), newTagColor)
      onTagsChange([...selectedTags, tag])
      setNewTagName("")
      setNewTagColor("#3b82f6")
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleTag = (tag: Tag) => {
    if (selectedTags.some((t) => t.id === tag.id)) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id))
    } else {
      onTagsChange([...selectedTags, tag])
    }
  }

  const handleDeleteTag = async (tagId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteTag(tagId)
    onTagsChange(selectedTags.filter((t) => t.id !== tagId))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="outline"
            className="text-sm px-2 py-1 cursor-pointer"
            style={{ borderColor: tag.color, color: tag.color }}
            onClick={() => handleToggleTag(tag)}
          >
            {tag.name}
            <X className="h-3 w-3 ml-1" />
          </Badge>
        ))}
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full bg-transparent">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Etiqueta
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Etiquetas Existentes</h4>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-sm px-2 py-1 cursor-pointer relative group"
                    style={{ borderColor: tag.color, color: tag.color }}
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag.name}
                    {selectedTags.some((t) => t.id === tag.id) && <span className="ml-1">✓</span>}
                    <button
                      onClick={(e) => handleDeleteTag(tag.id, e)}
                      className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Nova Etiqueta</h4>
              <div className="space-y-2">
                <Input
                  placeholder="Nome da etiqueta"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleCreateTag()
                    }
                  }}
                />
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-20 h-10"
                  />
                  <Button onClick={handleCreateTag} disabled={!newTagName.trim() || isCreating} className="flex-1">
                    {isCreating ? "Criando..." : "Criar"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
