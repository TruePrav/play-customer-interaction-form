export type Channel =
  | "In-store"
  | "Phone"
  | "WhatsApp"
  | "Instagram"
  | "Facebook"
  | "Email"
  | "Other";

export type Branch = "Bridgetown" | "Sheraton";

export type Category =
  | "Digital Cards"
  | "Consoles"
  | "Games"
  | "Accessories"
  | "Repair/Service"
  | "Pokemon Cards"
  | "Electronics"
  | "Other";

export interface InteractionPayload {
  timestamp: string; // set on server
  channel: Channel;
  branch?: Branch; // required if channel = In-store
  category: Category;
  otherCategory?: string; // required if category = Other
  purchased: boolean;
  outOfStock?: boolean; // required if purchased = false
  wantedItem?: string; // required if outOfStock = true
}

export interface InteractionFormData {
  channel: Channel;
  branch?: Branch;
  category: Category;
  otherCategory?: string;
  purchased: boolean;
  outOfStock?: boolean;
  wantedItem?: string;
}
