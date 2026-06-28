"use client";

import { Header } from "@/components/Header";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Bell, Sun, Shield, Mail, Key, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";

export default function SettingsPage() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // Gemini API Key management states
    const [apiKey, setApiKey] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [isLoadingKey, setIsLoadingKey] = useState(true);
    const [isSavingKey, setIsSavingKey] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Fetch user profile settings including the manual API key
    useEffect(() => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/auth/me/`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => {
                if (res.ok) return res.json();
                throw new Error("Failed to load user settings");
            })
            .then(data => {
                if (data.gemini_api_key) {
                    setApiKey(data.gemini_api_key);
                }
                setIsLoadingKey(false);
            })
            .catch(err => {
                console.error("Error loading settings:", err);
                setIsLoadingKey(false);
            });
        } else {
            setIsLoadingKey(false);
        }
    }, []);

    const handleSaveApiKey = async () => {
        setIsSavingKey(true);
        setStatusMessage(null);

        // Simple validation warning if key doesn't start with standard prefix
        if (apiKey && !apiKey.startsWith("AIzaSy")) {
            setStatusMessage({ 
                type: "error", 
                text: "Warning: Gemini API Keys usually start with 'AIzaSy'. Please verify your key is correct." 
            });
        }

        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/auth/me/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ gemini_api_key: apiKey })
            });

            if (!res.ok) throw new Error("Failed to save API key");
            
            const data = await res.json();
            setApiKey(data.gemini_api_key || "");
            setStatusMessage({ type: "success", text: "Gemini API Key updated successfully!" });
        } catch (err: any) {
            console.error("Error saving API key:", err);
            setStatusMessage({ type: "error", text: "Failed to update Gemini API Key. Please try again." });
        } finally {
            setIsSavingKey(false);
        }
    };

    const handleClearApiKey = async () => {
        setIsSavingKey(true);
        setStatusMessage(null);

        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/auth/me/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ gemini_api_key: "" })
            });

            if (!res.ok) throw new Error("Failed to clear API key");
            
            const data = await res.json();
            setApiKey("");
            setStatusMessage({ type: "success", text: "Gemini API Key cleared. System will fallback to the server key." });
        } catch (err: any) {
            console.error("Error clearing API key:", err);
            setStatusMessage({ type: "error", text: "Failed to clear Gemini API Key. Please try again." });
        } finally {
            setIsSavingKey(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Settings" />
            <div className="p-6 max-w-4xl mx-auto space-y-6">

                {/* Appearance Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
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
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
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

                {/* Gemini API Key Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                            <Key className="h-5 w-5 mr-2 text-blue-500" />
                            Gemini API Integration
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Configure your own Gemini API key to bypass default system limits and prevent quota errors.
                        </p>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Gemini API Key
                            </label>
                            <div className="relative rounded-md shadow-sm max-w-xl">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder={isLoadingKey ? "Loading..." : "Enter your API key (AIzaSy...)"}
                                    disabled={isLoadingKey || isSavingKey}
                                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-4 py-3 pr-10 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition-all text-sm font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    disabled={isLoadingKey}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                                >
                                    {showApiKey ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                                Keys typically begin with <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono">AIzaSy</code>. Leaving this empty resets authentication to the system-wide API key.
                            </p>
                        </div>

                        {statusMessage && (
                            <div className={`p-3 rounded-lg text-sm max-w-xl ${
                                statusMessage.type === "success" 
                                    ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800" 
                                    : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800"
                            }`}>
                                {statusMessage.text}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSaveApiKey}
                                disabled={isLoadingKey || isSavingKey}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm hover:shadow transition-all duration-150 disabled:opacity-50"
                            >
                                {isSavingKey ? "Saving..." : "Save Key"}
                            </button>
                            {apiKey && (
                                <button
                                    onClick={handleClearApiKey}
                                    disabled={isLoadingKey || isSavingKey}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                                >
                                    Remove Key
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Security Section */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
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
