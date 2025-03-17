import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card"
import { Share, Trash, FileText, Play } from "lucide-react"
import { useState, type ReactNode } from "react"

interface NoteCardProps {
  note: {
    id: string
    type: string
    title: string
    content: ReactNode
    tags: string[]
    date: string
  }
  onDelete: (id: string) => void;

}


export function NoteCard({ note , onDelete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getIcon = () => {
    if (note.type.includes("Project")) return FileText
    if (note.type.includes("Productivity")) return Play
    return FileText
  }

  const Icon = getIcon()

  const handleDelete = async() => {

    try {
      setIsDeleting(true);
      const response = await fetch(`http://localhost:3001/contents/${note.id}` , {
        method: 'DELETE',
      });

      if(!response.ok) {
        throw new Error('Failed to delete note');
      }

      onDelete(note.id);
    }catch(err) {
      console.error('Error deleting note' , err);
      alert('Failed to delete note , Please try again');
    }finally {
      setIsDeleting(false);
    }
  }
  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">{note.type}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-400 hover:text-gray-600">
            <Share className="h-4 w-4" />
          </button>
          <button className="text-gray-400 hover:text-gray-600" onClick={handleDelete} disabled = {isDeleting}>
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        {note.title && <h3 className="text-lg font-bold mb-2">{note.title}</h3>}
        <div className="text-sm">{note.content}</div>
      </CardContent>
      <CardFooter className="p-4 pt-2 flex flex-col items-start">
        <div className="flex flex-wrap gap-2 mb-2">
          {note.tags.map((tag, index) => (
            <span key={index} className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
        <span className="text-xs text-gray-500">Added on {note.date}</span>
      </CardFooter>
    </Card>
  )
}


