"use client";

import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function QueryBox() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setAnswer("");
    
    try {
      const res = await apiFetch("/query", {
        method: "POST",
        body: JSON.stringify({ query }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      setAnswer(data.answer || "No answer received.");
    } catch (e) {
      setAnswer("Failed to get answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAsk} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
          className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button 
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
        >
          {loading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {answer && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex gap-3 items-start">
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-gray-800 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
