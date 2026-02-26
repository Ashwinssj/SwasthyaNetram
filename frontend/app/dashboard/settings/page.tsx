"use client";

import { Header } from "@/components/Header";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Bell, Sun, Shield, Mail } from "lucide-react";
import { useState } from "react";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

export default function SettingsPage() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Settings" />
            <div className="p-6 max-w-4xl mx-auto space-y-6">

                {/* Appearance Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <Sun className="h-5 w-5 mr-2 text-blue-500" />
                            Appearance
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Customize how the application looks on your device.
                        </p>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Theme Preference</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Switch between light and dark modes.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-full">
                            <ThemeSwitcher />
                        </div>
                    </div>
                </div>

                {/* Notifications Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <Bell className="h-5 w-5 mr-2 text-blue-500" />
                            Notifications
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage how you receive alerts and updates.
                        </p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive daily summaries and critical alerts.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={emailNotifications}
                                    onChange={() => setEmailNotifications(!emailNotifications)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Bell className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive real-time alerts in the browser.</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={pushNotifications}
                                    onChange={() => setPushNotifications(!pushNotifications)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <Shield className="h-5 w-5 mr-2 text-blue-500" />
                            Security
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Manage your account security and password.
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Password</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Last changed 30 days ago</p>
                            </div>
                            <button
                                onClick={() => setIsPasswordModalOpen(true)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
                            >
                                Change Password
                            </button>
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
