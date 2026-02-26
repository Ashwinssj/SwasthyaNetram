"use client";

import { Bell, Search, ChevronDown, Building2, User, Settings, LogOut, Plus, Trash2 } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useHospital, Hospital } from "@/context/HospitalContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { AddHospitalModal } from "./AddHospitalModal";

export function Header({ title }: { title: string }) {
    const { hospitals, selectedHospitalId, setSelectedHospitalId, deleteHospital } = useHospital();
    const selectedHospital = hospitals.find(h => h.id === selectedHospitalId);
    const router = useRouter();
    const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
    };

    // Group hospitals by city
    const groupedHospitals = useMemo(() => {
        const groups: Record<string, Hospital[]> = {};
        hospitals.forEach(hospital => {
            const city = hospital.city || "Unknown City";
            if (!groups[city]) groups[city] = [];
            groups[city].push(hospital);
        });
        return groups;
    }, [hospitals]);

    return (
        <>
            <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:bg-gray-900 dark:border-gray-800">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                    {title}
                </h2>
                <div className="flex items-center space-x-4">
                    {/* Hospital Dropdown */}
                    <div className="relative group mr-4">
                        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                            <Building2 className="h-4 w-4" />
                            <span>{selectedHospital?.name || "Select Hospital"}</span>
                            <ChevronDown className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu with Bridge */}
                        <div className="absolute top-full right-0 pt-2 w-64 hidden group-hover:block z-50">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-100 dark:bg-gray-900 dark:border-gray-800 overflow-hidden max-h-96 overflow-y-auto">
                                {Object.keys(groupedHospitals).length > 0 ? (
                                    Object.entries(groupedHospitals).map(([city, cityHospitals]) => (
                                        <div key={city}>
                                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 dark:text-gray-400">
                                                {city}
                                            </div>
                                            {cityHospitals.map((hospital) => (
                                                <div
                                                    key={hospital.id}
                                                    className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item ${selectedHospitalId === hospital.id
                                                        ? "bg-blue-50 dark:bg-blue-900/20"
                                                        : ""
                                                        }`}
                                                >
                                                    <button
                                                        onClick={() => setSelectedHospitalId(hospital.id)}
                                                        className={`text-left flex-1 ${selectedHospitalId === hospital.id
                                                            ? "text-blue-600 font-medium dark:text-blue-400"
                                                            : "text-gray-700 dark:text-gray-300"
                                                            }`}
                                                    >
                                                        {hospital.name}
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm("Are you sure you want to delete this hospital?")) {
                                                                deleteHospital(hospital.id);
                                                            }
                                                        }}
                                                        className="opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all"
                                                        title="Delete Hospital"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                        No hospitals found
                                    </div>
                                )}
                                <div className="border-t border-gray-100 dark:border-gray-800 p-2">
                                    <button
                                        onClick={() => setIsAddHospitalOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Hospital
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="h-9 w-64 rounded-md border border-gray-200 bg-gray-50 pl-9 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                    </button>
                    <ThemeSwitcher />

                    {/* Profile Menu */}
                    <div className="relative group">
                        <button className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium hover:ring-2 hover:ring-blue-300 transition-all">
                            AD
                        </button>

                        {/* Dropdown Menu with Bridge */}
                        <div className="absolute top-full right-0 pt-2 w-48 hidden group-hover:block z-50">
                            <div className="bg-white rounded-xl shadow-lg border border-gray-100 dark:bg-gray-900 dark:border-gray-800 overflow-hidden py-1">
                                <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                                    <User className="h-4 w-4 mr-2" />
                                    Profile
                                </Link>
                                <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Settings
                                </Link>
                                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <AddHospitalModal isOpen={isAddHospitalOpen} onClose={() => setIsAddHospitalOpen(false)} />
        </>
    );
}
