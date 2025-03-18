import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card"
import { Share, Trash, FileText, Play, Copy, Check } from "lucide-react"
import { useState, useRef, useEffect, type ReactNode } from "react"

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

export function NoteCard({ note, onDelete }: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowSharePopover(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getIcon = () => {
    if (note.type === 'image') return FileText; // Replace with Image icon
    if (note.type === 'video') return Play;
    if (note.type === 'article') return FileText;
    return FileText;
  }

  const Icon = getIcon();

  const handleDelete = async() => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      if (!token) {
      throw new Error('Authentication token not found');
      }
      const response = await fetch(`http://localhost:3001/contents/${note.id}`, {
        headers : {
          'Authorization': `Bearer ${token}`
        },
        method: 'DELETE',
      });

      if(!response.ok) {
        throw new Error('Failed to delete note');
      }

      onDelete(note.id);
    } catch(err) {
      console.error('Error deleting note', err);
      alert('Failed to delete note, Please try again');
    } finally {
      setIsDeleting(false);
    }
  }
  
  const handleShare = async() => {
    try {
      setIsSharing(true);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to share content');
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/v1/brain/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ contentId: note.id })
      });

      if (!response.ok) {
        throw new Error('Failed to generate share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setShowSharePopover(true);
    } catch (err) {
      console.error('Error sharing note:', err);
      alert('Failed to share note. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error copying to clipboard:', err);
      });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">{note.type}</span>
        </div>
        <div className="flex items-center gap-2 relative">
          <button 
            className={`text-gray-400 hover:text-indigo-600 ${isSharing ? 'opacity-50' : ''}`} 
            onClick={handleShare}
            disabled={isSharing}
          >
            <Share className="h-4 w-4" />
          </button>
          <button 
            className={`text-gray-400 hover:text-red-600 ${isDeleting ? 'opacity-50' : ''}`} 
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash className="h-4 w-4" />
          </button>
          
          {/* Share URL Popover */}
          {showSharePopover && (
            <div 
              ref={popoverRef}
              className="absolute top-full right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
            >
              <div className="p-3">
                <h3 className="text-sm font-medium mb-2">Share this content</h3>
                <div className="flex">
                  <input 
                    type="text" 
                    readOnly 
                    value={shareUrl} 
                    className="flex-1 p-2 text-xs border rounded-l-md bg-gray-50"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`p-2 ${copied ? 'bg-green-500' : 'bg-indigo-600'} text-white rounded-r-md`}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  This link will expire in 30 days
                </p>
              </div>
            </div>
          )}
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