import AnomalyBanner from "./components/AnomalyBanner";
import VolumeChart from "./components/VolumeChart";
import SearchPanel from "./components/SearchPanel";
import LogTail from "./components/LogTail";

export default function Dashboard() {
    return (
        <main className="min-h-screen bg-gray-950 text-white p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Luminate</h1>
                    <p className="text-gray-500 text-sm">
                        Log Aggregation & Observability Platform
                    </p>
                </div>
                <AnomalyBanner />
            </div>

            {/* Volume Chart */}
            <div className="mb-6">
                <VolumeChart />
            </div>

            {/* Bottom Grid — Search + Live Tail */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <SearchPanel />
                <LogTail />
            </div>
        </main>
    );
}