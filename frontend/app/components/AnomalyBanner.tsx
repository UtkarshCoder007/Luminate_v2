"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";

interface Alert {
    serviceName: string;
    zScore: string;
    currentRate: string;
    firedAt: string;
}

interface AnomalyResponse {
    activeAlerts: number;
    alerts: Alert[];
}

/**
 * Polls /api/v1/metrics/anomalies every 30 seconds.
 * Shows a red banner if any active alerts exist.
 * Shows a green status if everything is healthy.
 */
export default function AnomalyBanner() {
    const [data, setData] = useState<AnomalyResponse>({
        activeAlerts: 0,
        alerts: [],
    });

    const fetchAnomalies = async () => {
        try {
            const res = await fetch(`${API_BASE}/metrics/anomalies`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error("Failed to fetch anomalies", err);
        }
    };

    useEffect(() => {
        fetchAnomalies();
        const interval = setInterval(fetchAnomalies, 30000);
        return () => clearInterval(interval);
    }, []);

    if (data.activeAlerts === 0) {
        return (
            <div className="flex items-center gap-2 bg-green-950 border border-green-700 rounded-lg px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-green-400 text-sm font-medium">
          All systems healthy
        </span>
            </div>
        );
    }

    return (
        <div className="bg-red-950 border border-red-700 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 text-sm font-bold uppercase tracking-wide">
          {data.activeAlerts} Active{" "}
                    {data.activeAlerts === 1 ? "Anomaly" : "Anomalies"}
        </span>
            </div>
            <div className="flex flex-wrap gap-3">
                {data.alerts.map((alert, i) => (
                    <div
                        key={i}
                        className="bg-red-900 border border-red-700 rounded px-3 py-1 text-xs text-red-200"
                    >
                        <span className="font-bold">{alert.serviceName}</span>
                        <span className="mx-1 text-red-400">—</span>
                        <span>Z-score: {parseFloat(alert.zScore).toFixed(2)}</span>
                        <span className="mx-1 text-red-400">·</span>
                        <span>{parseFloat(alert.currentRate).toFixed(0)} logs/min</span>
                    </div>
                ))}
            </div>
        </div>
    );
}