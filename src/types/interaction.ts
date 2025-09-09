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
  staffName: StaffName;
  channel: Channel;
  otherChannel?: string; // required if channel = Other
  branch?: Branch; // required if channel = In-store
  category: Category;
  otherCategory?: string; // required if category = Other
  wantedItem: string; // always required
  purchased?: boolean; // required if channel = In-store or WhatsApp
  outOfStock?: boolean; // required if purchased = false
}

export interface InteractionFormData {
  staffName: StaffName;
  channel: Channel;
  otherChannel?: string;
  branch?: Branch;
  category: Category;
  otherCategory?: string;
  wantedItem: string;
  purchased?: boolean;
  outOfStock?: boolean;
}
