import { Sidebar } from "@/components/Sidebar";
import { HospitalProvider } from "@/context/HospitalContext";

export default function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <HospitalProvider>
            <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
                <Sidebar />
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </HospitalProvider>
    );
}
