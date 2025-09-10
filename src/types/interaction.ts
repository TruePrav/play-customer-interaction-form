export type StaffName =
  | "Mohammed"
  | "Shelly"
  | "Kemar"
  | "Dameon"
  | "Carson"
  | "Mahesh"
  | "Sunil"
  | "Praveen";

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
  staffName: string;
  channel: string;
  otherChannel?: string; // required if channel = Other
  branch?: string; // required if channel = In-store
  category: string;
  otherCategory?: string; // required if category = Other
  wantedItem: string; // always required
  purchased?: boolean; // required if channel = In-store or WhatsApp
  outOfStock?: boolean; // required if purchased = false
}

export interface InteractionFormData {
  staffName: string;
  channel: string;
  otherChannel?: string;
  branch?: string;
  category: string;
  otherCategory?: string;
  wantedItem: string;
  purchased?: boolean;
  outOfStock?: boolean;
}
