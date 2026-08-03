"use client"

import { DocumentProcessor } from "@/components/document-processor"
import { Sidebar } from "@/components/sidebar"
import { useSelection } from "@/components/selection-provider"
import { useState } from "react"

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { selectedDocument, selectDocument } = useSelection()

  return (
    <main id="main-content" className="min-h-screen bg-background" tabIndex={-1}>
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-0 h-96 w-96 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] rounded-full bg-cyan-500/5 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSelectDocument={selectDocument}
      />

      <div className="md:ml-64 transition-[margin] duration-300">
        <div className="container mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
          <DocumentProcessor selectedDocument={selectedDocument} />
        </div>
      </div>
    </main>
  )
}
