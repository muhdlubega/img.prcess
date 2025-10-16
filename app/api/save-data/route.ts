import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"

export async function POST(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          error: "Supabase not configured",
          details: "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables",
        },
        { status: 500 },
      )
    }

    let data
    try {
      data = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: "Failed to parse JSON body",
        },
        { status: 400 },
      )
    }

    if (!data.fields || typeof data.fields !== "object") {
      return NextResponse.json(
        {
          error: "Invalid data format",
          details: "Missing or invalid 'fields' property",
        },
        { status: 400 },
      )
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    let totalAccuracy = 0
    try {
      if (data.confidence && Object.keys(data.confidence).length > 0) {
        const confidenceValues = Object.values(data.confidence) as number[]
        totalAccuracy = confidenceValues.reduce((sum, val) => sum + val, 0) / confidenceValues.length
      }
    } catch (accuracyError) {
      console.error("Error calculating accuracy:", accuracyError)
    }

    let supabase
    try {
      supabase = createClient()
    } catch (clientError) {
      return NextResponse.json(
        {
          error: "Database connection failed",
          details: "Failed to create Supabase client",
        },
        { status: 500 },
      )
    }

    const insertData = {
      user_ip: ip,
      document_name: data.document_name || "Untitled Document",
      fields: data.fields,
      raw_text: data.rawText || "",
      confidence: data.confidence || {},
      total_accuracy: totalAccuracy,
      processed_at: data.processedAt || new Date().toISOString(),
    }

    const { data: savedData, error } = await supabase.from("extracted_documents").insert(insertData).select().single()

    if (error) {
      return NextResponse.json(
        {
          error: "Database insert failed",
          details: error.message,
          hint: error.hint || "Check if the table exists and has the correct schema",
          code: error.code,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true, id: savedData.id })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
