import { NextRequest, NextResponse } from "next/server";
import { interactionSchema } from "@/lib/validation";
import type { InteractionPayload } from "@/types/interaction";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received request body:", JSON.stringify(body, null, 2));
    
    // Validate the request body
    const validatedData = interactionSchema.parse(body);
    console.log("Validated data:", JSON.stringify(validatedData, null, 2));
    
    // Create the payload with timestamp
    const payload: InteractionPayload = {
      timestamp: new Date().toISOString(),
      staffName: validatedData.staffName,
      channel: validatedData.channel,
      otherChannel: validatedData.otherChannel,
      branch: validatedData.branch,
      category: validatedData.category,
      otherCategory: validatedData.otherCategory,
      purchased: validatedData.purchased,
      outOfStock: validatedData.outOfStock,
      wantedItem: validatedData.wantedItem,
    };

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co') {
      // Save to Supabase
      const { data, error } = await supabase
        .from('interactions')
        .insert([{
          timestamp: payload.timestamp,
          staff_name: payload.staffName,
          channel: payload.channel,
          other_channel: payload.otherChannel,
          branch: payload.branch,
          category: payload.category,
          other_category: payload.otherCategory,
          wanted_item: payload.wantedItem,
          purchased: payload.purchased,
          out_of_stock: payload.outOfStock,
        }])
        .select();
      
      if (error) {
        console.error("Supabase error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log("Customer Interaction saved to Supabase:", data);
    } else {
      // Fallback: Just log the data (for testing without Supabase setup)
      console.log("Customer Interaction (Supabase not configured):", JSON.stringify(payload, null, 2));
    }

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
