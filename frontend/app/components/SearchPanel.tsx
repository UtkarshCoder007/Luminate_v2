"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/config";

interface LogResult {
    id: string;
    timestamp: string;
    serviceName: string;
    logLevel: string;
    message: string;
    traceId: string;
    stackTrace?: string;
    highlights?: Record<string, string[]>;
}

interface SearchResponse {
    results: LogResult[];
    total: number;
    pageSize: number;
    nextCursor: string[] | null;
}

const LOG_LEVELS = ["", "DEBUG", "INFO", "WARN", "ERROR", "FATAL"];

const LEVEL_COLORS: Record<string, string> = {
    DEBUG: "text-gray-400 bg-gray-800",
    INFO: "text-blue-400 bg-blue-950",
    WARN: "text-yellow-400 bg-yellow-950",
    ERROR: "text-red-400 bg-red-950",
    FATAL: "text-red-300 bg-red-900 font-bold",
};

/**
 * Search panel wired to GET /api/v1/search.
 * Supports full-text query, service filter, level filter, and pagination.
 */
export default function SearchPanel() {
    const [query, setQuery] = useState("");
    const [service, setService] = useState("");
    const [level, setLevel] = useState("");
    const [results, setResults] = useState<LogResult[]>([]);
    const [total, setTotal] = useState(0);
    const [cursor, setCursor] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);

    const buildUrl = (nextCursor?: string[] | null) => {
        const params = new URLSearchParams();
        if (query) params.set("query", query);
        if (service) params.set("service", service);
        if (level) params.set("level", level);
        params.set("pageSize", "20");
        if (nextCursor) {
            nextCursor.forEach((c) => params.append("cursor", c));
        }
        return `${API_BASE}/search?${params.toString()}`;
    };

    const search = async (append = false) => {
        try {
            setLoading(true);
            const url = buildUrl(append ? cursor : null);
            const res = await fetch(url);
            const json: SearchResponse = await res.json();

            setResults(append ? [...results, ...json.results] : json.results);
            setTotal(json.total);
            setCursor(json.nextCursor);
            setSearched(true);
        } catch (err) {
            console.error("Search failed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") search();
    };

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleString([], {
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <h2 className="text-white font-semibold mb-3">Search Logs</h2>

            {/* Search Controls */}
            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    placeholder="Search messages, stack traces..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2
                     text-sm text-gray-200 placeholder-gray-500
                     focus:outline-none focus:border-blue-500"
                />
                <input
                    type="text"
                    placeholder="Service name"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-40 bg-gray-800 border border-gray-600 rounded px-3 py-2
                     text-sm text-gray-200 placeholder-gray-500
                     focus:outline-none focus:border-blue-500"
                />
                <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-28 bg-gray-800 border border-gray-600 rounded px-3 py-2
                     text-sm text-gray-200 focus:outline-none focus:border-blue-500"
                >
                    {LOG_LEVELS.map((l) => (
                        <option key={l} value={l}>
                            {l || "All levels"}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => search()}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900
                     text-white text-sm font-medium rounded transition-colors"
                >
                    {loading ? "Searching..." : "Search"}
                </button>
            </div>

            {/* Results */}
            {searched && (
                <div className="text-xs text-gray-500 mb-2">
                    {total} result{total !== 1 ? "s" : ""}
                </div>
            )}

            <div className="space-y-1 max-h-96 overflow-y-auto">
                {results.map((log) => (
                    <div
                        key={log.id}
                        className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-xs"
                    >
                        <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-500 font-mono">
                {formatTime(log.timestamp)}
              </span>
                            <span className="text-gray-300 font-medium">{log.serviceName}</span>
                            <span
                                className={`px-1.5 py-0.5 rounded text-xs font-mono ${
                                    LEVEL_COLORS[log.logLevel] || "text-gray-400"
                                }`}
                            >
                {log.logLevel}
              </span>
                            <span className="text-gray-500 font-mono ml-auto">
                {log.traceId}
              </span>
                        </div>
                        <div
                            className="text-gray-300"
                            dangerouslySetInnerHTML={{
                                __html:
                                    log.highlights?.message?.[0] ||
                                    log.message,
                            }}
                        />
                        {log.stackTrace && (
                            <div className="text-gray-500 font-mono mt-1 truncate">
                                {log.highlights?.stackTrace?.[0] || log.stackTrace}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Load More */}
            {cursor && results.length > 0 && (
                <button
                    onClick={() => search(true)}
                    disabled={loading}
                    className="mt-3 w-full py-2 bg-gray-800 hover:bg-gray-700
                     text-gray-400 text-xs rounded transition-colors"
                >
                    Load more
                </button>
            )}
        </div>
    );
}