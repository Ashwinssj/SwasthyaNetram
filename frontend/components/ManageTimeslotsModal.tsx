"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Trash2, Clock, Calendar } from "lucide-react";

interface Doctor {
    id: number;
    first_name: string;
    last_name: string;
}

interface ManageTimeslotsModalProps {
    isOpen: boolean;
    onClose: () => void;
    doctor: Doctor | null;
}

interface Timeslot {
    id: number;
    doctor: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export function ManageTimeslotsModal({ isOpen, onClose, doctor }: ManageTimeslotsModalProps) {
    const [timeslots, setTimeslots] = useState<Timeslot[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        day_of_week: "MONDAY",
        start_time: "09:00",
        end_time: "09:30"
    });

    const dayNames: Record<string, string> = {
        ALL_DAYS: "All Days (Mon-Sun)",
        WEEKDAYS: "Weekdays (Mon-Fri)",
        MONDAY: "Monday",
        TUESDAY: "Tuesday",
        WEDNESDAY: "Wednesday",
        THURSDAY: "Thursday",
        FRIDAY: "Friday",
        SATURDAY: "Saturday",
        SUNDAY: "Sunday"
    };

    const fetchTimeslots = async () => {
        if (!doctor) return;
        setLoading(true);
        const token = localStorage.getItem("access_token");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/appointments/timeslots/?doctor_id=${doctor.id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            if (res.ok) {
                const data = await res.json();
                setTimeslots(data);
            }
        } catch (error) {
            console.error("Error fetching doctor timeslots:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && doctor) {
            fetchTimeslots();
        }
    }, [isOpen, doctor]);

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!doctor) return;
        setSubmitting(true);

        const token = localStorage.getItem("access_token");

        // Format times to HH:MM:SS
        const start_time = formData.start_time.length === 5 ? `${formData.start_time}:00` : formData.start_time;
        const end_time = formData.end_time.length === 5 ? `${formData.end_time}:00` : formData.end_time;

        const daysToCreate: string[] = [];
        if (formData.day_of_week === "ALL_DAYS") {
            daysToCreate.push("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY");
        } else if (formData.day_of_week === "WEEKDAYS") {
            daysToCreate.push("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY");
        } else {
            daysToCreate.push(formData.day_of_week);
        }

        try {
            const promises = daysToCreate.map(day =>
                fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/appointments/timeslots/`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        doctor: doctor.id,
                        day_of_week: day,
                        start_time,
                        end_time,
                        is_active: true
                    })
                })
            );

            const responses = await Promise.all(promises);
            const succeeded = responses.some(res => res.ok);

            if (succeeded) {
                fetchTimeslots();
                setFormData({
                    ...formData,
                    start_time: "09:00",
                    end_time: "09:30"
                });
            } else {
                const firstData = await responses[0].json();
                alert(firstData.non_field_errors || "This timeslot already exists.");
            }
        } catch (error) {
            console.error("Error adding timeslot:", error);
            alert("Error adding timeslot");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteSlot = async (id: number) => {
        if (!confirm("Are you sure you want to delete this timeslot?")) return;
        const token = localStorage.getItem("access_token");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/appointments/timeslots/${id}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                setTimeslots((prev) => prev.filter((slot) => slot.id !== id));
            } else {
                alert("Failed to delete timeslot");
            }
        } catch (error) {
            console.error("Error deleting timeslot:", error);
        }
    };

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog onClose={onClose} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center justify-between mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
                                <div>
                                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white">
                                        Dr. {doctor?.first_name} {doctor?.last_name}
                                    </Dialog.Title>
                                    <Dialog.Description className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        Manage daily recurring timeslots for booking
                                    </Dialog.Description>
                                </div>
                                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Add Slot Form */}
                            <form onSubmit={handleAddSlot} className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/80 mb-6">
                                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-blue-600" /> Add New Timeslot
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Day of Week</label>
                                        <select
                                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.day_of_week}
                                            onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                                        >
                                            {Object.entries(dayNames).map(([key, name]) => (
                                                <option key={key} value={key}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Time</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Time</label>
                                        <input
                                            type="time"
                                            required
                                            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {submitting ? "Adding Timeslot..." : "Add Timeslot"}
                                </button>
                            </form>

                            {/* Existing Slots List */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4 text-blue-600" /> Active Timeslots
                                </h4>
                                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                                    {loading && timeslots.length === 0 ? (
                                        <p className="text-sm text-gray-500 text-center py-4">Loading timeslots...</p>
                                    ) : timeslots.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic text-center py-4">No timeslots configured yet. Add some above to allow bookings!</p>
                                    ) : (
                                        timeslots.map((slot) => {
                                            // Format "09:00:00" to "09:00"
                                            const start = slot.start_time.substring(0, 5);
                                            const end = slot.end_time.substring(0, 5);
                                            return (
                                                <div
                                                    key={slot.id}
                                                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white dark:bg-gray-800 dark:border-gray-800/60 p-3 shadow-xs hover:border-gray-200 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:text-violet-400">
                                                            {dayNames[slot.day_of_week] || slot.day_of_week}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            {start} - {end}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                        title="Delete Timeslot"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
