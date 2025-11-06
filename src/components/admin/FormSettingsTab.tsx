"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface FormOption {
  id: number;
  name: string;
  active: boolean;
  display_order: number;
}

type OptionType = "staff" | "channel" | "category" | "branch";

const OPTION_TYPES: { type: OptionType; label: string; table: string }[] = [
  { type: "staff", label: "Staff Members", table: "staff_members" },
  { type: "channel", label: "Channels", table: "channels" },
  { type: "category", label: "Categories", table: "categories" },
  { type: "branch", label: "Branches", table: "branches" },
];

export default function FormSettingsTab() {
  const [activeTab, setActiveTab] = useState<OptionType>("staff");
  const [options, setOptions] = useState<FormOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { loading: authLoading, sessionReady, session } = useAuth();

  const fetchOptions = async (retryCount = 0) => {
    try {
      setLoading(true);
      const table = OPTION_TYPES.find((t) => t.type === activeTab)?.table;
      if (!table) return;

      // Ensure we have a session before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Wait a bit and retry if no session yet
        if (retryCount < 3) {
          setTimeout(() => fetchOptions(retryCount + 1), 500);
          return;
        }
        throw new Error('No active session. Please log in again.');
      }

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        // Retry on auth errors
        if ((error.message.includes('JWT') || error.message.includes('session')) && retryCount < 2) {
          setTimeout(() => fetchOptions(retryCount + 1), 1000);
          return;
        }
        throw error;
      }
      
      setOptions(data || []);
    } catch (err) {
      toast.error(`Failed to fetch ${activeTab}: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const table = OPTION_TYPES.find((t) => t.type === activeTab)?.table;
      if (!table) return;

      const maxOrder = Math.max(0, ...options.map((o) => o.display_order));
      
      const { error } = await supabase.from(table).insert({
        name: newName.trim(),
        active: true,
        display_order: maxOrder + 1,
      });

      if (error) throw error;

      toast.success(`${OPTION_TYPES.find((t) => t.type === activeTab)?.label.slice(0, -1)} added successfully`);
      setNewName("");
      setIsAdding(false);
      fetchOptions();
    } catch (err) {
      toast.error(`Failed to add: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleUpdate = async (id: number, updates: Partial<FormOption>) => {
    try {
      const table = OPTION_TYPES.find((t) => t.type === activeTab)?.table;
      if (!table) return;

      const { error } = await supabase
        .from(table)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast.success("Updated successfully");
      setEditingId(null);
      fetchOptions();
    } catch (err) {
      toast.error(`Failed to update: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const table = OPTION_TYPES.find((t) => t.type === activeTab)?.table;
      if (!table) return;

      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) throw error;

      toast.success("Deleted successfully");
      fetchOptions();
    } catch (err) {
      toast.error(`Failed to delete: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const handleMove = async (id: number, direction: "up" | "down") => {
    const index = options.findIndex((o) => o.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === options.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const item1 = options[index];
    const item2 = options[newIndex];

    try {
      const table = OPTION_TYPES.find((t) => t.type === activeTab)?.table;
      if (!table) return;

      // Swap display orders
      await supabase
        .from(table)
        .update({ display_order: item2.display_order, updated_at: new Date().toISOString() })
        .eq("id", item1.id);

      await supabase
        .from(table)
        .update({ display_order: item1.display_order, updated_at: new Date().toISOString() })
        .eq("id", item2.id);

      fetchOptions();
    } catch (err) {
      toast.error(`Failed to move: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  useEffect(() => {
    // Wait for auth to finish loading AND ensure session is ready
    if (!authLoading && sessionReady && session) {
      // Session is ready, fetch data
      fetchOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, authLoading, sessionReady, session]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Form Settings</h3>
        <p className="text-sm text-gray-600">
          Manage the options available in the customer interaction form
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px space-x-8">
          {OPTION_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === type
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Add New */}
          {isAdding ? (
            <div className="bg-gray-50 rounded-lg p-4 flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={`Enter ${OPTION_TYPES.find((t) => t.type === activeTab)?.label.slice(0, -1).toLowerCase()}`}
                className="flex-1 text-gray-900 bg-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewName("");
                  }
                }}
                autoFocus
              />
              <Button onClick={handleAdd}>Add</Button>
              <Button onClick={() => { setIsAdding(false); setNewName(""); }} variant="outline">
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsAdding(true)}>+ Add New</Button>
          )}

          {/* Options List */}
          <div className="space-y-2">
            {options.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No items found</p>
            ) : (
              options.map((option, index) => (
                <div
                  key={option.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(option.id, "up")}
                      disabled={index === 0}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMove(option.id, "down")}
                      disabled={index === options.length - 1}
                      className="text-gray-700 hover:text-gray-900"
                    >
                      ↓
                    </Button>
                  </div>

                  {editingId === option.id ? (
                    <div className="flex-1 flex gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleUpdate(option.id, { name: newName.trim() });
                          }
                          if (e.key === "Escape") {
                            setEditingId(null);
                            setNewName("");
                          }
                        }}
                        autoFocus
                        className="flex-1 text-gray-900 bg-white"
                      />
                      <Button
                        onClick={() => handleUpdate(option.id, { name: newName.trim() })}
                        size="sm"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingId(null);
                          setNewName("");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1">
                        <span className={`font-medium text-gray-900 ${!option.active ? "text-gray-500 line-through" : ""}`}>
                          {option.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={option.active}
                            onChange={(e) =>
                              handleUpdate(option.id, { active: e.target.checked })
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-gray-800 font-medium">Active</span>
                        </label>
                        <Button
                          onClick={() => {
                            setEditingId(option.id);
                            setNewName(option.name);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(option.id)}
                          variant="destructive"
                          size="sm"
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

