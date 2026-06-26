"use client";

import { Header } from "@/components/Header";
import { User, Mail, Shield, Key, X } from "lucide-react";
import { useState, useEffect } from "react";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import Link from "next/link";

interface UserProfile {
    username: string;
    email: string;
    role: string;
    plan: string;
}

export default function ProfilePage() {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/auth/me/`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Failed to load user profile");
            })
            .then(data => {
                setProfile(data);
            })
            .catch(err => {
                console.error("Error fetching user profile:", err);
            });
        }
    }, []);

    // Fallbacks
    const displayEmail = profile?.email || "admin@example.com";
    const displayName = profile?.username || "Admin User";
    const displayRole = profile?.role || "Administrator";
    const displayPlan = profile?.plan || "Superuser";

    // Generate Initials
    const getInitials = () => {
        if (profile?.email) {
            return profile.email.slice(0, 2).toUpperCase();
        }
        if (profile?.username) {
            return profile.username.slice(0, 2).toUpperCase();
        }
        return "AD";
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Profile" />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden relative">
                    {/* Header bar with gradient and floating close button */}
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 relative">
                        <Link 
                            href="/dashboard"
                            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 backdrop-blur-md transition-all hover:scale-105 shadow-sm"
                            title="Back to Dashboard"
                        >
                            <X className="h-5 w-5" />
                        </Link>
                    </div>
                    
                    <div className="px-8 pb-8">
                        <div className="relative flex items-end -mt-12 mb-6">
                            <div className="h-24 w-24 rounded-full ring-4 ring-white dark:ring-gray-900 bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                                {getInitials()}
                            </div>
                            <div className="ml-4 mb-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {displayEmail}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    {displayRole}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                                    Personal Information
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Username
                                        </label>
                                        <div className="flex items-center text-gray-900 dark:text-white">
                                            <User className="h-4 w-4 mr-2 text-gray-400" />
                                            {displayName}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Email Address
                                        </label>
                                        <div className="flex items-center text-gray-900 dark:text-white">
                                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                            {displayEmail}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Role
                                        </label>
                                        <div className="flex items-center text-gray-900 dark:text-white">
                                            <Shield className="h-4 w-4 mr-2 text-gray-400" />
                                            {displayPlan}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2">
                                    Security
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                        <div className="flex items-center">
                                            <Key className="h-5 w-5 text-gray-400 mr-3" />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">Password</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsPasswordModalOpen(true)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
        </div>
    );
}
