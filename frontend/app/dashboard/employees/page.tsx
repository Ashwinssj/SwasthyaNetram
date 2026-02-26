"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Plus, Search, User, Stethoscope } from "lucide-react";
import { useHospital } from "@/context/HospitalContext";
import { AddEmployeeModal } from "@/components/AddEmployeeModal";

interface Employee {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
    email: string;
    contact_number: string;
    joined_date: string;
}

export default function EmployeesPage() {
    const { selectedHospitalId } = useHospital();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchEmployees = () => {
        if (!selectedHospitalId) return;

        setLoading(true);
        const token = localStorage.getItem("access_token");

        fetch(`http://127.0.0.1:8000/api/employees/?hospital_id=${selectedHospitalId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            }
        })
            .then((res) => {
                if (res.status === 401) {
                    window.location.href = "/login";
                    throw new Error("Unauthorized");
                }
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) {
                    setEmployees(data);
                } else {
                    console.error("API returned non-array:", data);
                    setEmployees([]);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch employees:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchEmployees();
    }, [selectedHospitalId]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header title="Employees" />
            <div className="p-6">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {loading ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            Loading employees...
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No employees found for this hospital.
                        </div>
                    ) : (
                        employees.map((employee) => (
                            <div
                                key={employee.id}
                                className="group relative flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                            >
                                <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-4 dark:bg-blue-900/30 dark:text-blue-400">
                                    <Stethoscope className="h-8 w-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {employee.first_name} {employee.last_name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    {employee.role}
                                </p>
                                <div className="w-full border-t border-gray-100 pt-4 dark:border-gray-800">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            Joined
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {new Date(employee.joined_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchEmployees}
            />
        </div>
    );
}
