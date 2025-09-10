import { z } from "zod";

// Base schema
const baseSchema = z.object({
  staffName: z.string(),
  channel: z.string(),
  otherChannel: z.string().max(60).optional(),
  branch: z.string().optional(),
  category: z.string(),
  otherCategory: z.string().max(60).optional(),
  purchased: z.boolean().optional(),
  outOfStock: z.boolean().optional(),
  wantedItem: z.string().min(1).max(120),
});

// Refined schema with conditional validation
export const interactionSchema = baseSchema
  .refine(
    (data) => {
      // Staff name is required
      return data.staffName && data.staffName.trim().length > 0;
    },
    {
      message: "Please select a staff member",
      path: ["staffName"],
    }
  )
  .refine(
    (data) => {
      // Channel is required
      return data.channel && data.channel.trim().length > 0;
    },
    {
      message: "Please select a channel",
      path: ["channel"],
    }
  )
  .refine(
    (data) => {
      // Category is required
      return data.category && data.category.trim().length > 0;
    },
    {
      message: "Please select a category",
      path: ["category"],
    }
  )
  .refine(
    (data) => {
      // If channel is "Other", otherChannel is required
      if (data.channel === "Other") {
        return data.otherChannel && data.otherChannel.trim().length > 0;
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
        return data.branch && data.branch.trim().length > 0;
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
        return data.otherCategory && data.otherCategory.trim().length > 0;
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
