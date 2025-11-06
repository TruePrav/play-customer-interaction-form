"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Interaction {
  id: number;
  timestamp: string;
  staff_name: string;
  channel: string;
  other_channel?: string;
  branch?: string;
  category: string;
  other_category?: string;
  wanted_item: string;
  purchased?: boolean;
  out_of_stock?: boolean;
  created_at: string;
}

interface Filters {
  startDate: string;
  endDate: string;
  staffName: string;
  channel: string;
  branch: string;
  category: string;
  purchased: string;
}

export default function InteractionsTab() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [filteredInteractions, setFilteredInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { signOut, loading: authLoading, sessionReady, session } = useAuth();
  
  const [filters, setFilters] = useState<Filters>({
    startDate: "",
    endDate: "",
    staffName: "__all__",
    channel: "__all__",
    branch: "__all__",
    category: "__all__",
    purchased: "__all__",
  });

  const [staffOptions, setStaffOptions] = useState<string[]>([]);
  const [channelOptions, setChannelOptions] = useState<string[]>([]);
  const [branchOptions, setBranchOptions] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  const applyFilters = () => {
    let filtered = [...interactions];

    if (filters.startDate) {
      filtered = filtered.filter(
        (i) => new Date(i.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((i) => new Date(i.timestamp) <= endDate);
    }

    if (filters.staffName && filters.staffName !== "__all__") {
      filtered = filtered.filter((i) => i.staff_name === filters.staffName);
    }

    if (filters.channel && filters.channel !== "__all__") {
      filtered = filtered.filter((i) => i.channel === filters.channel);
    }

    if (filters.branch && filters.branch !== "__all__") {
      filtered = filtered.filter((i) => i.branch === filters.branch);
    }

    if (filters.category && filters.category !== "__all__") {
      filtered = filtered.filter((i) => i.category === filters.category);
    }

    if (filters.purchased && filters.purchased !== "__all__") {
      if (filters.purchased === "null") {
        filtered = filtered.filter((i) => i.purchased === null);
      } else {
        const purchased = filters.purchased === "true";
        filtered = filtered.filter((i) => i.purchased === purchased);
      }
    }

    setFilteredInteractions(filtered);
  };

  useEffect(() => {
    // Wait for auth to finish loading AND ensure session is ready
    if (!authLoading && sessionReady && session) {
      // Session is ready, fetch data
      fetchInteractions();
      fetchFormOptions();
    }
  }, [authLoading, sessionReady, session]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, interactions]);

  const fetchFormOptions = async () => {
    try {
      // Fetch staff members
      const { data: staffData } = await supabase
        .from('staff_members')
        .select('name')
        .eq('active', true)
        .order('display_order');
      
      if (staffData) {
        setStaffOptions(staffData.map(s => s.name));
      }

      // Fetch channels
      const { data: channelData } = await supabase
        .from('channels')
        .select('name')
        .eq('active', true)
        .order('display_order');
      
      if (channelData) {
        setChannelOptions(channelData.map(c => c.name));
      }

      // Fetch branches
      const { data: branchData } = await supabase
        .from('branches')
        .select('name')
        .eq('active', true)
        .order('display_order');
      
      if (branchData) {
        setBranchOptions(branchData.map(b => b.name));
      }

      // Fetch categories
      const { data: categoryData } = await supabase
        .from('categories')
        .select('name')
        .eq('active', true)
        .order('display_order');
      
      if (categoryData) {
        setCategoryOptions(categoryData.map(c => c.name));
      }
    } catch (err) {
      console.error('Error fetching form options:', err);
    }
  };

  const fetchInteractions = async (retryCount = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Ensure we have a session before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Wait a bit and retry if no session yet
        if (retryCount < 3) {
          setTimeout(() => fetchInteractions(retryCount + 1), 500);
          return;
        }
        throw new Error('No active session. Please log in again.');
      }

      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Retry on auth errors
        if ((error.message.includes('JWT') || error.message.includes('session')) && retryCount < 2) {
          console.log('Session error, retrying...', retryCount);
          setTimeout(() => fetchInteractions(retryCount + 1), 1000);
          return;
        }
        throw error;
      }

      setInteractions(data || []);
      setFilteredInteractions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interactions');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      staffName: "__all__",
      channel: "__all__",
      branch: "__all__",
      category: "__all__",
      purchased: "__all__",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Staff Name",
      "Channel",
      "Other Channel",
      "Branch",
      "Category",
      "Other Category",
      "Wanted Item",
      "Purchased",
      "Out of Stock",
    ];

    const rows = filteredInteractions.map((i) => [
      new Date(i.timestamp).toLocaleString(),
      i.staff_name,
      i.channel,
      i.other_channel || "",
      i.branch || "",
      i.category,
      i.other_category || "",
      i.wanted_item,
      i.purchased === true ? "Yes" : i.purchased === false ? "No" : "",
      i.out_of_stock === true ? "No" : i.out_of_stock === false ? "Yes" : "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `interactions_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChannelDisplay = (channel: string, otherChannel?: string) => {
    return channel === "Other" && otherChannel ? otherChannel : channel;
  };

  const getCategoryDisplay = (category: string, otherCategory?: string) => {
    return category === "Other" && otherCategory ? otherCategory : category;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading interactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchInteractions}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">
            Interactions ({filteredInteractions.length})
          </h3>
          {filteredInteractions.length !== interactions.length && (
            <p className="text-sm text-gray-500">
              Showing {filteredInteractions.length} of {interactions.length} total
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchInteractions} variant="outline">
            Refresh
          </Button>
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
            Export CSV
          </Button>
          <Button onClick={signOut} variant="destructive">
            Logout
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">Filters</h4>
          <Button onClick={clearFilters} variant="ghost" size="sm">
            Clear All
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="startDate" className="text-gray-900 font-medium">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 text-gray-900 bg-white"
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="text-gray-900 font-medium">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 text-gray-900 bg-white"
            />
          </div>

          <div>
            <Label htmlFor="staffName" className="text-gray-900 font-medium">Staff Name</Label>
            <Select
              value={filters.staffName}
              onValueChange={(value) => setFilters({ ...filters, staffName: value })}
            >
              <SelectTrigger className="mt-1 text-gray-900 bg-white">
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Staff</SelectItem>
                {staffOptions.map((staff) => (
                  <SelectItem key={staff} value={staff}>
                    {staff}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="channel" className="text-gray-900 font-medium">Channel</Label>
            <Select
              value={filters.channel}
              onValueChange={(value) => setFilters({ ...filters, channel: value })}
            >
              <SelectTrigger className="mt-1 text-gray-900 bg-white">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Channels</SelectItem>
                {channelOptions.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="branch" className="text-gray-900 font-medium">Branch</Label>
            <Select
              value={filters.branch}
              onValueChange={(value) => setFilters({ ...filters, branch: value })}
            >
              <SelectTrigger className="mt-1 text-gray-900 bg-white">
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Branches</SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch} value={branch}>
                    {branch}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="category" className="text-gray-900 font-medium">Category</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters({ ...filters, category: value })}
            >
              <SelectTrigger className="mt-1 text-gray-900 bg-white">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="purchased" className="text-gray-900 font-medium">Purchased</Label>
            <Select
              value={filters.purchased}
              onValueChange={(value) => setFilters({ ...filters, purchased: value })}
            >
              <SelectTrigger className="mt-1 text-gray-900 bg-white">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
                <SelectItem value="null">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredInteractions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No interactions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Staff</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Channel</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Branch</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Category</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Item</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">Purchase</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-800">In Stock</th>
              </tr>
            </thead>
            <tbody>
              {filteredInteractions.map((interaction) => (
                <tr
                  key={interaction.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {formatDate(interaction.timestamp)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {interaction.staff_name}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {getChannelDisplay(interaction.channel, interaction.other_channel)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {interaction.branch || "-"}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {getCategoryDisplay(interaction.category, interaction.other_category)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-700">
                    {interaction.wanted_item}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {interaction.purchased === true ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Yes
                      </span>
                    ) : interaction.purchased === false ? (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                        No
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {interaction.out_of_stock === true ? (
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        No
                      </span>
                    ) : interaction.out_of_stock === false ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

