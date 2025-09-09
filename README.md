# Customer Interaction Form

A fast, mobile-friendly web form for staff to log customer interactions in under 30 seconds.

## Features

- **Quick Form**: Designed for completion in under 30 seconds
- **Mobile-First**: Large tap targets and mobile-optimized layout
- **Conditional Fields**: Smart form logic that shows/hides fields based on selections
- **Validation**: Comprehensive form validation with inline error messages
- **Keyboard Support**: Enter key submits when form is valid
- **Toast Notifications**: Success/error feedback using Sonner

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Hook Form** for form management
- **Zod** for validation
- **Sonner** for toast notifications

## Form Fields

### Required Fields
- **Channel**: In-store, Phone, WhatsApp, Instagram, Facebook, Email, Other
- **Category**: Digital Cards, Consoles, Games, Accessories, Repair/Service, Pokemon Cards, Electronics, Other
- **Did They Purchase**: Yes/No

### Conditional Fields
- **Branch**: Required if Channel = "In-store" (Bridgetown, Sheraton)
- **Other Category**: Required if Category = "Other" (1-60 characters)
- **Out of Stock**: Required if Purchase = "No" (Yes/No)
- **Wanted Item**: Required if Out of Stock = "Yes" (1-120 characters)

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoint

The form submits to `/api/interactions` with a POST request containing the validated form data.

### Payload Structure
```typescript
interface InteractionPayload {
  timestamp: string; // set on server
  channel: Channel;
  branch?: Branch; // required if channel = In-store
  category: Category;
  otherCategory?: string; // required if category = Other
  purchased: boolean;
  outOfStock?: boolean; // required if purchased = false
  wantedItem?: string; // required if outOfStock = true
}
```

## Supabase Integration

The API route is ready for Supabase integration. Uncomment the Supabase code in `src/app/api/interactions/route.ts` and configure your Supabase client.

## Project Structure

```
src/
├── app/
│   ├── api/interactions/route.ts  # API endpoint
│   ├── interactions/page.tsx      # Main form page
│   ├── layout.tsx                 # Root layout with Toaster
│   └── page.tsx                   # Home page (redirects to form)
├── components/ui/                 # shadcn/ui components
├── lib/
│   ├── validation.ts              # Zod schema
│   └── utils.ts                   # Utility functions
└── types/
    └── interaction.ts             # TypeScript types
```

## Validation Rules

- All required fields must be filled
- Conditional fields are validated based on parent field values
- Text inputs have character limits (Other Category: 1-60, Wanted Item: 1-120)
- Form shows inline error messages only when fields are touched or on submit

## UX Features

- **Autofocus**: First field is automatically focused on page load
- **Large Tap Targets**: All interactive elements are sized for easy mobile interaction
- **Visual Feedback**: Color-coded radio buttons and clear visual states
- **Sticky Submit**: Submit button is pinned at bottom on mobile
- **Form Reset**: Form clears after successful submission
- **Loading States**: Submit button shows loading state during submission