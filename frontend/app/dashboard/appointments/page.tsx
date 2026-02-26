"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Calendar, Plus, Search, Trash2, Clock, User, Stethoscope } from "lucide-react";
import { useHospital } from "@/context/HospitalContext";
import { AppointmentModal } from "@/components/AppointmentModal";

export default function AppointmentsPage() {
    const { selectedHospitalId } = useHospital();
    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchAppointments = async () => {
        if (!selectedHospitalId) return;
        setLoading(true);
        const token = localStorage.getItem("access_token");

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/appointments/?hospital_id=${selectedHospitalId}`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                }
            });

            if (res.ok) {
                const data = await res.json();
                setAppointments(data);
            } else if (res.status === 401) {
                window.location.href = "/login";
            }
        } catch (error) {
            console.error("Failed to fetch appointments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [selectedHospitalId]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this appointment?")) return;
        const token = localStorage.getItem("access_token");

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/appointments/${id}/`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                }
            });

            if (res.ok) {
                setAppointments((prev) => prev.filter((app) => app.id !== id));
            } else {
                alert("Failed to delete appointment");
            }
        } catch (error) {
            console.error("Error deleting appointment:", error);
            alert("Error deleting appointment");
        }
    };

    const filteredAppointments = appointments.filter((app) => {
        const searchString = searchTerm.toLowerCase();
        const doctorName = app.doctor_details ? `${app.doctor_details.first_name} ${app.doctor_details.last_name}` : "";
        const patientName = app.patient_details ? `${app.patient_details.first_name} ${app.patient_details.last_name}` : "";

        return (
            doctorName.toLowerCase().includes(searchString) ||
            patientName.toLowerCase().includes(searchString) ||
            (app.reason && app.reason.toLowerCase().includes(searchString))
        );
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Schedule" />

            <div className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Appointments</h1>
                        <p className="text-gray-500 dark:text-gray-400">Manage patient schedules and doctor availability</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Appointment
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                    <div className="relative mb-6">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search appointments..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-lg">Doctor</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Loading appointments...
                                        </td>
                                    </tr>
                                ) : filteredAppointments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No appointments found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredAppointments.map((app) => (
                                        <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                                                        <Stethoscope className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {app.doctor_details ? `Dr. ${app.doctor_details.first_name} ${app.doctor_details.last_name}` : "Unknown"}
                                                        </p>
                                                        <p className="text-xs text-gray-500">{app.doctor_details?.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                                                        <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="text-gray-900 dark:text-white font-medium">
                                                        {app.patient_details ? `${app.patient_details.first_name} ${app.patient_details.last_name}` : "Unknown"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                                                        <Calendar className="h-4 w-4 text-gray-400" />
                                                        <span>{app.appointment_date}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 text-xs mt-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{app.appointment_time}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${app.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                                                    app.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                                                        'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                    }`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Delete Appointment"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchAppointments}
            />
        </div>
    );
}
