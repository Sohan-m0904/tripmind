/*
📘 Purpose of This File
-----------------------
This file defines the `/api/refine` endpoint of the TripMind application. 
It handles POST requests that refine an existing AI-generated travel plan based on user feedback.

Core Workflow:
1. Receive the current trip JSON and user feedback from the frontend.
2. Construct a clear and structured prompt to send to the Groq AI model.
3. Ask Groq’s LLaMA 3.1 model to regenerate the trip JSON while maintaining the original structure.
4. Parse and clean the AI’s response to ensure valid JSON output.
5. Return the refined trip to the frontend for display.
*/

import { NextRequest, NextResponse } from "next/server"; // Next.js types for handling requests/responses
import Groq from "groq-sdk"; // Groq SDK for communicating with Groq’s AI model


/*
🧠 Step 1: Initialise Groq Client
---------------------------------
Creates an instance of the Groq SDK, authenticating it with the API key stored 
in the environment variables. This allows secure and authorised requests to Groq’s servers.
*/
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!, // The exclamation mark ensures TypeScript treats this as defined.
});


/*
🚀 Step 2: Define the POST Request Handler
------------------------------------------
This function is triggered when a POST request is made to `/api/refine`.
It reads user feedback and the current trip data, sends them to Groq for refinement,
then returns a structured JSON response.
*/
export async function POST(req: NextRequest) {
  try {
    /*
    📨 Step 3: Extract Request Body
    -------------------------------
    The request body is expected to contain:
      - `currentTrip`: the existing trip data object
      - `feedback`: user’s input describing desired changes
    */
    const { currentTrip, feedback } = await req.json();

    /*
    ✍️ Step 4: Construct the AI Prompt
    ----------------------------------
    Builds a clear, structured instruction string for Groq’s model.
    The prompt includes both the user’s feedback and the current trip data, 
    instructing the model to adjust only relevant parts while keeping the schema intact.
    
    Key constraints for the model:
    - Maintain trip structure (summary, budget, accommodation, itinerary).
    - Respond strictly with valid JSON only.
    - Keep overall consistency and readability.
    */
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

    /*
    🤖 Step 5: Call Groq Model
    --------------------------
    Sends the constructed prompt to the Groq LLaMA 3.1 Instant model.
    The model processes the user feedback and current trip data, then returns refined trip JSON.
    */
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant", // Model chosen for fast reasoning and lightweight outputs
      messages: [{ role: "user", content: prompt }], // The message structure Groq expects
    });

    // Extracts the message content returned by Groq
    let message = completion.choices[0].message?.content?.trim() || "{}";

    /*
    🧹 Step 6: Clean and Parse the Model Output
    -------------------------------------------
    AI models may sometimes include extra text before or after the JSON.
    This section locates the first '{' and last '}' to safely extract the JSON portion only.
    Then it attempts to parse the JSON. If parsing fails, it gracefully falls back to the original trip data.
    */
    const start = message.indexOf("{");
    const end = message.lastIndexOf("}") + 1;
    const jsonPart = message.slice(start, end);

    let refinedTrip;
    try {
      refinedTrip = JSON.parse(jsonPart); // Parse refined trip from cleaned string
    } catch (err) {
      console.warn("Failed to parse refined JSON:", err);
      refinedTrip = currentTrip; // Fallback to the previous trip if parsing fails
    }

    /*
    📤 Step 7: Send Successful Response
    -----------------------------------
    Returns the refined trip JSON to the frontend wrapped in a standardised object format:
      - ok: true (indicates success)
      - data: the refined trip JSON
    */
    return NextResponse.json({ ok: true, data: refinedTrip });

  } catch (error: any) {
    /*
    ⚠️ Step 8: Error Handling
    --------------------------
    If anything goes wrong (API error, network failure, JSON parsing issue),
    log the error to the console and return a 500 response with an appropriate message.
    */
    console.error("Refine error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to refine trip" },
      { status: 500 }
    );
  }
}
