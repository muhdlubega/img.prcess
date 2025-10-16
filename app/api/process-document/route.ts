import { type NextRequest, NextResponse } from "next/server"
import { Mistral } from "@mistralai/mistralai"

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }

    const mistral = new Mistral({
      apiKey: process.env.MISTRAL_API_KEY || "",
    })

    const response = await mistral.chat.complete({
      model: "pixtral-12b-2409",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Analyze this document image and extract all relevant data. Provide the extracted information in a structured JSON format with clear field names, values, and confidence scores (0-100) for each field. Also include the raw text content. Format your response as JSON with three keys: "fields" (an object with key-value pairs of extracted data), "confidence" (an object with the same keys as fields, containing confidence scores 0-100 for each field), and "rawText" (the complete text content).',
            },
            {
              type: "image_url",
              imageUrl: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
            },
          ],
        },
      ],
    })

    const text = response.choices?.[0]?.message?.content || ""

    let extractedData
    try {
      if (typeof text === "string") {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0])
        } else {
        extractedData = {
          fields: { content: text },
          confidence: { content: 50 },
          rawText: text,
        }
      }
    }
    } catch {
      extractedData = {
        fields: { content: text },
        confidence: { content: 50 },
        rawText: text,
      }
    }

    const fields = extractedData.fields || {}
    const confidence = extractedData.confidence || {}

    Object.keys(fields).forEach((key) => {
      if (!confidence[key]) {
        confidence[key] = 85
      }
    })

    return NextResponse.json({
      fields,
      confidence,
      rawText: extractedData.rawText || text,
      processedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 })
  }
}
