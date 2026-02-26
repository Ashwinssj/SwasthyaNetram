"use client";

import { Header } from "@/components/Header";
import { User, Mail, Shield, Key } from "lucide-react";
import { useState } from "react";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

export default function ProfilePage() {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Profile" />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    <div className="px-8 pb-8">
                        <div className="relative flex items-end -mt-12 mb-6">
                            <div className="h-24 w-24 rounded-full ring-4 ring-white dark:ring-gray-900 bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                                AD
                            </div>
                            <div className="ml-4 mb-1">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Admin User
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Administrator
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
                                            admin
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Email Address
                                        </label>
                                        <div className="flex items-center text-gray-900 dark:text-white">
                                            <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                            admin@example.com
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                                            Role
                                        </label>
                                        <div className="flex items-center text-gray-900 dark:text-white">
                                            <Shield className="h-4 w-4 mr-2 text-gray-400" />
                                            Superuser
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
