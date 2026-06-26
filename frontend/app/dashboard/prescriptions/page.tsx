"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { useHospital } from "@/context/HospitalContext";
import {
    FileText,
    Upload,
    Clock,
    User,
    Check,
    AlertCircle,
    Calendar,
    Loader2,
    CheckCircle,
    ArrowRight,
    Edit2,
    Activity,
    Search,
    ChevronDown,
    ChevronUp,
    Sparkles,
    RefreshCw,
    XCircle,
} from "lucide-react";

interface Medicine {
    id: number;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    timing: "morning" | "afternoon" | "night" | "any";
    instructions: string;
    prescribed_at: string;
}

interface Prescription {
    id: number;
    image: string;
    extracted_text: string | null;
    ocr_status: "pending" | "processing" | "completed" | "failed";
    ocr_error: string | null;
    uploaded_at: string;
    medicines: Medicine[];
}

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    contact_number: string;
    gender: string;
    breakfast_time: string;
    lunch_time: string;
    dinner_time: string;
    prescriptions: Prescription[];
    medicines: Medicine[];
}

export default function PrescriptionsPage() {
    const { selectedHospitalId } = useHospital();
    
    // States
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [loadingPatients, setLoadingPatients] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    // Edit Meal Timings State
    const [isEditingTimings, setIsEditingTimings] = useState(false);
    const [breakfastTime, setBreakfastTime] = useState("");
    const [lunchTime, setLunchTime] = useState("");
    const [dinnerTime, setDinnerTime] = useState("");
    const [updatingTimings, setUpdatingTimings] = useState(false);

    // Prescription Upload State
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadPreview, setUploadPreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Accordion State for Past Prescriptions
    const [expandedPrescriptionId, setExpandedPrescriptionId] = useState<number | null>(null);

    // Fetch Patients
    const fetchPatients = async (selectIdAfterFetch?: string) => {
        if (!selectedHospitalId) return;
        setLoadingPatients(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/patients/?hospital_id=${selectedHospitalId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setPatients(data);
                    
                    // If we have an ID to select, update it
                    const targetId = selectIdAfterFetch || selectedPatientId;
                    if (targetId) {
                        const matched = data.find((p) => p.id.toString() === targetId);
                        if (matched) {
                            setSelectedPatient(matched);
                            setBreakfastTime(matched.breakfast_time);
                            setLunchTime(matched.lunch_time);
                            setDinnerTime(matched.dinner_time);
                        }
                    } else if (data.length > 0 && !selectedPatientId) {
                        // Auto-select first patient
                        setSelectedPatientId(data[0].id.toString());
                        setSelectedPatient(data[0]);
                        setBreakfastTime(data[0].breakfast_time);
                        setLunchTime(data[0].lunch_time);
                        setDinnerTime(data[0].dinner_time);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoadingPatients(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [selectedHospitalId]);

    // Handle patient selection change
    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatientId(patient.id.toString());
        setSelectedPatient(patient);
        setBreakfastTime(patient.breakfast_time);
        setLunchTime(patient.lunch_time);
        setDinnerTime(patient.dinner_time);
        setIsEditingTimings(false);
        setUploadError(null);
        setUploadSuccess(false);
        setUploadFile(null);
        setUploadPreview(null);
        setShowPatientDropdown(false);
        setSearchQuery("");
    };

    // Save Patient Meal Timings
    const handleSaveMealTimings = async () => {
        if (!selectedPatient) return;
        setUpdatingTimings(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/patients/${selectedPatient.id}/`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    breakfast_time: breakfastTime,
                    lunch_time: lunchTime,
                    dinner_time: dinnerTime,
                }),
            });
            if (res.ok) {
                const updated = await res.json();
                setIsEditingTimings(false);
                // Refresh list and maintain patient selection
                await fetchPatients(selectedPatient.id.toString());
            } else {
                alert("Failed to update meal timings.");
            }
        } catch (error) {
            console.error("Error updating timings:", error);
        } finally {
            setUpdatingTimings(false);
        }
    };

    // Handle Prescription Upload
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            processFile(file);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            processFile(file);
        }
    };

    const processFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setUploadError("Please upload an image file (PNG, JPG, WebP).");
            return;
        }
        setUploadFile(file);
        setUploadError(null);
        setUploadSuccess(false);

        const reader = new FileReader();
        reader.onloadend = () => {
            setUploadPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Poll OCR status for a prescription until completed or failed
    const pollOcrStatus = async (prescriptionId: number, maxAttempts = 30) => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, 3000)); // Wait 3 seconds between polls
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/patients/prescriptions/${prescriptionId}/ocr-status/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                if (res.ok) {
                    const data = await res.json();
                    if (data.ocr_status === "completed") {
                        return { success: true, error: null };
                    } else if (data.ocr_status === "failed") {
                        return { success: false, error: data.ocr_error || "OCR processing failed on the server." };
                    }
                    // Still processing, continue polling
                }
            } catch {
                // Network error, continue polling
            }
        }
        return { success: false, error: "OCR processing timed out. You can retry from the prescription history." };
    };

    // Handle retry OCR for a failed/pending prescription
    const handleRetryOcr = async (prescriptionId: number) => {
        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/patients/prescriptions/${prescriptionId}/retry-ocr/`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (res.ok || res.status === 202) {
                const result = await pollOcrStatus(prescriptionId);
                if (result.success) {
                    setUploadSuccess(true);
                } else {
                    setUploadError(result.error || "OCR retry failed.");
                }
                await fetchPatients(selectedPatientId);
            } else {
                setUploadError("Failed to trigger OCR retry.");
            }
        } catch (error) {
            setUploadError("A network error occurred.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadPrescription = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !selectedPatientId) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const formData = new FormData();
            formData.append("patient", selectedPatientId);
            formData.append("image", uploadFile);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/patients/prescriptions/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (res.ok) {
                const createdPrescription = await res.json();
                setUploadFile(null);
                setUploadPreview(null);

                // Poll for OCR completion (it now runs async in a background thread)
                const result = await pollOcrStatus(createdPrescription.id);
                if (result.success) {
                    setUploadSuccess(true);
                } else {
                    setUploadError(result.error || "OCR processing failed. You can retry from the prescription history.");
                }
                // Refresh data to get the updated prescription with extracted medicines
                await fetchPatients(selectedPatientId);
            } else {
                const data = await res.json();
                setUploadError(data.error || data.detail || "Failed to upload prescription image.");
            }
        } catch (error) {
            setUploadError("A network error occurred while uploading.");
            console.error("Upload error:", error);
        } finally {
            setIsUploading(false);
        }
    };

    // Filter patients based on search
    const filteredPatients = patients.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group active medicines of the selected patient by their timing
    const medicinesByTiming = {
        morning: selectedPatient?.medicines.filter((m) => m.timing === "morning") || [],
        afternoon: selectedPatient?.medicines.filter((m) => m.timing === "afternoon") || [],
        night: selectedPatient?.medicines.filter((m) => m.timing === "night") || [],
        any: selectedPatient?.medicines.filter((m) => m.timing === "any" || !m.timing) || [],
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-12">
            <Header title="AI Prescription & Dosage Scheduler" />
            
            <div className="max-w-7xl mx-auto p-6 space-y-8">
                {/* Header ribbon */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md border border-blue-500/20 relative overflow-hidden">
                    <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 space-y-2 max-w-3xl">
                        <span className="bg-white/20 text-white text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full flex items-center w-fit">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Multimodal AI Engine Active
                        </span>
                        <h2 className="text-2xl font-black">Automated OCR & Dynamic n8n Chrono-Reminders</h2>
                        <p className="text-sm text-blue-100 leading-relaxed">
                            Upload a scan or picture of a patient's handwritten or printed medical prescription. The system uses <strong>Gemini 2.0 Flash</strong> to parse details and schedule real-time custom WhatsApp notification dispatch coordinates linked directly to their preferred meal timings!
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Patient Selector & Meal Timings Setup */}
                    <div className="space-y-6 lg:col-span-1">
                        
                        {/* Selector card */}
                        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4 relative">
                            <label className="block text-sm font-bold text-gray-500 uppercase tracking-wider">
                                1. Select Active Patient
                            </label>
                            
                            {/* Custom Search Select Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowPatientDropdown(!showPatientDropdown)}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-lg text-left text-gray-900 dark:text-white font-medium hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                    {selectedPatient ? (
                                        <span className="flex items-center">
                                            <User className="h-4 w-4 mr-2.5 text-blue-500" />
                                            {selectedPatient.first_name} {selectedPatient.last_name}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">Select Patient...</span>
                                    )}
                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                </button>

                                {showPatientDropdown && (
                                    <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-30 overflow-hidden">
                                        <div className="p-2 border-b border-gray-100 dark:border-gray-800">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Search..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-md focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                                            {filteredPatients.length === 0 ? (
                                                <div className="p-4 text-xs text-gray-500 text-center">No patients found</div>
                                            ) : (
                                                filteredPatients.map((p) => (
                                                    <button
                                                        key={p.id}
                                                        onClick={() => handleSelectPatient(p)}
                                                        className="w-full px-4 py-2.5 text-left text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-colors flex justify-between items-center"
                                                    >
                                                        <span>{p.first_name} {p.last_name}</span>
                                                        <span className="text-[10px] text-gray-400 font-mono">#{p.id.toString().padStart(4, "0")}</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedPatient && (
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Demographics:</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            {selectedPatient.gender === "M" ? "Male" : selectedPatient.gender === "F" ? "Female" : "Other"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Contact:</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedPatient.contact_number}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preferred Meal Timings Configuration */}
                        {selectedPatient && (
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                        <Clock className="h-4 w-4 mr-2 text-indigo-500" />
                                        2. Meal Timings (n8n Sync)
                                    </label>
                                    {!isEditingTimings && (
                                        <button
                                            onClick={() => setIsEditingTimings(true)}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center"
                                        >
                                            <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                                        </button>
                                    )}
                                </div>

                                {isEditingTimings ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Breakfast Preferred Time</label>
                                            <input
                                                type="text"
                                                value={breakfastTime}
                                                onChange={(e) => setBreakfastTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none"
                                                placeholder="e.g. 08:30 AM"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Lunch Preferred Time</label>
                                            <input
                                                type="text"
                                                value={lunchTime}
                                                onChange={(e) => setLunchTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none"
                                                placeholder="e.g. 01:30 PM"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Dinner Preferred Time</label>
                                            <input
                                                type="text"
                                                value={dinnerTime}
                                                onChange={(e) => setDinnerTime(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none"
                                                placeholder="e.g. 08:30 PM"
                                            />
                                        </div>
                                        <div className="flex space-x-2 pt-2">
                                            <button
                                                onClick={handleSaveMealTimings}
                                                disabled={updatingTimings}
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center"
                                            >
                                                {updatingTimings && <Loader2 className="animate-spin h-3.5 w-3.5 mr-1" />}
                                                Save Settings
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsEditingTimings(false);
                                                    setBreakfastTime(selectedPatient.breakfast_time);
                                                    setLunchTime(selectedPatient.lunch_time);
                                                    setDinnerTime(selectedPatient.dinner_time);
                                                }}
                                                className="px-3 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 py-2 rounded-lg text-xs font-bold transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-xl text-center space-y-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Breakfast</span>
                                            <p className="text-xs font-bold text-gray-800 dark:text-white">{selectedPatient.breakfast_time}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-xl text-center space-y-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Lunch</span>
                                            <p className="text-xs font-bold text-gray-800 dark:text-white">{selectedPatient.lunch_time}</p>
                                        </div>
                                        <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-xl text-center space-y-1">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Dinner</span>
                                            <p className="text-xs font-bold text-gray-800 dark:text-white">{selectedPatient.dinner_time}</p>
                                        </div>
                                    </div>
                                )}
                                <span className="text-[10px] text-gray-400 block leading-tight">
                                    * These times populate n8n workflow triggers to ping patient WhatsApp exactly on time.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Middle & Right Column: Interactive Dashboard / OCR & Dosage Timeline */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {selectedPatient ? (
                            <>
                                {/* Prescription Multimodal Upload Zone */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                        <Upload className="h-4 w-4 mr-2 text-blue-500" />
                                        3. Analyze New Prescription Scan / Photo
                                    </h3>

                                    <form onSubmit={handleUploadPrescription} className="space-y-4">
                                        <div
                                            onDragEnter={handleDrag}
                                            onDragLeave={handleDrag}
                                            onDragOver={handleDrag}
                                            onDrop={handleDrop}
                                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                                                dragActive
                                                    ? "border-blue-500 bg-blue-500/5"
                                                    : "border-gray-300 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-800"
                                            }`}
                                        >
                                            <input
                                                type="file"
                                                id="prescription-file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            
                                            {uploadPreview ? (
                                                <div className="space-y-4 max-w-sm mx-auto">
                                                    <img
                                                        src={uploadPreview}
                                                        alt="Prescription preview"
                                                        className="mx-auto h-48 rounded-xl object-contain shadow-sm border border-gray-100 dark:border-gray-850"
                                                    />
                                                    <div className="flex justify-center space-x-2">
                                                        <label
                                                            htmlFor="prescription-file"
                                                            className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                                                        >
                                                            Change Image
                                                        </label>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setUploadFile(null);
                                                                setUploadPreview(null);
                                                            }}
                                                            className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-colors"
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <label htmlFor="prescription-file" className="cursor-pointer space-y-3 block">
                                                    <div className="mx-auto w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shadow-inner">
                                                        <Upload className="h-5 w-5" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                            Drag & drop prescription or <span className="text-blue-600 dark:text-blue-400">browse file</span>
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Supports PNG, JPEG, JPG, WEBP up to 10MB
                                                        </p>
                                                    </div>
                                                </label>
                                            )}
                                        </div>

                                        {uploadError && (
                                            <div className="flex items-center space-x-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/30 text-xs">
                                                <AlertCircle className="h-4.5 w-4.5 flex-shrink-0" />
                                                <span>{uploadError}</span>
                                            </div>
                                        )}

                                        {uploadSuccess && (
                                            <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/30 text-xs">
                                                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                                                <span>Prescription analyzed successfully! AI extracted list of medicines and populated scheduling records.</span>
                                            </div>
                                        )}

                                        {uploadFile && (
                                            <button
                                                type="submit"
                                                disabled={isUploading}
                                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center disabled:opacity-50"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                                                        Gemini AI Extraction running...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Activity className="h-4.5 w-4.5 mr-2" />
                                                        Trigger AI OCR Scan
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </form>
                                </div>

                                {/* Active Schedule / Timeline */}
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-6">
                                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                        <Activity className="h-4 w-4 mr-2 text-emerald-500" />
                                        4. Active Patient Dosage Schedule
                                    </h3>

                                    {selectedPatient.medicines.length === 0 ? (
                                        <div className="text-center py-10 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                            <FileText className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-700" />
                                            <p className="mt-4 text-sm font-semibold text-gray-400">No active medicines scheduled.</p>
                                            <p className="text-xs text-gray-400 mt-1">Upload a prescription above to dynamically extract medicines.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-8">
                                            
                                            {/* Morning Cohort */}
                                            {medicinesByTiming.morning.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                                                            Morning Cohort ({selectedPatient.breakfast_time})
                                                        </h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {medicinesByTiming.morning.map((m) => (
                                                            <MedicineCard key={m.id} medicine={m} colorTheme="amber" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Afternoon Cohort */}
                                            {medicinesByTiming.afternoon.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-orange-400 animate-pulse"></span>
                                                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                                                            Afternoon Cohort ({selectedPatient.lunch_time})
                                                        </h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {medicinesByTiming.afternoon.map((m) => (
                                                            <MedicineCard key={m.id} medicine={m} colorTheme="orange" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Night Cohort */}
                                            {medicinesByTiming.night.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                                                            Night Cohort ({selectedPatient.dinner_time})
                                                        </h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {medicinesByTiming.night.map((m) => (
                                                            <MedicineCard key={m.id} medicine={m} colorTheme="indigo" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unscheduled Cohort */}
                                            {medicinesByTiming.any.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                                                        <span className="h-2.5 w-2.5 rounded-full bg-gray-400"></span>
                                                        <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider">
                                                            Any Time / As Needed
                                                        </h4>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {medicinesByTiming.any.map((m) => (
                                                            <MedicineCard key={m.id} medicine={m} colorTheme="gray" />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                        </div>
                                    )}
                                </div>

                                {/* Past Uploads History */}
                                {selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0 && (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm space-y-6">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center">
                                            <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                                            5. Prescription Archival Logs ({selectedPatient.prescriptions.length})
                                        </h3>

                                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {selectedPatient.prescriptions.map((pres) => {
                                                const isExpanded = expandedPrescriptionId === pres.id;
                                                const ocrStatusBadge = () => {
                                                    switch (pres.ocr_status) {
                                                        case "completed":
                                                            return <span className="text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">✓ OCR Done</span>;
                                                        case "processing":
                                                            return <span className="text-[10px] bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-0.5 rounded-full font-bold flex items-center"><Loader2 className="animate-spin h-3 w-3 mr-1" />Processing</span>;
                                                        case "failed":
                                                            return <span className="text-[10px] bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full font-bold flex items-center"><XCircle className="h-3 w-3 mr-1" />Failed</span>;
                                                        default:
                                                            return <span className="text-[10px] bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">Pending</span>;
                                                    }
                                                };
                                                return (
                                                    <div key={pres.id} className="py-4 first:pt-0 last:pb-0">
                                                        <div
                                                            onClick={() => setExpandedPrescriptionId(isExpanded ? null : pres.id)}
                                                            className="flex items-center justify-between cursor-pointer group"
                                                        >
                                                            <div className="flex items-center space-x-4">
                                                                <img
                                                                    src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}${pres.image}`}
                                                                    alt="Prescription"
                                                                    className="w-12 h-12 object-cover rounded-lg border border-gray-100 dark:border-gray-800 group-hover:scale-105 transition-all"
                                                                />
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-800 dark:text-white flex items-center space-x-2">
                                                                        <span>Uploaded on {new Date(pres.uploaded_at).toLocaleDateString()}</span>
                                                                        {ocrStatusBadge()}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400">
                                                                        {pres.medicines?.length || 0} active medicines extracted
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                                                                <span className="text-[11px] font-medium hidden sm:inline">Details</span>
                                                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                                                <div className="space-y-3">
                                                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Prescription Image</p>
                                                                    <a href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}${pres.image}`} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                                                                        <img
                                                                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}${pres.image}`}
                                                                            alt="Full size prescription"
                                                                            className="max-h-80 w-full object-contain mx-auto group-hover:scale-[1.02] transition-transform"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <span className="text-xs font-bold text-white px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">Open in new tab</span>
                                                                        </div>
                                                                    </a>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    {/* OCR Error Message & Retry */}
                                                                    {(pres.ocr_status === "failed" || pres.ocr_status === "pending") && (
                                                                        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3 space-y-2">
                                                                            <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center">
                                                                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                                                                {pres.ocr_status === "failed" ? "OCR Extraction Failed" : "OCR Not Yet Processed"}
                                                                            </p>
                                                                            {pres.ocr_error && (
                                                                                <p className="text-[10px] text-red-600 dark:text-red-300 leading-relaxed">
                                                                                    {pres.ocr_error.includes("quota") || pres.ocr_error.includes("429")
                                                                                        ? "Your Gemini API key has exceeded its free-tier quota. Please upgrade your API plan or wait for quota reset, then retry."
                                                                                        : pres.ocr_error}
                                                                                </p>
                                                                            )}
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); handleRetryOcr(pres.id); }}
                                                                                disabled={isUploading}
                                                                                className="mt-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center disabled:opacity-50"
                                                                            >
                                                                                <RefreshCw className={`h-3 w-3 mr-1 ${isUploading ? 'animate-spin' : ''}`} />
                                                                                Retry AI OCR Extraction
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {pres.ocr_status === "processing" && (
                                                                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl p-3 flex items-center space-x-2">
                                                                            <Loader2 className="animate-spin h-4 w-4 text-yellow-600" />
                                                                            <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">AI is analyzing this prescription... This may take a minute.</p>
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Gemini AI Transcribed JSON Summary</p>
                                                                        <pre className="text-[10px] font-mono bg-white dark:bg-black border border-gray-100 dark:border-gray-800 rounded-lg p-3 overflow-x-auto text-gray-700 dark:text-gray-300 max-h-40">
                                                                            {pres.extracted_text || (pres.ocr_status === "completed" ? "No summary text generated." : "Awaiting OCR processing...")}
                                                                        </pre>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-2">Medicines Linked</p>
                                                                        {pres.medicines && pres.medicines.length > 0 ? (
                                                                            <div className="space-y-1.5">
                                                                                {pres.medicines.map((m) => (
                                                                                    <div key={m.id} className="flex justify-between items-center text-xs p-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                                                                                        <div>
                                                                                            <span className="font-semibold text-gray-800 dark:text-white">{m.name} ({m.dosage})</span>
                                                                                            {m.instructions && (
                                                                                                <span className="ml-2 text-[10px] text-gray-400">— {m.instructions}</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-0.5 rounded font-medium capitalize">{m.timing}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ) : (
                                                                            <p className="text-[10px] text-gray-400 italic">
                                                                                {pres.ocr_status === "completed" ? "No medicines could be extracted from this image." : "Medicines will appear here after OCR completes."}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm flex flex-col justify-center items-center h-full min-h-[350px]">
                                <FileText className="h-16 w-16 text-gray-300 dark:text-gray-700 animate-pulse" />
                                <h4 className="text-lg font-bold text-gray-800 dark:text-white mt-4">No Patient Selected</h4>
                                <p className="text-sm text-gray-400 mt-2 max-w-sm">
                                    Configure or choose an active outpatient context using the panel on the left to start uploading prescriptions and managing dosage reminders.
                                </p>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

// MedicineCard Mini-Component
function MedicineCard({ medicine, colorTheme }: { medicine: Medicine; colorTheme: "amber" | "orange" | "indigo" | "gray" }) {
    const getBadgeStyle = () => {
        switch (colorTheme) {
            case "amber":
                return "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30";
            case "orange":
                return "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border border-orange-200 dark:border-orange-900/30";
            case "indigo":
                return "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/30";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-850 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div className="space-y-2">
                <div className="flex items-start justify-between">
                    <h5 className="font-black text-sm text-gray-950 dark:text-white leading-tight">
                        {medicine.name}
                    </h5>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getBadgeStyle()}`}>
                        {medicine.dosage}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded-xl border border-gray-100 dark:border-gray-850">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Frequency</span>
                        <span className="text-[11px] font-bold text-gray-800 dark:text-gray-300 capitalize">{medicine.frequency}</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-950 p-2 rounded-xl border border-gray-100 dark:border-gray-850">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black block">Duration</span>
                        <span className="text-[11px] font-bold text-gray-800 dark:text-gray-300 capitalize">{medicine.duration}</span>
                    </div>
                </div>
            </div>

            {medicine.instructions && (
                <div className="bg-blue-50/50 dark:bg-blue-900/10 p-2.5 rounded-xl border border-blue-100/50 dark:border-blue-900/20 text-[10px] text-blue-700 dark:text-blue-400 leading-normal flex items-start">
                    <Check className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 mt-0.5" />
                    <span>Instructions: {medicine.instructions}</span>
                </div>
            )}
        </div>
    );
}
