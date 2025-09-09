import { z } from "zod";

// Base schema
const baseSchema = z.object({
  staffName: z.enum([
    "Mohammed",
    "Shelly",
    "Kemar", 
    "Dameon",
    "Carson",
    "Mahesh",
    "Sunil",
    "Praveen"
  ]),
  channel: z.enum([
    "In-store",
    "Phone", 
    "WhatsApp",
    "Instagram",
    "Facebook",
    "Email",
    "Other"
  ]),
  otherChannel: z.string().min(1).max(60).optional(),
  branch: z.enum(["Bridgetown", "Sheraton"]).optional(),
  category: z.enum([
    "Digital Cards",
    "Consoles", 
    "Games",
    "Accessories",
    "Repair/Service",
    "Pokemon Cards",
    "Electronics",
    "Other"
  ]),
  otherCategory: z.string().min(1).max(60).optional(),
  purchased: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
  wantedItem: z.string().min(1).max(120),
});

// Refined schema with conditional validation
export const interactionSchema = baseSchema
  .refine(
    (data) => {
      // If channel is "Other", otherChannel is required
      if (data.channel === "Other") {
        return data.otherChannel !== undefined && data.otherChannel.length > 0;
      }
      return true;
    },
    {
      message: "Please specify the channel",
      path: ["otherChannel"],
    }
  )
  .refine(
    (data) => {
      // If channel is "In-store", branch is required
      if (data.channel === "In-store") {
        return data.branch !== undefined;
      }
      return true;
    },
    {
      message: "Branch is required for in-store interactions",
      path: ["branch"],
    }
  )
  .refine(
    (data) => {
      // If category is "Other", otherCategory is required
      if (data.category === "Other") {
        return data.otherCategory !== undefined && data.otherCategory.length > 0;
      }
      return true;
    },
    {
      message: "Please specify the category",
      path: ["otherCategory"],
    }
  )
  .refine(
    (data) => {
      // If channel is In-store or WhatsApp, purchased is required
      if (data.channel === "In-store" || data.channel === "WhatsApp") {
        return data.purchased !== undefined;
      }
      return true;
    },
    {
      message: "Please specify if they made a purchase",
      path: ["purchased"],
    }
  )
  .refine(
    (data) => {
      // If purchased is false, outOfStock is required
      if (data.purchased === false) {
        return data.outOfStock !== undefined;
      }
      return true;
    },
    {
      message: "Please specify if the item was in stock",
      path: ["outOfStock"],
    }
  );

export type InteractionFormSchema = z.infer<typeof interactionSchema>;
