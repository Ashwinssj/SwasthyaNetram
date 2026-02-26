"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from "lucide-react";
import { useHospital } from "@/context/HospitalContext";

interface AppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AppointmentModal({ isOpen, onClose, onSuccess }: AppointmentModalProps) {
    const { selectedHospitalId } = useHospital();
    const [loading, setLoading] = useState(false);
    const [employees, setEmployees] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        doctor: "",
        patient: "",
        appointment_date: "",
        appointment_time: "",
        reason: "",
        status: "SCHEDULED"
    });

    useEffect(() => {
        if (isOpen && selectedHospitalId) {
            const token = localStorage.getItem("access_token");
            const headers = { "Authorization": `Bearer ${token}` };

            // Fetch doctors
            fetch(`http://127.0.0.1:8000/api/employees/?hospital_id=${selectedHospitalId}`, { headers })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        const doctors = data.filter((emp: any) => emp.role === 'DOCTOR');
                        setEmployees(doctors);
                    }
                });

            // Fetch patients
            fetch(`http://127.0.0.1:8000/api/patients/?hospital_id=${selectedHospitalId}`, { headers })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setPatients(data);
                });
        }
    }, [isOpen, selectedHospitalId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem("access_token");
            const res = await fetch("http://127.0.0.1:8000/api/appointments/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    hospital: selectedHospitalId
                }),
            });

            if (res.ok) {
                onSuccess();
                onClose();
                setFormData({
                    doctor: "",
                    patient: "",
                    appointment_date: "",
                    appointment_time: "",
                    reason: "",
                    status: "SCHEDULED"
                });
            } else {
                alert("Failed to create appointment");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating appointment");
        } finally {
            setLoading(false);
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
                    <div className="fixed inset-0 bg-black/30" />
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
                        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
                            <div className="flex items-center justify-between mb-4">
                                <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Schedule Appointment
                                </Dialog.Title>
                                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Doctor</label>
                                    <select
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                        value={formData.doctor}
                                        onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                                    >
                                        <option value="">Select Doctor</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                Dr. {emp.first_name} {emp.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Patient</label>
                                    <select
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                        value={formData.patient}
                                        onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.first_name} {p.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                            value={formData.appointment_date}
                                            onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
                                        <input
                                            type="time"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                            value={formData.appointment_time}
                                            onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reason</label>
                                    <textarea
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                                        rows={3}
                                        value={formData.reason}
                                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {loading ? "Scheduling..." : "Schedule Appointment"}
                                </button>
                            </form>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition>
    );
}
