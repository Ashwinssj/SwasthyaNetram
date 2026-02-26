"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AddHospitalModal } from "@/components/AddHospitalModal";

export interface Hospital {
    id: number;
    name: string;
    city: string;
    address: string;
    contact_number: string;
}

interface HospitalContextType {
    selectedHospitalId: number | null;
    setSelectedHospitalId: (id: number | null) => void;
    hospitals: Hospital[];
    loading: boolean;
    addHospital: (hospital: Omit<Hospital, "id">) => Promise<void>;
    deleteHospital: (id: number) => Promise<void>;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

export function HospitalProvider({ children }: { children: ReactNode }) {
    const [selectedHospitalId, setSelectedHospitalId] = useState<number | null>(null);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchHospitals = () => {
        setLoading(true);
        fetch("http://127.0.0.1:8000/api/hospitals/")
            .then((res) => res.json())
            .then((data) => {
                setHospitals(data);
                if (data.length > 0) {
                    if (!selectedHospitalId) {
                        setSelectedHospitalId(data[0].id);
                    }
                } else {
                    setShowAddModal(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Failed to fetch hospitals:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const addHospital = async (hospitalData: Omit<Hospital, "id">) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/api/hospitals/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(hospitalData),
            });

            if (res.ok) {
                const newHospital = await res.json();
                setHospitals((prev) => [...prev, newHospital]);
                setSelectedHospitalId(newHospital.id);
                setShowAddModal(false);
            } else {
                throw new Error("Failed to add hospital");
            }
        } catch (error) {
            console.error("Error adding hospital:", error);
            throw error;
        }
    };

    const deleteHospital = async (id: number) => {
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/hospitals/${id}/`, {
                method: "DELETE",
            });

            if (res.ok) {
                setHospitals((prev) => prev.filter((h) => h.id !== id));
                if (selectedHospitalId === id) {
                    setSelectedHospitalId(null);
                }
            } else {
                throw new Error("Failed to delete hospital");
            }
        } catch (error) {
            console.error("Error deleting hospital:", error);
            throw error;
        }
    };

    return (
        <HospitalContext.Provider
            value={{ selectedHospitalId, setSelectedHospitalId, hospitals, loading, addHospital, deleteHospital }}
        >
            {children}
            <AddHospitalModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
        </HospitalContext.Provider>
    );
}

export function useHospital() {
    const context = useContext(HospitalContext);
    if (context === undefined) {
        throw new Error("useHospital must be used within a HospitalProvider");
    }
    return context;
}
