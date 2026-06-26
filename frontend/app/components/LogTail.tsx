"use client";

import { useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/config";

interface LogEntry {
    id: string;
    timestamp: string;
    serviceName: string;
    logLevel: string;
    message: string;
    traceId: string;
    stackTrace?: string;
}

const LEVEL_COLORS: Record<string, string> = {
    DEBUG: "text-gray-500",
    INFO: "text-blue-400",
    WARN: "text-yellow-400",
    ERROR: "text-red-400",
    FATAL: "text-red-300 font-bold",
};

/**
 * Live log tail using Server-Sent Events.
 * Loads recent history on connect, then streams new logs in real-time.
 * Auto-scrolls to bottom as new logs arrive.
 * Caps at 200 entries to prevent memory growth.
 */
export default function LogTail() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [connected, setConnected] = useState(false);
    const [paused, setPaused] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const pausedRef = useRef(false);

    useEffect(() => {
        const eventSource = new EventSource(`${API_BASE}/logs/stream`);

        eventSource.addEventListener("log", (e) => {
            if (pausedRef.current) return;
            try {
                const log: LogEntry = JSON.parse(e.data);
                setLogs((prev) => {
                    const updated = [...prev, log];
                    // Cap at 200 entries
                    return updated.length > 200 ? updated.slice(-200) : updated;
                });
            } catch (err) {
                console.error("Failed to parse SSE log", err);
            }
        });

        eventSource.addEventListener("ping", () => {
            // Keepalive received — connection healthy
        });

        eventSource.onopen = () => setConnected(true);
        eventSource.onerror = () => setConnected(false);

        return () => {
            eventSource.close();
            setConnected(false);
        };
    }, []);

    // Auto-scroll to bottom when new logs arrive
    useEffect(() => {
        if (!pausedRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs]);

    const togglePause = () => {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
    };

    const formatTime = (ts: string) =>
        new Date(ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-white font-semibold">Live Log Tail</h2>
                    <div className={`w-2 h-2 rounded-full ${
                        connected ? "bg-green-400 animate-pulse" : "bg-red-400"
                    }`} />
                    <span className="text-xs text-gray-500">
            {connected ? "connected" : "disconnected"}
          </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{logs.length} entries</span>
                    <button
                        onClick={togglePause}
                        className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                            paused
                                ? "bg-green-700 hover:bg-green-600 text-white"
                                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                        }`}
                    >
                        {paused ? "Resume" : "Pause"}
                    </button>
                    <button
                        onClick={() => setLogs([])}
                        className="px-3 py-1 text-xs rounded bg-gray-700
                       hover:bg-gray-600 text-gray-300 transition-colors"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Terminal */}
            <div className="bg-black rounded font-mono text-xs h-80 overflow-y-auto p-3">
                {logs.length === 0 ? (
                    <div className="text-gray-600">Waiting for logs...</div>
                ) : (
                    logs.map((log) => (
                        <div key={log.id} className="flex gap-2 mb-0.5 hover:bg-gray-900 px-1 rounded">
              <span className="text-gray-600 shrink-0">
                {formatTime(log.timestamp)}
              </span>
                            <span className="text-purple-400 shrink-0 w-32 truncate">
                {log.serviceName}
              </span>
                            <span className={`shrink-0 w-12 ${LEVEL_COLORS[log.logLevel]}`}>
                {log.logLevel}
              </span>
                            <span className="text-gray-300 truncate">{log.message}</span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    );
}