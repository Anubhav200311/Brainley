import { FileText, Link, Hash, Video, Twitter } from "lucide-react"

export function Sidebar() {
  const navItems = [
    { icon: Twitter, label: "Tweets" },
    { icon: Video, label: "Videos" },
    { icon: FileText, label: "Documents" },
    { icon: Link, label: "Links" },
    { icon: Hash, label: "Tags" },
  ]

  return (
    <aside className="w-64 border-r bg-white hidden md:block">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
            <div className="text-indigo-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a8 8 0 0 0-8 8v12l6.5-6.5a8 8 0 1 0 1.5-13.5Z" />
                <path d="M12 2a8 8 0 0 1 8 8v12l-6.5-6.5a8 8 0 0 1-1.5-13.5Z" />
              </svg>
            </div>
          </div>
          <h1 className="text-xl font-bold">Second Brain</h1>
        </div>
      </div>
      <nav className="mt-2">
        {navItems.map((item, index) => (
          <a key={index} href="#" className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100">
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </aside>
  )
}


