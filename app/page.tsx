"use client"

import { useState } from "react"
import { DocumentProcessor } from "@/components/document-processor"
import { Sidebar } from "@/components/sidebar"

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  return (
    <main className="min-h-screen bg-background">
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectDocument={(doc) => {
          setSelectedDocument(doc)
        }}
      />

      <div className="md:ml-64 transition-all duration-300">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <DocumentProcessor selectedDocument={selectedDocument} />
        </div>
      </div>
    </main>
  )
}
