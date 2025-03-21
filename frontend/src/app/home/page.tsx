"use client"
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Sidebar } from "../components/sidebar"
import { NoteCard } from "../components/note-card"
import { Share, Plus, X, FileText, Play } from "lucide-react"
import { useRouter } from 'next/navigation'  // Changed from redirect to useRouter
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { getYouTubeVideoId, getTwitterTweetId } from "../lib/media-utils";

// Types
interface Note {
  id: string;
  type: string;
  title: string;
  content: any;
  link?: string;
  tags: string[];
  date: string;
}

interface BackendNote {
  id: number;
  content_type: string;
  title: string;
  link: string;
  created_at: string;
  user_id: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('Authentication token not found');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export default function Home() {
  const router = useRouter();  // Added router
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    link: "",
    content_type: "document"
  });
  const [activeFilter, setActiveFilter] = useState("all");
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' as 'error' | 'success' });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        showToast("User not authenticated", "error");
        router.push('/');
        return;
      }

      const response = await fetch(`http://localhost:3001/contents/${user.id}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 401 || response.status === 403) {
        // If unauthorized, redirect to login page
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showToast("Session expired. Please login again.", "error");
        setTimeout(() => router.push('/'), 1500);
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();

      const transformedNotes: Note[] = data.contents.map((note: BackendNote) => ({
        id: note.id.toString(),
        type: note.content_type,
        title: note.title || "Untitled",
        content: getContentByType(note.content_type, note.link),
        link: note.link,
        tags: [],
        date: new Date(note.created_at).toLocaleDateString(),
      }));

      setNotes(transformedNotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
      showToast(err instanceof Error ? err.message : "Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  };
  const getContentByType = (type: string, link: string) => {
    switch (type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md overflow-hidden">
            <img src={link} alt="Content" className="object-cover h-full w-full" />
          </div>
        );
        
      case 'video':
        const videoId = getYouTubeVideoId(link);
        if (videoId) {
          // YouTube thumbnail URL
          const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          return (
            <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-md overflow-hidden relative">
              <img 
                src={thumbnailUrl} 
                alt="YouTube Video" 
                className="object-cover h-full w-full"
              />
              <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                  <Play className="h-5 w-5 ml-1" />
                </div>
              </div>
            </div>
          );
        }
        
        return (
          <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md">
            <div className="flex flex-col items-center gap-2">
              <Play className="h-8 w-8 text-gray-400" />
              <span className="text-sm text-gray-500 truncate max-w-[90%]">{link}</span>
            </div>
          </div>
        );
        
      case 'twitter':
        const tweetId = getTwitterTweetId(link);
        return (
          <div className="flex flex-col items-center justify-center h-40 bg-gray-100 rounded-md overflow-hidden">
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z" />
                </svg>
              </div>
              <span className="text-sm text-gray-700 font-medium">Twitter Post</span>
              <span className="text-xs text-gray-500 truncate max-w-[90%]">{link}</span>
            </div>
          </div>
        );
        
      case 'document':
        return (
          <div className="flex flex-col h-40 bg-gray-100 rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-gray-500" />
              <span className="font-medium text-gray-700">Document</span>
            </div>
            <p className="text-sm text-gray-700 line-clamp-3 mb-2">
              {link}
            </p>
            <div className="mt-auto">
              <span className="text-xs text-blue-600 hover:underline">Read more</span>
            </div>
          </div>
        );
        
      default:
        return <p className="text-gray-700">{link}</p>;
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'error' }), 5000);
  };

  const handleAddNote = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        showToast("User not authenticated", "error");
        return;
      }

      if (!newNote.title || !newNote.link) {
        showToast("Title and link are required", "error");
        return;
      }

      const response = await fetch('http://localhost:3001/contents', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          title: newNote.title,
          link: newNote.link,
          content_type: newNote.content_type,
          user_id: user.id
        }),
      });

      if (response.status === 401 || response.status === 403) {
        showToast("You are not authorized to add notes", "error");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add note");
      }

      showToast("Content added successfully!", "success");
      fetchNotes();

      setDialogOpen(false);
      setNewNote({
        title: "",
        link: "",
        content_type: "document"
      });
    } catch (err) {
      console.error("Error adding note:", err);
      showToast(err instanceof Error ? err.message : "Failed to add note", "error");
    }
  };

  const getFilteredNotes = () => {
    if (activeFilter === "all") {
      return notes;
    } else if (activeFilter === "tags") {
      return notes;
    } else {
      return notes.filter(note => note.type === activeFilter);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
    showToast("Content deleted successfully", "success");
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');  // Changed from redirect to router.push
      return;
    }

    fetchNotes();
  }, [router]);  // Added router to dependency array

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="h-screen sticky top-0">
        <Sidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="container mx-auto py-6 px-4 max-w-7xl min-h-full">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 py-2 z-10">
            <h1 className="text-3xl font-extrabold tracking-tight">
              {activeFilter === "all" ? "All Notes" : 
               activeFilter === "tags" ? "Tags" :
               `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}s`}
            </h1>
            <div className="flex gap-2">
              {/* <Button variant="outline" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share Brain
              </Button> */}
              <Button
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Content
              </Button>
            </div>
          </div>
  
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : getFilteredNotes().length === 0 ? (
            <div className="text-center p-12 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-medium">
                {activeFilter === "all" ? "No notes yet" : `No ${activeFilter} content yet`}
              </h3>
              <p className="text-gray-500 mt-2">
                {activeFilter === "all"
                  ? "Add your first note to get started"
                  : `Add your first ${activeFilter} content to get started`}
              </p>
              <Button
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => {
                  setNewNote({ ...newNote, content_type: activeFilter === "all" ? "document" : activeFilter });
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
              {getFilteredNotes().map((note) => (
                <NoteCard key={note.id} note={note} onDelete={handleDeleteNote} />
              ))}
            </div>
          )}
        </div>
      </main>
  
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg z-50 flex items-center gap-3 ${
          toast.type === 'error' ? 'bg-red-50 text-red-600 border border-red-200' : 
          'bg-green-50 text-green-600 border border-green-200'
        }`}>
          <p>{toast.message}</p>
          <button 
            onClick={() => setToast({...toast, show: false})} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>
      )}
  
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Content</DialogTitle>
          </DialogHeader>
  
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              />
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select
                value={newNote.content_type}
                onValueChange={(value) => setNewNote({ ...newNote, content_type: value })}
                defaultValue={activeFilter !== "all" && activeFilter !== "tags" ? activeFilter : "document"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-md">
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                placeholder="Enter URL"
                value={newNote.link}
                onChange={(e) => setNewNote({ ...newNote, link: e.target.value })}
              />
            </div>
          </div>
  
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleAddNote}>
              Add Content
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}