"use client"
import { useState, useEffect } from "react"
import { Button } from "../components/ui/button"
import { Sidebar } from "../components/sidebar"
import { NoteCard } from "../components/note-card"
import { Share, Plus } from "lucide-react"
import { redirect } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

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
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    link: "",
    content_type: "article"
  });

  const fetchNotes = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(`http://localhost:3001/contents/${user.id}` , {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      
      // Transform backend data to match frontend notes structure
      const transformedNotes: Note[] = data.contents.map((note: BackendNote) => ({
        id: note.id.toString(),
        type: note.content_type,
        title: note.title || "Untitled",
        content: getContentByType(note.content_type, note.link),
        link: note.link,
        tags: [], // Backend doesn't support tags yet
        date: new Date(note.created_at).toLocaleDateString(),
      }));

      setNotes(transformedNotes);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render content based on type
  const getContentByType = (type: string, link: string) => {
    switch (type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md overflow-hidden">
            <img src={link} alt="Content" className="object-cover h-full w-full" />
          </div>
        );
      case 'video':
        return (
          <div className="flex items-center justify-center h-40 bg-gray-100 rounded-md">
            <div className="text-gray-500">Video: {link}</div>
          </div>
        );
      case 'article':
        return (
          <p className="text-gray-700 line-clamp-3">
            Article Link: {link}
          </p>
        );
      case 'audio':
        return (
          <div className="flex items-center justify-center h-20 bg-gray-100 rounded-md">
            <div className="text-gray-500">Audio: {link}</div>
          </div>
        );
      default:
        return <p className="text-gray-700">{link}</p>;
    }
  };

  const handleAddNote = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (!user.id) {
        throw new Error("User not authenticated");
      }

      if (!newNote.title || !newNote.link) {
        setError("Title and link are required");
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

      if (!response.ok) {
        throw new Error("Failed to add note");
      }

      // Refresh notes list
      fetchNotes();
      
      // Close dialog and reset form
      setDialogOpen(false);
      setNewNote({
        title: "",
        link: "",
        content_type: "article"
      });
    } catch (err) {
      console.error("Error adding note:", err);
      setError("Failed to add note");
    }
  };


  const handleDeleteNote = (id: string) => {
    // Update the notes state by filtering out the deleted note
    setNotes(prevNotes => prevNotes.filter(note => note.id !== id));
  };
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      redirect('/');
    }
    
    fetchNotes();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-y-auto h-screen">
      <div className="container mx-auto py-6 px-4 max-w-6xl min-h-full">
        <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 py-2 z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">All Notes</h1>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Share Brain
            </Button>
            <Button 
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Content
            </Button>
          </div>
        </div>

        {/* Rest of your content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md text-red-600">
            {error}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-medium">No notes yet</h3>
            <p className="text-gray-500 mt-2">Add your first note to get started</p>
            <Button 
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Content
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} onDelete={handleDeleteNote}/>
            ))}
          </div>
        )}
      </div>
      </main>

      {/* Add Content Dialog */}
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
                onChange={(e) => setNewNote({...newNote, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content-type">Content Type</Label>
              <Select 
                value={newNote.content_type} 
                onValueChange={(value) => setNewNote({...newNote, content_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link">Link</Label>
              <Input
                id="link"
                placeholder="Enter URL"
                value={newNote.link}
                onChange={(e) => setNewNote({...newNote, link: e.target.value})}
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
  )
}