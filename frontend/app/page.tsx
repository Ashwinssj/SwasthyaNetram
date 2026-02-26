import Link from "next/link";
import { ArrowRight, ShieldCheck, Activity, Users } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Navigation */}
            <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-900">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">
                    SwasthyaNetram
                </div>
                <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Login
                </Link>
            </nav>

            {/* Hero Section */}
            <main className="container mx-auto px-6 py-16 text-center lg:py-24">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
                    <span className="block">Modern Healthcare</span>
                    <span className="block text-blue-600 dark:text-blue-500">
                        Management System
                    </span>
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 dark:text-gray-400">
                    Streamline hospital operations, manage patient records, and optimize
                    resource allocation with our centralized, secure, and intelligent
                    platform.
                </p>
                <div className="mt-10 flex justify-center gap-4">
                    <Link
                        href="/login"
                        className="flex items-center px-8 py-3 text-base font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Get Started <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                    <a
                        href="#features"
                        className="flex items-center px-8 py-3 text-base font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700"
                    >
                        Learn More
                    </a>
                </div>

                {/* Features Grid */}
                <div id="features" className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900">
                        <div className="w-12 h-12 mx-auto bg-blue-100 rounded-xl flex items-center justify-center dark:bg-blue-900/30">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Patient Management
                        </h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Comprehensive patient profiles, medical history, and appointment
                            scheduling.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900">
                        <div className="w-12 h-12 mx-auto bg-green-100 rounded-xl flex items-center justify-center dark:bg-green-900/30">
                            <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Real-time Analytics
                        </h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Monitor hospital performance, occupancy rates, and staff
                            availability instantly.
                        </p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gray-50 dark:bg-gray-900">
                        <div className="w-12 h-12 mx-auto bg-purple-100 rounded-xl flex items-center justify-center dark:bg-purple-900/30">
                            <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Secure & Compliant
                        </h3>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">
                            Role-based access control and encrypted data storage for maximum
                            security.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
