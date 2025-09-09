import { z } from "zod";
import type { InteractionFormData } from "@/types/interaction";

// Base schema
const baseSchema = z.object({
  channel: z.enum([
    "In-store",
    "Phone", 
    "WhatsApp",
    "Instagram",
    "Facebook",
    "Email",
    "Other"
  ]),
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
  purchased: z.boolean(),
  outOfStock: z.boolean().optional(),
  wantedItem: z.string().min(1).max(120).optional(),
});

// Refined schema with conditional validation
export const interactionSchema = baseSchema
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
      // If purchased is false, outOfStock is required
      if (data.purchased === false) {
        return data.outOfStock !== undefined;
      }
      return true;
    },
    {
      message: "Please specify if the item was out of stock",
      path: ["outOfStock"],
    }
  )
  .refine(
    (data) => {
      // If outOfStock is true, wantedItem is required
      if (data.outOfStock === true) {
        return data.wantedItem !== undefined && data.wantedItem.length > 0;
      }
      return true;
    },
    {
      message: "Please specify what they wanted",
      path: ["wantedItem"],
    }
  );

export type InteractionFormSchema = z.infer<typeof interactionSchema>;
