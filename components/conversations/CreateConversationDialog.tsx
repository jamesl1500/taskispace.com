"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useCreateConversation } from "@/hooks/queries/useConversationQueries"
import { useSearchProfiles } from "@/hooks/queries/useProfileQueries"
import { useAuth } from "@/hooks/useAuth"
import { ProfileSearchResult } from "@/types/user"
import { toast } from "sonner"
import { X, UserPlus, Search } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"

interface CreateConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preSelectedUser?: string // Username to pre-select
}

export function CreateConversationDialog({ open, onOpenChange, preSelectedUser }: CreateConversationDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<ProfileSearchResult[]>([])
  const [showUserSearch, setShowUserSearch] = useState(false)
  
  const debouncedQuery = useDebounce(searchQuery, 300)
  const { data: searchResults = [] } = useSearchProfiles(debouncedQuery, debouncedQuery.length >= 2)
  const { mutate: createConversation, isPending } = useCreateConversation()
  const { user } = useAuth()

  // Handle pre-selected user
  useEffect(() => {
    if (preSelectedUser && open && user) {
      // Find user in search results if available
      const foundUser = searchResults.find(searchUser => searchUser.user_name === preSelectedUser)
      if (foundUser && !selectedUsers.some(u => u.id === foundUser.id)) {
        // Prevent pre-selecting yourself
        if (foundUser.id === user.id) {
          toast.error("You cannot start a conversation with yourself")
          return
        }
        setSelectedUsers([foundUser])
        setTitle(`Chat with ${foundUser.display_name || foundUser.user_name}`)
      }
    }
  }, [preSelectedUser, searchResults, open, selectedUsers, user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() && !description.trim()) {
      toast.error("Please provide a title or description")
      return
    }

    // Prevent creating conversations with only yourself
    if (selectedUsers.length === 0) {
      toast.error("Please add at least one other person to the conversation")
      return
    }

    createConversation(
      { 
        title: title.trim() || undefined, 
        description: description.trim() || undefined,
        member_ids: selectedUsers.map(user => user.id)
      },
      {
        onSuccess: () => {
          toast.success("Conversation created successfully")
          resetForm()
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create conversation")
        },
      }
    )
  }

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setSearchQuery("")
    setSelectedUsers([])
    setShowUserSearch(false)
    onOpenChange(false)
  }

  const handleCancel = () => {
    resetForm()
  }

  const addUser = (profileUser: ProfileSearchResult) => {
    // Prevent users from adding themselves
    if (user && profileUser.id === user.id) {
      toast.error("You cannot add yourself to a conversation")
      return
    }
    
    if (!selectedUsers.some(u => u.id === profileUser.id)) {
      setSelectedUsers([...selectedUsers, profileUser])
    }
    setSearchQuery("")
    setShowUserSearch(false)
  }

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
  }

  const getInitials = (name: string | null, username: string) => {
    if (!name) return username.charAt(0).toUpperCase()
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredResults = searchResults.filter(
    searchUser => !selectedUsers.some(selected => selected.id === searchUser.id) && 
                  searchUser.id !== user?.id // Don't show current user in results
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Conversation</DialogTitle>
          <DialogDescription>
            Start a new conversation and add participants.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="grid gap-4 py-4 flex-1 overflow-auto">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter conversation title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Participants Section */}
            <div className="grid gap-2">
              <Label>Participants</Label>
              
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedUsers.map((user) => (
                    <Badge key={user.id} variant="secondary" className="flex items-center gap-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(user.display_name, user.user_name)}
                        </AvatarFallback>
                      </Avatar>
                      {user.display_name || user.user_name}
                      <button
                        type="button"
                        onClick={() => removeUser(user.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Add Participant */}
              <Popover open={showUserSearch} onOpenChange={setShowUserSearch}>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add participants...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" side="bottom" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search users..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {debouncedQuery.length < 2 ? (
                          <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                            <Search className="h-4 w-4 mr-2" />
                            Type at least 2 characters to search
                          </div>
                        ) : (
                          "No users found"
                        )}
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredResults.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => addUser(user)}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(user.display_name, user.user_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {user.display_name || user.user_name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                @{user.user_name}
                              </p>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Enter a brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Conversation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}