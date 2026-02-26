import { Header } from "@/components/Header";
import { Ambulance } from "lucide-react";

export default function EmergencyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Emergency Services" />
            <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center p-6">
                <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-6 dark:bg-red-900/30 dark:text-red-400">
                    <Ambulance className="h-12 w-12" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Emergency Response Center
                </h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md">
                    This module will handle real-time emergency dispatch, ambulance tracking, and critical care unit management.
                </p>
            </div>
        </div>
    );
}
