"use client";

import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { API_BASE } from "@/lib/config";

interface DataPoint {
    timestamp: string;
    total: number;
    levels: Record<string, number>;
}

interface ServiceSeries {
    service: string;
    data: DataPoint[];
}

const LEVEL_COLORS: Record<string, string> = {
    ERROR: "#ef4444",
    FATAL: "#dc2626",
    WARN: "#f59e0b",
    INFO: "#3b82f6",
    DEBUG: "#6b7280",
};

const TIME_RANGES = ["1h", "6h", "24h"] as const;
type TimeRange = (typeof TIME_RANGES)[number];

/**
 * Bar chart showing log volume over time grouped by log level.
 * Fetches from /api/v1/metrics/volume with configurable time range.
 */
export default function VolumeChart() {
    const [range, setRange] = useState<TimeRange>("6h");
    const [chartData, setChartData] = useState<Record<string, number | string>[]>([]);
    const [services, setServices] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchVolume = async (selectedRange: TimeRange) => {
        try {
            setLoading(true);
            const interval = selectedRange === "1h" ? "5m" : "15m";
            const res = await fetch(
                `${API_BASE}/metrics/volume?interval=${interval}&range=${selectedRange}`
            );
            const json = await res.json();

            // Flatten series into chart-friendly format
            // Each entry: { timestamp, "payment-service_ERROR": 5, "auth-service_INFO": 3, ... }
            const timeMap: Record<string, Record<string, number | string>> = {};
            const serviceSet = new Set<string>();

            json.series?.forEach((series: ServiceSeries) => {
                serviceSet.add(series.service);
                series.data.forEach((point: DataPoint) => {
                    const time = new Date(point.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    });
                    if (!timeMap[time]) timeMap[time] = { time };
                    Object.entries(point.levels || {}).forEach(([level, count]) => {
                        const key = `${series.service}_${level}`;
                        timeMap[time][key] = ((timeMap[time][key] as number) || 0) + count;
                    });
                });
            });

            setChartData(Object.values(timeMap));
            setServices(Array.from(serviceSet));
        } catch (err) {
            console.error("Failed to fetch volume metrics", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVolume(range);
        const interval = setInterval(() => fetchVolume(range), 30000);
        return () => clearInterval(interval);
    }, [range]);

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Log Volume</h2>
                <div className="flex gap-1">
                    {TIME_RANGES.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRange(r)}
                            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                                range === r
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
                    Loading...
                </div>
            ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
                    No data for selected range
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis
                            dataKey="time"
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fill: "#9ca3af", fontSize: 11 }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1f2937",
                                border: "1px solid #374151",
                                borderRadius: "6px",
                                fontSize: "12px",
                            }}
                            labelStyle={{ color: "#f9fafb" }}
                        />
                        <Legend
                            wrapperStyle={{ fontSize: "11px", color: "#9ca3af" }}
                        />
                        {services.flatMap((service) =>
                            Object.keys(LEVEL_COLORS).map((level) => {
                                const key = `${service}_${level}`;
                                return (
                                    <Bar
                                        key={key}
                                        dataKey={key}
                                        name={`${service} ${level}`}
                                        stackId={service}
                                        fill={LEVEL_COLORS[level]}
                                        opacity={0.85}
                                    />
                                );
                            })
                        )}
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}