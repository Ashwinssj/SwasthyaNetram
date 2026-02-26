"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Plus, Search, User } from "lucide-react";
import { AddPatientModal } from "@/components/AddPatientModal";
import { PatientDetailsModal } from "@/components/PatientDetailsModal";

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    gender: string;
    contact_number: string;
    created_at: string;
    date_of_birth?: string;
    address?: string;
    symptoms?: string;
}

import { useHospital } from "@/context/HospitalContext";

export default function PatientsPage() {
    const { selectedHospitalId } = useHospital();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    const fetchPatients = () => {
        if (!selectedHospitalId) return;

        setLoading(true);
        const token = localStorage.getItem("access_token");

        fetch(`http://127.0.0.1:8000/api/patients/?hospital_id=${selectedHospitalId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })
            .then((res) => {
                if (res.status === 401) {
                    // Redirect to login if unauthorized
                    window.location.href = "/login";
                    throw new Error("Unauthorized");
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setPatients(data);
                } else {
                    console.error("API returned non-array:", data);
                    setPatients([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch patients:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchPatients();
    }, [selectedHospitalId]);

    const handleViewPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setIsViewModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Patients" />
            <div className="p-6">
                {/* Actions Bar */}
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Patient
                    </button>
                </div>

                {/* Patients Table */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/50">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">
                                        Name
                                    </th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">
                                        ID
                                    </th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">
                                        Gender
                                    </th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">
                                        Contact
                                    </th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">
                                        Registered
                                    </th>
                                    <th className="px-6 py-4 font-medium text-gray-500 dark:text-gray-400">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            Loading patients...
                                        </td>
                                    </tr>
                                ) : patients.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No patients found. Add one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    patients.map((patient) => (
                                        <tr
                                            key={patient.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3 dark:bg-blue-900/30 dark:text-blue-400">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {patient.first_name} {patient.last_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                #{patient.id.toString().padStart(4, "0")}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                {patient.gender === "M"
                                                    ? "Male"
                                                    : patient.gender === "F"
                                                        ? "Female"
                                                        : "Other"}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                {patient.contact_number}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                                {new Date(patient.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleViewPatient(patient)}
                                                    className="text-blue-600 hover:text-blue-700 font-medium dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    View
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

            <AddPatientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchPatients}
            />

            <PatientDetailsModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                patient={selectedPatient}
                onRefresh={fetchPatients}
            />
        </div>
    );
}
