import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: string;
    trendUp?: boolean;
}

export function SummaryCard({
    title,
    value,
    icon: Icon,
    trend,
    trendUp,
}: SummaryCardProps) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {title}
                    </p>
                    <h3 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                        {value}
                    </h3>
                </div>
                <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-900/20">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-sm">
                    <span
                        className={cn(
                            "font-medium",
                            trendUp ? "text-green-600" : "text-red-600"
                        )}
                    >
                        {trend}
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                        from last month
                    </span>
                </div>
            )}
        </div>
    );
}
