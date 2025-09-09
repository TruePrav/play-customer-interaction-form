import { NextRequest, NextResponse } from "next/server";
import { interactionSchema } from "@/lib/validation";
import type { InteractionPayload } from "@/types/interaction";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = interactionSchema.parse(body);
    
    // Create the payload with timestamp
    const payload: InteractionPayload = {
      timestamp: new Date().toISOString(),
      channel: validatedData.channel,
      branch: validatedData.branch,
      category: validatedData.category,
      otherCategory: validatedData.otherCategory,
      purchased: validatedData.purchased,
      outOfStock: validatedData.outOfStock,
      wantedItem: validatedData.wantedItem,
    };

    // Log the payload (in a real app, you'd save to Supabase here)
    console.log("Customer Interaction:", JSON.stringify(payload, null, 2));

    // TODO: Save to Supabase table
    // const { data, error } = await supabase
    //   .from('interactions')
    //   .insert([payload]);
    
    // if (error) {
    //   throw error;
    // }

    return NextResponse.json(
      { success: true, data: payload },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing interaction:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
