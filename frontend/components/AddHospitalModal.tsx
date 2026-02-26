"use client";

import { useState } from "react";
import { X, Building2, MapPin, Phone } from "lucide-react";
import { useHospital } from "@/context/HospitalContext";

interface AddHospitalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddHospitalModal({ isOpen, onClose }: AddHospitalModalProps) {
    const { addHospital } = useHospital();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        city: "",
        address: "",
        contact_number: "",
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await addHospital(formData);
            onClose();
            setFormData({ name: "", city: "", address: "", contact_number: "" });
        } catch (error) {
            console.error("Failed to add hospital:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 transform transition-all">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-500" />
                        Add New Hospital
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Hospital Name</label>
                        <div className="relative">
                            <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                required
                                type="text"
                                placeholder="e.g. City General Hospital"
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                required
                                type="text"
                                placeholder="e.g. New York"
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                        <textarea
                            required
                            placeholder="Full address..."
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800 resize-none"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                required
                                type="tel"
                                placeholder="+1 (555) 000-0000"
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:bg-gray-800"
                                value={formData.contact_number}
                                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? "Adding..." : "Add Hospital"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
