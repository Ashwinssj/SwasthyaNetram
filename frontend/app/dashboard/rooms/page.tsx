"use client";

import { useEffect, useState } from "react";
import { useHospital } from "@/context/HospitalContext";
import {
    Bed,
    Plus,
    UserPlus,
    UserMinus,
    CheckCircle,
    XCircle,
    Hospital,
    Loader2,
} from "lucide-react";

interface PatientDetails {
    id: number;
    first_name: string;
    last_name: string;
    contact_number: string;
}

interface Room {
    id: number;
    hospital: number;
    room_number: string;
    room_type: "General Ward" | "Semi-Private" | "Private" | "ICU";
    current_patient: number | null;
    patient_details: PatientDetails | null;
    created_at: string;
}

interface UnassignedPatient {
    id: number;
    first_name: string;
    last_name: string;
    contact_number: string;
}

export default function RoomsPage() {
    const { selectedHospitalId } = useHospital();
    
    // States
    const [rooms, setRooms] = useState<Room[]>([]);
    const [unassignedPatients, setUnassignedPatients] = useState<UnassignedPatient[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total_rooms: 0,
        occupied_rooms: 0,
        available_rooms: 0,
        occupancy_rate: "0%"
    });

    // Modal States
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

    // Form States
    const [newRoomNumber, setNewRoomNumber] = useState("");
    const [newRoomType, setNewRoomType] = useState<Room["room_type"]>("General Ward");
    const [bedCount, setBedCount] = useState<number>(1);
    const [selectedPatientId, setSelectedPatientId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Fetch rooms, stats, and unassigned patients
    const fetchData = async () => {
        if (!selectedHospitalId) return;
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";

            // 1. Fetch Rooms
            const roomsRes = await fetch(
                `${apiBaseUrl}/api/rooms/?hospital_id=${selectedHospitalId}`,
                { headers }
            );
            if (roomsRes.ok) {
                const data = await roomsRes.json();
                setRooms(data);
            }

            // 2. Fetch Unassigned Patients
            const patientsRes = await fetch(
                `${apiBaseUrl}/api/patients/?hospital_id=${selectedHospitalId}&unassigned_only=true`,
                { headers }
            );
            if (patientsRes.ok) {
                const data = await patientsRes.json();
                setUnassignedPatients(data);
            }

            // 3. Fetch Dashboard Stats
            const statsRes = await fetch(
                `${apiBaseUrl}/api/dashboard/stats/?hospital_id=${selectedHospitalId}`,
                { headers }
            );
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats({
                    total_rooms: data.total_rooms || 0,
                    occupied_rooms: data.occupied_rooms || 0,
                    available_rooms: data.available_rooms || 0,
                    occupancy_rate: data.room_occupancy || "0%"
                });
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedHospitalId]);

    // Handle Create Room
    const handleAddRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoomNumber || !selectedHospitalId) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/rooms/`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    hospital: selectedHospitalId,
                    room_number: newRoomNumber,
                    room_type: newRoomType,
                    current_patient: null,
                    bed_count: bedCount
                })
            });

            if (res.ok) {
                setNewRoomNumber("");
                setNewRoomType("General Ward");
                setBedCount(1);
                setShowAddModal(false);
                fetchData();
            } else {
                const data = await res.json();
                setErrorMessage(data.error || "Failed to create room. Room number may already exist.");
            }
        } catch (error) {
            setErrorMessage("Network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Assign Patient
    const handleAssignPatient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoom || !selectedPatientId) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            };

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/rooms/${selectedRoom.id}/assign_patient/`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ patient_id: selectedPatientId })
                }
            );

            if (res.ok) {
                setSelectedPatientId("");
                setSelectedRoom(null);
                setShowAssignModal(false);
                fetchData();
            } else {
                const data = await res.json();
                setErrorMessage(data.error || "Failed to assign patient.");
            }
        } catch (error) {
            setErrorMessage("Network error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Release/Discharge Patient
    const handleReleasePatient = async (roomId: number) => {
        if (!confirm("Are you sure you want to discharge the patient from this room/bed?")) return;

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/rooms/${roomId}/release_patient/`,
                {
                    method: "POST",
                    headers
                }
            );

            if (res.ok) {
                fetchData();
            } else {
                alert("Failed to release patient.");
            }
        } catch (error) {
            console.error("Error releasing patient:", error);
        }
    };

    // Card Colors based on Room Type
    const getRoomBadgeColor = (type: Room["room_type"]) => {
        switch (type) {
            case "ICU":
                return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800";
            case "Private":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800";
            case "Semi-Private":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800";
            default:
                return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800";
        }
    };

    if (isLoading && rooms.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-600" />
                    <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Loading Ward & Room details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 dark:bg-gray-950 min-h-screen text-gray-900 dark:text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 border-b border-gray-200 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <Bed className="mr-3 h-8 w-8 text-blue-600" />
                        Room & Ward Allocation
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manually manage hospital rooms, monitor admissions, and allocate beds for active patients.
                    </p>
                </div>
                <div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Add New Room / Bed
                    </button>
                </div>
            </div>

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Rooms */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg mr-4">
                        <Hospital className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Beds</p>
                        <p className="text-2xl font-bold">{stats.total_rooms}</p>
                    </div>
                </div>

                {/* Occupied */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg mr-4">
                        <XCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupied Beds</p>
                        <p className="text-2xl font-bold">{stats.occupied_rooms}</p>
                    </div>
                </div>

                {/* Available */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg mr-4">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Beds</p>
                        <p className="text-2xl font-bold">{stats.available_rooms}</p>
                    </div>
                </div>

                {/* Occupancy Rate */}
                <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center">
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg mr-4">
                        <Bed className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Occupancy Rate</p>
                        <p className="text-2xl font-bold">{stats.occupancy_rate}</p>
                    </div>
                </div>
            </div>

            {/* Room Grid */}
            {rooms.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-12 rounded-xl text-center shadow-sm">
                    <Bed className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">No Rooms Provisioned</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        This hospital branch does not have any rooms or beds configured. Create one manually to get started!
                    </p>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-6 inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Bed
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {rooms.map((room) => {
                        const isOccupied = room.current_patient !== null;
                        return (
                            <div
                                key={room.id}
                                className={`bg-white dark:bg-gray-900 rounded-xl border transition-all shadow-sm ${
                                    isOccupied
                                        ? "border-blue-200 dark:border-blue-900 shadow-blue-500/5 dark:shadow-blue-500/0"
                                        : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                                } p-6 flex flex-col justify-between`}
                            >
                                <div className="space-y-4">
                                    {/* Top Row: Room number + Type */}
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                            <span className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded mr-2 font-mono text-sm text-gray-700 dark:text-gray-300">
                                                {room.room_number}
                                            </span>
                                        </h3>
                                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getRoomBadgeColor(room.room_type)}`}>
                                            {room.room_type}
                                        </span>
                                    </div>

                                    {/* Patient Info or Available Statement */}
                                    <div className="pt-2 border-t border-gray-100 dark:border-gray-850">
                                        {isOccupied && room.patient_details ? (
                                            <div className="space-y-1 text-sm">
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Admitted Patient</p>
                                                <p className="font-bold text-blue-600 dark:text-blue-400">
                                                    {room.patient_details.first_name} {room.patient_details.last_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Phone: {room.patient_details.contact_number}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Available
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    {isOccupied ? (
                                        <button
                                            onClick={() => handleReleasePatient(room.id)}
                                            className="w-full inline-flex items-center justify-center px-3.5 py-2 border border-red-200 dark:border-red-900/30 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                        >
                                            <UserMinus className="mr-2 h-4 w-4" />
                                            Discharge / Release
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSelectedRoom(room);
                                                setShowAssignModal(true);
                                            }}
                                            className="w-full inline-flex items-center justify-center px-3.5 py-2 border border-blue-600 dark:border-blue-500 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                                        >
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Admit / Allocate
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal 1: Add Room */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 w-full max-w-md p-6 rounded-xl shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Room / Bed</h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setErrorMessage("");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-medium">
                                {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleAddRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Room / Bed Identifier</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. 101-A, ICU-Bed3"
                                    value={newRoomNumber}
                                    onChange={(e) => setNewRoomNumber(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Room Type</label>
                                <select
                                    value={newRoomType}
                                    onChange={(e) => setNewRoomType(e.target.value as Room["room_type"])}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="General Ward">General Ward</option>
                                    <option value="Semi-Private">Semi-Private</option>
                                    <option value="Private">Private</option>
                                    <option value="ICU">ICU</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Number of Beds (Bulk Creation)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    required
                                    value={bedCount}
                                    onChange={(e) => setBedCount(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                                <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">
                                    If greater than 1, beds will be generated as e.g. <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[11px]">{newRoomNumber || "Room"}-Bed1</code> to <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded font-mono text-[11px]">{newRoomNumber || "Room"}-Bed{bedCount}</code>.
                                </span>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setErrorMessage("");
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 inline-flex items-center"
                                >
                                    {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Create Bed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Assign Patient */}
            {showAssignModal && selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-850 w-full max-w-md p-6 rounded-xl shadow-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                Admit Patient to {selectedRoom.room_type} {selectedRoom.room_number}
                            </h3>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    setSelectedRoom(null);
                                    setErrorMessage("");
                                }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-medium">
                                {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleAssignPatient} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1 text-gray-700 dark:text-gray-300">Select Outpatient (Unassigned)</label>
                                {unassignedPatients.length === 0 ? (
                                    <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30">
                                        No unassigned outpatients found in this hospital context. Go to the Patients page to register a new patient first!
                                    </p>
                                ) : (
                                    <select
                                        required
                                        value={selectedPatientId}
                                        onChange={(e) => setSelectedPatientId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                                    >
                                        <option value="">-- Choose Patient --</option>
                                        {unassignedPatients.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.first_name} {p.last_name} ({p.contact_number})
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedRoom(null);
                                        setErrorMessage("");
                                    }}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || unassignedPatients.length === 0}
                                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 inline-flex items-center"
                                >
                                    {isSubmitting && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Allocate Bed
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
