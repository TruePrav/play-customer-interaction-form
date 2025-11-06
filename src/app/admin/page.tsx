"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import InteractionsTab from "@/components/admin/InteractionsTab";
import FormSettingsTab from "@/components/admin/FormSettingsTab";

type Tab = "interactions" | "settings";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("interactions");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">PLAY Barbados</h1>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">Customer Interactions Admin</h2>
            <p className="text-slate-300">View and manage customer interaction data</p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-2xl mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("interactions")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "interactions"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Interactions
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "settings"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Form Settings
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === "interactions" && <InteractionsTab />}
              {activeTab === "settings" && <FormSettingsTab />}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
