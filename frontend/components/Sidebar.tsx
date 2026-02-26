"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    UserCog,
    Siren,
    Bot,
    LogOut,
    Calendar,
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Patients", href: "/dashboard/patients", icon: Users },
    { name: "Employees", href: "/dashboard/employees", icon: UserCog },
    { name: "Schedule", href: "/dashboard/appointments", icon: Calendar },
    { name: "Emergency", href: "/dashboard/emergency", icon: Siren },
    { name: "AI Assistant", href: "/dashboard/ai-assistant", icon: Bot },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-800">
                <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    SwasthyaNetram
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "mr-3 h-5 w-5 flex-shrink-0",
                                        isActive
                                            ? "text-blue-600 dark:text-blue-400"
                                            : "text-gray-400 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-300"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-800 p-4">
                <button className="group flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors dark:text-red-400 dark:hover:bg-red-900/20">
                    <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600 dark:text-red-400" />
                    Logout
                </button>
            </div>
        </div>
    );
}
