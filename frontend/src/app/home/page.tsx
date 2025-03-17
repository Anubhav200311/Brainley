"use client"
import { Button } from "../components/ui/button"
import { Sidebar } from "../components/sidebar"
import { NoteCard } from "../components/note-card"
import { Share, Plus } from "lucide-react"
import { useEffect } from "react"
import { redirect } from 'next/navigation'
 


export default function Home() {
  

  useEffect( () => {
    const token = localStorage.getItem('token');
    if(!token) {
      redirect('/');
    }
  } , [])
  const notes = [
    {
      id: "1",
      type: "Project Ideas",
      title: "Future Projects",
      content: (
        <ul className="list-disc pl-5 space-y-2">
          <li>Build a personal knowledge base</li>
          <li>Create a habit tracker</li>
          <li>Design a minimalist todo app</li>
        </ul>
      ),
      tags: ["productivity", "ideas"],
      date: "10/03/2024",
    },
    {
      id: "2",
      type: "How to Build a",
      title: "Second Brain",
      content: (
        <div className="flex items-center justify-center h-28 bg-gray-100 rounded-md">
          <div className="w-16 h-16 text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
          </div>
        </div>
      ),
      tags: ["productivity", "learning"],
      date: "09/03/2024",
    },
    {
      id: "3",
      type: "Productivity Tip",
      title: "",
      content: (
        <p className="text-gray-700">
          The best way to learn is to build in public. Share your progress, get feedback, and help others along the way.
        </p>
      ),
      tags: ["productivity", "learning"],
      date: "08/03/2024",
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">All Notes</h1>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share Brain
              </Button>
              <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
                Add Content
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}


