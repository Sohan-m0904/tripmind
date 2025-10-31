import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { currentTrip, feedback } = await req.json();

    const prompt = `
You are TripMind, an expert travel planner.
The user gave feedback: "${feedback}".
Here is the current trip JSON that must be refined while keeping all structure intact:
${JSON.stringify(currentTrip, null, 2)}

Update ONLY relevant parts (e.g., modify activities, add or adjust a day) but preserve:
- The "summary" (keep or slightly enhance it, never remove it)
- The "budget_breakdown"
- The "accommodation"
- The "itinerary" array structure

Respond strictly as VALID JSON, same schema, starting with { and ending with }.
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    let message = completion.choices[0].message?.content?.trim() || "{}";

    // 🧠 Clean up and parse
    const start = message.indexOf("{");
    const end = message.lastIndexOf("}") + 1;
    const jsonPart = message.slice(start, end);

    let refinedTrip;
    try {
      refinedTrip = JSON.parse(jsonPart);
    } catch (err) {
      console.warn("Failed to parse refined JSON:", err);
      refinedTrip = currentTrip; // fallback to old one
    }

    return NextResponse.json({ ok: true, data: refinedTrip });
  } catch (error: any) {
    console.error("Refine error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to refine trip" },
      { status: 500 }
    );
  }
}
