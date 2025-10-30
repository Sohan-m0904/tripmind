import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { feedback, currentTrip } = await req.json();

    const prompt = `
    You are TripMind — an intelligent AI travel planner.
    
    The user said: "${feedback}"
    
    Here is the current trip JSON:
    ${JSON.stringify(currentTrip, null, 2)}
    
    Your job:
    - Modify the trip based on the user's feedback.
    - ALWAYS return the full JSON, never partials.
    - Include all top-level fields even if unchanged:
      "summary", "budget_breakdown", "accommodation", and "itinerary".
    - Keep the same JSON keys and structure.
    - Update the summary so it reflects the refined trip.
    - Ensure valid JSON only (no markdown, no code fences, no extra text).
    
    The final JSON must look like:
    {
      "summary": "...",
      "budget_breakdown": { ... },
      "accommodation": { ... },
      "itinerary": [ ... ]
    }
    `;
    
    

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    const message = completion.choices[0].message?.content?.trim() || "{}";
    const updatedTrip = JSON.parse(
      message.replace(/```json/i, "").replace(/```/g, "").trim()
    );

    return NextResponse.json({ ok: true, data: updatedTrip });

  } catch (error: any) {
    console.error("Refine error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refine trip" },
      { status: 500 }
    );
  }
}
