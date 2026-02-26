"use client";

import { useState, useEffect } from "react";
import { X, User, Calendar, Phone, MapPin, Hash, Building2, FileText, ClipboardList, Activity, Plus, Edit2, Check, Loader2 } from "lucide-react";
import { AddSOAPNoteModal } from "./AddSOAPNoteModal";
import { AddLabReportModal } from "./AddLabReportModal";

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    gender: string;
    contact_number: string;
    created_at: string;
    date_of_birth?: string; // Optional as it might not be in the list view initially
    address?: string;       // Optional
    symptoms?: string;
    hospital?: number;      // Optional
    medical_history?: string | null;
    lab_reports?: {
        id: number;
        title: string;
        file: string;
        uploaded_at: string;
    }[];
    soap_notes?: {
        id: number;
        doctor_name: string;
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
        created_at: string;
    }[];
}

interface PatientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    onRefresh?: () => void;
}

export function PatientDetailsModal({ isOpen, onClose, patient, onRefresh }: PatientDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<"info" | "labs" | "soap">("info");
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);

    // Edit Medical History State
    const [isEditingHistory, setIsEditingHistory] = useState(false);
    const [history, setHistory] = useState(patient?.medical_history || "");
    const [savingHistory, setSavingHistory] = useState(false);

    useEffect(() => {
        if (patient) {
            setHistory(patient.medical_history || "");
        }
    }, [patient]);

    const handleSaveHistory = async () => {
        if (!patient) return;
        setSavingHistory(true);
        const token = localStorage.getItem("access_token");

        try {
            const res = await fetch(`http://127.0.0.1:8000/api/patients/${patient.id}/`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ medical_history: history }),
            });

            if (!res.ok) throw new Error("Failed to update history");

            setIsEditingHistory(false);
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error(error);
            alert("Failed to save medical history.");
        } finally {
            setSavingHistory(false);
        }
    };

    if (!isOpen || !patient) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <User className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {patient.first_name} {patient.last_name}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Patient ID: #{patient.id.toString().padStart(4, "0")}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "info"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <User className="h-4 w-4" />
                            Info
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("labs")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "labs"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4" />
                            Lab Reports
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab("soap")}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "soap"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <ClipboardList className="h-4 w-4" />
                            SOAP Notes
                        </div>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === "info" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gender</label>
                                    <div className="mt-1 flex items-center text-gray-900 dark:text-white">
                                        <User className="h-4 w-4 mr-2 text-gray-400" />
                                        {patient.gender === "M" ? "Male" : patient.gender === "F" ? "Female" : "Other"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date of Birth</label>
                                    <div className="mt-1 flex items-center text-gray-900 dark:text-white">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Contact</label>
                                    <div className="mt-1 flex items-center text-gray-900 dark:text-white">
                                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                        {patient.contact_number}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Registered On</label>
                                    <div className="mt-1 flex items-center text-gray-900 dark:text-white">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        {new Date(patient.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</label>
                                <div className="mt-1 flex items-start text-gray-900 dark:text-white">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                                    <span>{patient.address || "No address provided"}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symptoms</label>
                                <div className="mt-1 flex items-start text-gray-900 dark:text-white p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                                    <Activity className="h-4 w-4 mr-2 text-red-500 mt-0.5" />
                                    <span className="text-red-900 dark:text-red-200">{patient.symptoms || "No symptoms recorded"}</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Medical History
                                    </label>
                                    {!isEditingHistory ? (
                                        <button
                                            onClick={() => setIsEditingHistory(true)}
                                            className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center"
                                        >
                                            <Edit2 className="h-3 w-3 mr-1" />
                                            Edit
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setIsEditingHistory(false)}
                                                className="text-gray-500 hover:text-gray-700 text-xs font-medium"
                                                disabled={savingHistory}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveHistory}
                                                disabled={savingHistory}
                                                className="text-green-600 hover:text-green-700 text-xs font-medium flex items-center"
                                            >
                                                {savingHistory ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                                                Save
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {isEditingHistory ? (
                                    <textarea
                                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        rows={4}
                                        value={history}
                                        onChange={(e) => setHistory(e.target.value)}
                                        placeholder="Enter medical history..."
                                    />
                                ) : (
                                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                                        {patient.medical_history || "No medical history recorded."}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "labs" && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsAddReportModalOpen(true)}
                                    className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Upload Report
                                </button>
                            </div>
                            {!patient.lab_reports?.length ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No lab reports available.
                                </div>
                            ) : (
                                patient.lab_reports.map((report) => (
                                    <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900 dark:text-white">{report.title}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Uploaded: {new Date(report.uploaded_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <a href={report.file} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 transition-colors">
                                            View PDF
                                        </a>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === "soap" && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setIsAddNoteModalOpen(true)}
                                    className="flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Note
                                </button>
                            </div>
                            {!patient.soap_notes?.length ? (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    No SOAP notes available.
                                </div>
                            ) : (
                                patient.soap_notes.map((note) => (
                                    <div key={note.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-blue-500" />
                                                <span className="font-medium text-gray-900 dark:text-white">High Priority Assessment</span>
                                            </div>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(note.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Subjective:</span>
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">{note.subjective}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Objective:</span>
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">{note.objective}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Assessment:</span>
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">{note.assessment}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Plan:</span>
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">{note.plan}</p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-right">
                                            Signed by Dr. {note.doctor_name || "Unknown"}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                    >
                        Close
                    </button>
                </div>
            </div>
            <AddSOAPNoteModal
                isOpen={isAddNoteModalOpen}
                onClose={() => setIsAddNoteModalOpen(false)}
                onSuccess={() => {
                    setIsAddNoteModalOpen(false);
                    if (onRefresh) onRefresh();
                }}
                patientId={patient.id}
            />
            <AddLabReportModal
                isOpen={isAddReportModalOpen}
                onClose={() => setIsAddReportModalOpen(false)}
                onSuccess={() => {
                    setIsAddReportModalOpen(false);
                    if (onRefresh) onRefresh();
                }}
                patientId={patient.id}
            />
        </div>
    );
}
