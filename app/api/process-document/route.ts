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
              text: `Analyze this document image and extract all relevant information accurately.

IMPORTANT INSTRUCTIONS:
1. Extract all visible text fields with their actual values
2. Identify key information like names, dates, numbers, addresses, IDs, etc.
3. For each field, provide a confidence score (0-100) based on text clarity
4. Include ALL visible text in the rawText field, preserving line breaks
5. Return ONLY valid JSON without markdown code blocks or backticks
6. Do not repeat words or hallucinate content

Required JSON structure:
{
  "fields": {
    "field_name_1": "extracted value 1",
    "field_name_2": "extracted value 2"
  },
  "confidence": {
    "field_name_1": 95,
    "field_name_2": 90
  },
  "rawText": "Complete text content from the document with line breaks preserved"
}

Return ONLY the JSON object, no additional text or formatting.`,
            },
            {
              type: "image_url",
              imageUrl: image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`,
            },
          ],
        },
      ],
    })

    let text = response.choices?.[0]?.message?.content as string || ""
    console.log("[v0] Raw AI response:", text)

    text = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()

    text = text.trim()

    console.log("[v0] Cleaned AI response:", text)

    let extractedData
    try {
      extractedData = JSON.parse(text)

      if (!extractedData.fields || typeof extractedData.fields !== "object") {
        throw new Error("Invalid fields structure")
      }

      console.log("Successfully parsed JSON:", extractedData)
    } catch (parseError) {
      console.log("Failed to parse as direct JSON, trying to extract JSON from text:", parseError)

      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0])
          console.log("Extracted JSON from text:", extractedData)
        } else {
          throw new Error("No JSON found in response")
        }
      } catch {
        console.log("Fallback: Creating default structure")
        extractedData = {
          fields: { content: text },
          confidence: { content: 50 },
          rawText: text,
        }
      }
    }

    const fields = extractedData.fields || {}
    const confidence = extractedData.confidence || {}
    let rawText = extractedData.rawText || text

    rawText = rawText.replace(/(\b\w+\b)(?:,\s*\1){3,}/g, "$1")

    rawText = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim()

    Object.keys(fields).forEach((key) => {
      if (!confidence[key]) {
        confidence[key] = 85
      }
    })

    console.log("[v0] Final processed data:", { fields, confidence, rawTextLength: rawText.length })

    return NextResponse.json({
      fields,
      confidence,
      rawText,
      processedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Error processing document:", error)
    return NextResponse.json({ error: "Failed to process document" }, { status: 500 })
  }
}
