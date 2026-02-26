"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { SummaryCard } from "@/components/SummaryCard";
import { PatientStatisticsChart } from "@/components/PatientStatisticsChart";
import { Users, Calendar, Activity, BedDouble, Stethoscope } from "lucide-react";
import { useHospital } from "@/context/HospitalContext";

export default function Dashboard() {
  const { selectedHospitalId } = useHospital();
  const [stats, setStats] = useState({
    total_patients: 0,
    total_employees: 0,
    total_doctors: 0,
    operations: 0,
    room_occupancy: "0%",
    chart_data: [],
    upcoming_schedule: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedHospitalId) return;

    setLoading(true);
    const token = localStorage.getItem("access_token");

    fetch(`http://127.0.0.1:8000/api/dashboard/stats/?hospital_id=${selectedHospitalId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
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
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats:", err);
        setLoading(false);
      });
  }, [selectedHospitalId]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Patients"
            value={loading ? "..." : stats.total_patients}
            icon={Users}
            trend="+12%"
            trendUp={true}
          />
          <SummaryCard
            title="Total Staff"
            value={loading ? "..." : stats.total_employees}
            icon={Users}
            trend="+5%"
            trendUp={true}
          />
          <SummaryCard
            title="Doctors Available"
            value={loading ? "..." : stats.total_doctors}
            icon={Stethoscope}
            trend="Active"
            trendUp={true}
          />
          <SummaryCard
            title="Room Occupancy"
            value={loading ? "..." : stats.room_occupancy}
            icon={BedDouble}
            trend="+8%"
            trendUp={true}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PatientStatisticsChart data={stats.chart_data} />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Schedule
            </h3>
            <div className="space-y-4">
              {stats.upcoming_schedule && stats.upcoming_schedule.length > 0 ? (
                stats.upcoming_schedule.map((appointment: any) => (
                  <div
                    key={appointment.id}
                    className="flex items-center space-x-4 rounded-lg border border-gray-100 p-3 dark:border-gray-800"
                  >
                    <div className="flex-shrink-0 rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                      <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {appointment.doctor_details ? `Dr. ${appointment.doctor_details.first_name} ${appointment.doctor_details.last_name}` : "Unknown Doctor"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {appointment.doctor_details?.role || "Doctor"} • {appointment.appointment_time}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming appointments.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
