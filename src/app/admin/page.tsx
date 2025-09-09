"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

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

function AdminContent() {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    fetchInteractions();
  }, []);

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setInteractions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch interactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getChannelDisplay = (channel: string, otherChannel?: string) => {
    return channel === 'Other' && otherChannel ? otherChannel : channel;
  };

  const getCategoryDisplay = (category: string, otherCategory?: string) => {
    return category === 'Other' && otherCategory ? otherCategory : category;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading interactions...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={fetchInteractions}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">PLAY Barbados</h1>
          <h2 className="text-xl font-semibold text-slate-200 mb-2">Customer Interactions Admin</h2>
          <p className="text-slate-300">View and manage customer interaction data</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              Recent Interactions ({interactions.length})
            </h3>
            <div className="flex gap-3">
              <button
                onClick={fetchInteractions}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={signOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>

          {interactions.length === 0 ? (
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
                  {interactions.map((interaction) => (
                    <tr key={interaction.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                        {interaction.branch || '-'}
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
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminContent />
    </ProtectedRoute>
  );
}
