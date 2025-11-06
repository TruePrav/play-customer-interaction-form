import { NextRequest, NextResponse } from "next/server";
import { interactionSchema } from "@/lib/validation";
import type { InteractionPayload } from "@/types/interaction";
import { createClient } from "@supabase/supabase-js";

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
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn("Supabase not configured - data not saved:", JSON.stringify(payload, null, 2));
      return NextResponse.json(
        { 
          success: false, 
          error: "Database not configured. Please set up Supabase environment variables." 
        },
        { status: 500 }
      );
    }

    // Create a server-side Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Prepare the insert data - only include defined values
    const insertData: Record<string, any> = {
      timestamp: payload.timestamp,
      staff_name: payload.staffName,
      channel: payload.channel,
      category: payload.category,
      wanted_item: payload.wantedItem,
    };

    // Only add optional fields if they have values
    if (payload.otherChannel) {
      insertData.other_channel = payload.otherChannel;
    }
    if (payload.branch) {
      insertData.branch = payload.branch;
    }
    if (payload.otherCategory) {
      insertData.other_category = payload.otherCategory;
    }
    if (payload.purchased !== undefined) {
      insertData.purchased = payload.purchased;
    }
    if (payload.outOfStock !== undefined) {
      insertData.out_of_stock = payload.outOfStock;
    }

    console.log("Inserting data:", JSON.stringify(insertData, null, 2));

    // Save to Supabase
    const { data, error } = await supabase
      .from('interactions')
      .insert([insertData])
      .select();
    
    if (error) {
      console.error("Supabase error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${error.message}`,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error("No data returned from insert");
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to save interaction - no data returned" 
        },
        { status: 500 }
      );
    }

    console.log("Customer Interaction saved successfully to Supabase:", data);

    return NextResponse.json(
      { success: true, data: data[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing interaction:", error);
    
    if (error instanceof Error) {
      // Check if it's a validation error
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { success: false, error: "Validation error", details: error.message },
          { status: 400 }
        );
      }
      
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
