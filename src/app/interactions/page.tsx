"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { interactionSchema, type InteractionFormSchema } from "@/lib/validation";
import type { Channel, Branch, Category } from "@/types/interaction";

const CHANNELS: Channel[] = [
  "In-store",
  "Phone",
  "WhatsApp", 
  "Instagram",
  "Facebook",
  "Email",
  "Other"
];

const BRANCHES: Branch[] = ["Bridgetown", "Sheraton"];

const CATEGORIES: Category[] = [
  "Digital Cards",
  "Consoles",
  "Games", 
  "Accessories",
  "Repair/Service",
  "Pokemon Cards",
  "Electronics",
  "Other"
];

const STAFF_MEMBERS = [
  "Mohammed",
  "Shelly", 
  "Kemar",
  "Dameon",
  "Carson",
  "Mahesh",
  "Sunil",
  "Praveen"
];

export default function InteractionsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLDivElement>(null);

  const form = useForm<InteractionFormSchema>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      staffName: undefined,
      channel: undefined,
      otherChannel: "",
      branch: undefined,
      category: undefined,
      otherCategory: "",
      purchased: undefined,
      outOfStock: undefined,
      wantedItem: "",
    },
  });

  const watchedChannel = form.watch("channel");
  const watchedCategory = form.watch("category");
  const watchedPurchased = form.watch("purchased");

  // Autofocus the first field
  useEffect(() => {
    if (firstFieldRef.current) {
      const firstRadio = firstFieldRef.current.querySelector('input[type="radio"]') as HTMLInputElement;
      if (firstRadio) {
        firstRadio.focus();
      }
    }
  }, []);

  // Handle Enter key submission
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      form.handleSubmit(onSubmit)();
    }
  };

  const onSubmit = async (data: InteractionFormSchema) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/interactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Clear all form errors first
        form.clearErrors();
        
        // Reset form to default values - use empty strings for all fields
        form.reset({
          staffName: "",
          channel: "",
          otherChannel: "",
          branch: "",
          category: "",
          otherCategory: "",
          purchased: undefined,
          outOfStock: undefined,
          wantedItem: "",
        });
        
        // Force form to re-render and clear validation state
        setTimeout(() => {
          form.clearErrors();
          // Force a re-render by setting values again
          form.setValue("staffName", "");
          form.setValue("channel", "");
          form.setValue("branch", "");
          form.setValue("category", "");
        }, 50);
        
        toast.success("Interaction saved successfully!");
        
        // Auto-focus the staff name dropdown for the next interaction
        setTimeout(() => {
          const staffSelect = document.querySelector('[data-name="staffName"] button') as HTMLButtonElement;
          if (staffSelect) {
            staffSelect.focus();
          }
        }, 100);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg">
              <span className="text-2xl font-bold text-slate-700">P</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              PLAY Barbados
            </h1>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Customer Interaction
            </h2>
            <div className="w-16 h-1 bg-slate-200 mx-auto rounded-full"></div>
          </div>
          <p className="text-slate-200 text-base">
            Quick form for staff to log customer interactions
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} onKeyDown={handleKeyDown} className="space-y-6">
            {/* Staff Name */}
            <FormField
              control={form.control}
              name="staffName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Staff Name *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger 
                        className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        data-name="staffName"
                      >
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STAFF_MEMBERS.map((staff) => (
                        <SelectItem key={staff} value={staff}>
                          {staff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Channel */}
            <FormField
              control={form.control}
              name="channel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Channel *</FormLabel>
                  <FormControl>
                    <div ref={firstFieldRef}>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-3 gap-3"
                      >
                      {CHANNELS.map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={channel}
                            id={channel}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={channel}
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-blue-50 hover:border-blue-400 hover:shadow-lg ${
                              field.value === channel
                                ? "border-4 border-blue-600 bg-blue-600 text-white shadow-xl ring-2 ring-blue-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            {channel}
                          </Label>
                        </div>
                      ))}
                      </RadioGroup>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Channel - only show if Other */}
            {watchedChannel === "Other" && (
              <FormField
                control={form.control}
                name="otherChannel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Specify Channel *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., TikTok, Snapchat, Website chat"
                        className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Branch - only show if In-store */}
            {watchedChannel === "In-store" && (
              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                                  <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Branch *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-16 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg">
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                    </FormControl>
                      <SelectContent>
                        {BRANCHES.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-16 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Other Category - only show if Other */}
            {watchedCategory === "Other" && (
              <FormField
                control={form.control}
                name="otherCategory"
                render={({ field }) => (
                                  <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-800">Specify Category *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter category"
                      className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Which item were they interested in - show for all interactions */}
            {watchedChannel && (
              <FormField
                control={form.control}
                name="wantedItem"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Which item were they interested in? *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Roblox $50, PS5 controller, SD card 128GB"
                        className="h-14 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-medium hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Did they make a purchase - only show for In-store and WhatsApp */}
            {(watchedChannel === "In-store" || watchedChannel === "WhatsApp") && (
              <FormField
                control={form.control}
                name="purchased"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Did they make a purchase? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="true"
                            id="purchased-yes"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="purchased-yes"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-green-50 hover:border-green-400 hover:shadow-lg ${
                              field.value === true
                                ? "border-4 border-green-600 bg-green-600 text-white shadow-xl ring-2 ring-green-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="false"
                            id="purchased-no"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="purchased-no"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-red-50 hover:border-red-400 hover:shadow-lg ${
                              field.value === false
                                ? "border-4 border-red-600 bg-red-600 text-white shadow-xl ring-2 ring-red-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Was the item in stock - only show if purchased = false */}
            {watchedPurchased === false && (
              <FormField
                control={form.control}
                name="outOfStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold text-gray-800">Was the item in stock? *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(value === "true")}
                        value={field.value?.toString()}
                        className="grid grid-cols-2 gap-3"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="true"
                            id="outofstock-yes"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="outofstock-yes"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-orange-50 hover:border-orange-400 hover:shadow-lg ${
                              field.value === true
                                ? "border-4 border-orange-600 bg-orange-600 text-white shadow-xl ring-2 ring-orange-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            Yes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="false"
                            id="outofstock-no"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="outofstock-no"
                            className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-4 text-sm font-semibold transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 hover:shadow-lg ${
                              field.value === false
                                ? "border-4 border-gray-600 bg-gray-600 text-white shadow-xl ring-2 ring-gray-200"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            No
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                className="w-full h-16 text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-slate-950 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : (
                  "Save Interaction"
                )}
              </Button>
            </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
