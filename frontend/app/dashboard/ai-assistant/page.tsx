"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Bot, Send, User, Loader2, Plus, MessageSquare, Trash2, Menu, PanelLeft } from "lucide-react";
import { useHospital } from "@/context/HospitalContext";

interface Message {
    id: number;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

interface ChatSession {
    id: number;
    title: string;
    created_at: string;
    first_message: string;
}

// Helper to parse and render styled cards or custom elements in chatbot responses
function FormattedMessage({ content }: { content: string }) {
    // 1. Detect if it contains Patient Details (e.g. Patient ID, Name, Gender, etc.)
    if (content.includes("Patient ID:") || content.includes("Successfully created patient") || (content.includes("Patient:") && content.includes("Gender:"))) {
        const idMatch = content.match(/(?:Patient ID|ID):\s*\*?#?(\d+)/i);
        const nameMatch = content.match(/(?:Name):\s*\*?\*?([^*\n-]+)/i);
        const genderMatch = content.match(/(?:Gender):\s*\*?\*?([^*\n|-]+)/i);
        const dobMatch = content.match(/(?:DOB|Date of Birth):\s*\*?\*?([^*\n|-]+)/i);
        const phoneMatch = content.match(/(?:Phone|Contact):\s*\*?\*?([^*\n|-]+)/i);
        const historyMatch = content.match(/(?:Medical History|Symptoms|History):\s*\*?\*?([^\n]+)/i);

        const nameVal = nameMatch ? nameMatch[1].trim() : "";
        const idVal = idMatch ? idMatch[1].trim() : "";

        if (nameVal || idVal) {
            return (
                <div className="my-2 overflow-hidden rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 shadow-sm dark:border-emerald-950/20 dark:bg-emerald-950/10">
                    <div className="flex items-center gap-2 pb-2 border-b border-emerald-100/60 dark:border-emerald-950/20">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">📋 Patient Card</span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                        {nameVal && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Name:</span> {nameVal}</div>}
                        {idVal && <div><span className="font-semibold text-gray-500 dark:text-gray-400">ID:</span> #{idVal}</div>}
                        {genderMatch && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Gender:</span> {genderMatch[1].trim()}</div>}
                        {dobMatch && <div><span className="font-semibold text-gray-500 dark:text-gray-400">DOB:</span> {dobMatch[1].trim()}</div>}
                        {phoneMatch && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Phone:</span> {phoneMatch[1].trim()}</div>}
                    </div>
                    {historyMatch && (
                        <div className="mt-2.5 border-t border-emerald-100/40 pt-2 text-sm dark:border-emerald-950/10">
                            <span className="font-semibold text-gray-500 dark:text-gray-400">Medical Notes:</span>
                            <p className="mt-0.5 text-gray-600 dark:text-gray-300 italic">{historyMatch[1].trim()}</p>
                        </div>
                    )}
                </div>
            );
        }
    }

    // 2. Detect if it contains Appointment Confirmation details
    if (content.includes("Successfully booked appointment") || content.includes("appointment (ID:") || (content.includes("Appointment ID:") && content.includes("Doctor:"))) {
        const idMatch = content.match(/(?:Appointment ID|ID):\s*\*?#?(\d+)/i);
        const doctorMatch = content.match(/(?:Doctor):\s*\*?\*?([^*\n,-]+)/i) || content.match(/with Dr\.\s*\*?\*?([^*\n,-]+)/i);
        const dateMatch = content.match(/(?:Date):\s*\*?\*?([^*\n,-]+)/i) || content.match(/on\s*\*?\*?(\d{4}-\d{2}-\d{2})/i);
        const timeMatch = content.match(/(?:Time):\s*\*?\*?([^*\n\s-]+)/i) || content.match(/at\s*\*?\*?(\d{2}:\d{2})/i);
        const patientMatch = content.match(/(?:Patient):\s*\*?\*?([^*\n,-]+)/i) || content.match(/for\s*\*?\*?([^*\n,-]+)/i);

        const doctorVal = doctorMatch ? doctorMatch[1].trim() : "";
        const dateVal = dateMatch ? dateMatch[1].trim() : "";

        if (doctorVal || dateVal) {
            return (
                <div className="my-2 overflow-hidden rounded-xl border border-blue-100 bg-blue-50/30 p-4 shadow-sm dark:border-blue-950/20 dark:bg-blue-950/10">
                    <div className="flex items-center gap-2 pb-2 border-b border-blue-100/60 dark:border-blue-950/20">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">📅 Appointment Confirmation</span>
                    </div>
                    <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                        {idMatch && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Appt ID:</span> #{idMatch[1].trim()}</div>}
                        {patientMatch && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Patient:</span> {patientMatch[1].trim()}</div>}
                        {doctorVal && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Doctor:</span> Dr. {doctorVal}</div>}
                        {dateVal && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Date:</span> {dateVal}</div>}
                        {timeMatch && <div><span className="font-semibold text-gray-500 dark:text-gray-400">Time:</span> {timeMatch[1].trim()}</div>}
                        <div><span className="font-semibold text-gray-500 dark:text-gray-400">Status:</span> <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/30 dark:text-green-300">Confirmed</span></div>
                    </div>
                </div>
            );
        }
    }

    // 3. Detect if it contains Doctor Schedule/Timeslots details
    if (content.includes("Doctor Schedule") || content.includes("timeslots configured") || (content.includes("Slots:") && (content.includes("Available") || content.includes("Booked")))) {
        const docMatch = content.match(/(?:Dr\.|Doctor):\s*\*?\*?([^*\n-]+)/i);
        const dateMatch = content.match(/(?:Date):\s*\*?\*?([^*\n\s]+)/i) || content.match(/Schedule for\s*\*?\*?(\d{4}-\d{2}-\d{2})/i);
        const dayMatch = content.match(/(?:Day|Day of week):\s*\*?\*?([^*\n\s]+)/i);
        
        // Extract individual slot lines e.g. " - 10:30 - Available" or " - 10:30 (Available)" or " - 10:30: Booked"
        const slotRegex = /(?:-\s*\*?|\b)(\d{2}:\d{2})(?:\s*-\s*|\s*:\s*|\s*\()\*?(Available|Booked)\*?\)?/gi;
        const slots: Array<{ time: string; status: string }> = [];
        let match;
        while ((match = slotRegex.exec(content)) !== null) {
            slots.push({ time: match[1], status: match[2] });
        }

        const docName = docMatch ? docMatch[1].trim() : "Doctor";

        return (
            <div className="my-2 overflow-hidden rounded-xl border border-violet-100 bg-violet-50/30 p-4 shadow-sm dark:border-violet-950/20 dark:bg-violet-950/10">
                <div className="flex items-center gap-2 pb-2 border-b border-violet-100/60 dark:border-violet-950/20">
                    <span className="text-violet-600 dark:text-violet-400 font-bold">🕒 Dr. {docName}'s Schedule</span>
                </div>
                {dateMatch && (
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Date: <span className="font-semibold">{dateMatch[1].trim()}</span> {dayMatch && <span>({dayMatch[1].trim()})</span>}
                    </div>
                )}
                <div className="mt-3.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available Timeslots</span>
                    {slots.length === 0 ? (
                        <p className="mt-1 text-sm text-gray-500 italic">No timeslots found or all slots are booked.</p>
                    ) : (
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {slots.map((slot, sIdx) => {
                                const isAvailable = slot.status.toLowerCase() === "available";
                                return (
                                    <div
                                        key={sIdx}
                                        className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-lg border text-xs font-medium transition-all ${
                                            isAvailable
                                                ? "border-emerald-200 bg-emerald-50/40 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400"
                                                : "border-gray-200 bg-gray-100/40 text-gray-400 line-through dark:border-gray-800 dark:bg-gray-800/20 dark:text-gray-600"
                                        }`}
                                    >
                                        <span>{slot.time}</span>
                                        <span className="text-[9px] mt-0.5 opacity-80">{slot.status}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // 4. Fallback: Parse basic markdown lines
    const lines = content.split('\n');
    return (
        <div className="space-y-1 text-[15px] leading-relaxed">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;
                
                // Match lists
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const contentVal = trimmed.substring(2);
                    return (
                        <ul key={idx} className="list-disc list-inside ml-4 my-0.5">
                            <li>{parseBoldText(contentVal)}</li>
                        </ul>
                    );
                }
                
                // Match headers
                if (trimmed.startsWith('### ')) {
                    return <h4 key={idx} className="font-semibold text-base mt-2 mb-0.5 text-gray-900 dark:text-white">{parseBoldText(trimmed.substring(4))}</h4>;
                }
                if (trimmed.startsWith('## ')) {
                    return <h3 key={idx} className="font-bold text-lg mt-3 mb-1 text-gray-900 dark:text-white">{parseBoldText(trimmed.substring(3))}</h3>;
                }
                
                return <p key={idx} className="my-0.5">{parseBoldText(line)}</p>;
            })}
        </div>
    );
}

// Utility to render **bold** text in JSX
function parseBoldText(text: string) {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
        return index % 2 === 1 ? <strong key={index} className="font-semibold text-gray-900 dark:text-white">{part}</strong> : part;
    });
}

export default function AIAssistantPage() {
    const { selectedHospitalId } = useHospital();

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [profile, setProfile] = useState<{ username: string; email: string; role: string; plan: string; ai_plan: string } | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch Profile
    useEffect(() => {
        const token = localStorage.getItem("access_token");
        if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/auth/me/`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => setProfile(data))
            .catch(err => console.error("Error loading user profile:", err));
        }
    }, []);

    // Fetch Sessions List
    const fetchSessions = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/ai/sessions/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (error) {
            console.error("Failed to fetch sessions:", error);
        } finally {
            setSessionsLoading(false);
        }
    };

    // Load a specific session
    const loadSession = async (sessionId: number) => {
        setLoading(true);
        setCurrentSessionId(sessionId);
        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/ai/sessions/${sessionId}/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                // Backend returns full session object with 'messages' list
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error("Failed to load session:", error);
        } finally {
            setLoading(false);
            // On mobile, close sidebar after selection
            if (window.innerWidth < 768) setIsSidebarOpen(false);
        }
    };

    // Delete Session
    const deleteSession = async (e: React.MouseEvent, sessionId: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this chat?")) return;

        const token = localStorage.getItem("access_token");
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/ai/sessions/${sessionId}/`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                setSessions(prev => prev.filter(s => s.id !== sessionId));
                if (currentSessionId === sessionId) {
                    handleNewChat();
                }
            }
        } catch (error) {
            console.error("Failed to delete session:", error);
        }
    };

    const handleNewChat = () => {
        setCurrentSessionId(null);
        setMessages([]);
        setInputValue("");
    };

    // Initialize
    useEffect(() => {
        fetchSessions();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newUserMessage: Message = {
            id: Date.now(),
            role: "user",
            content: inputValue,
            timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, newUserMessage]);
        setInputValue("");
        setLoading(true);

        const token = localStorage.getItem("access_token");

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/ai/chat/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: newUserMessage.content,
                    hospital_id: selectedHospitalId,
                    session_id: currentSessionId // Pass current session if exists
                }),
            });

            if (res.ok) {
                const data = await res.json();

                // If this was a new chat, the backend created a session and returned its ID
                // Validating session creation and strictly refreshing the list
                if (!currentSessionId && data.session_id) {
                    console.log("New Session Created:", data.session_id);
                    setCurrentSessionId(data.session_id);
                    await fetchSessions(); // Await the refresh
                }

                setMessages((prev) => [...prev, {
                    id: Date.now() + 1,
                    role: "assistant", // "assistant"
                    content: data.content,
                    timestamp: new Date().toISOString()
                }]);
            } else if (res.status === 401) {
                window.location.href = "/login";
            } else {
                setMessages((prev) => [...prev, {
                    id: Date.now() + 1,
                    role: "assistant",
                    content: "Sorry, I am unable to process your request.",
                    timestamp: new Date().toISOString()
                }]);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen flex-row bg-gray-50 dark:bg-gray-950 overflow-hidden">

            {/* Sidebar (Collapsible) */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-50 h-full bg-gray-900 text-white transition-all duration-300 ease-in-out md:relative
                    ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'}
                `}
            >
                <div className={`flex h-full flex-col p-4 w-64 ${!isSidebarOpen && 'hidden'}`}>
                    {/* Header: New Chat & Close Toggle */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Bot className="h-8 w-8 text-blue-400" />
                            <span className="text-xl font-bold tracking-tight">Swasthya AI</span>
                        </div>
                        {/* Mobile & Desktop Close Button */}
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="rounded-md p-1 hover:bg-gray-800 text-gray-400 hover:text-white md:block"
                            title="Close Sidebar"
                        >
                            <PanelLeft className="h-5 w-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleNewChat}
                        className="mb-6 flex w-full items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 p-3 text-sm transition-colors hover:bg-gray-700 hover:text-white"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Chat</span>
                    </button>

                    <div className="mb-2 px-2 text-xs font-semibold uppercase text-gray-500">
                        Recent History
                    </div>

                    {/* History List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {sessionsLoading ? (
                            <div className="flex justify-center p-4"><Loader2 className="h-5 w-5 animate-spin text-gray-500" /></div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center text-xs text-gray-500 py-4">No history yet</div>
                        ) : (
                            sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => loadSession(session.id)}
                                    className={`
                                        group flex cursor-pointer items-center justify-between rounded-lg p-3 text-sm transition-colors
                                        ${currentSessionId === session.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}
                                    `}
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{session.title || "Untitled Chat"}</span>
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(e, session.id)}
                                        className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer User Profile (Cosmetic) */}
                    <div className="mt-4 border-t border-gray-800 pt-4">
                        <div className="flex items-center gap-3 px-2">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                                {profile?.email ? profile.email.slice(0, 2).toUpperCase() : "DR"}
                            </div>
                            <div className="text-sm overflow-hidden flex-1">
                                <p className="font-medium text-gray-200 truncate" title={profile?.email || "Dr. User"}>
                                    {profile?.email || "Dr. User"}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {profile?.ai_plan || "Pro Plan"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex flex-1 flex-col h-full relative transition-all duration-300">

                {/* Header (Simplified) */}
                <header className="flex h-16 items-center border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-950">
                    <div className="flex items-center gap-4">
                        {/* Toggle Button (Visible when sidebar is closed) */}
                        {!isSidebarOpen && (
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="p-2 -ml-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
                                title="Open Sidebar"
                            >
                                <PanelLeft className="h-5 w-5" />
                            </button>
                        )}

                        <div className="flex items-center gap-4">
                            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                {currentSessionId ? sessions.find(s => s.id === currentSessionId)?.title : "New Conversation"}
                            </span>
                            <div className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                Gemini 3.5 Pro
                            </div>
                        </div>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-gray-950">
                    <div className="mx-auto max-w-3xl space-y-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center pt-20 text-center opacity-50">
                                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <Bot className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white">How can I help you today?</h3>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={msg.id || idx}
                                    className={`flex items-start gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div
                                        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${msg.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-emerald-600 text-white"
                                            }`}
                                    >
                                        {msg.role === "user" ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                                    </div>
                                    <div
                                        className={`rounded-2xl px-5 py-3 max-w-[85%] ${msg.role === "user"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                                            }`}
                                    >
                                        {msg.role === "user" ? (
                                            <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                                                {msg.content}
                                            </p>
                                        ) : (
                                            <FormattedMessage content={msg.content} />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}

                        {loading && (
                            <div className="flex items-start gap-4">
                                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                                    <Bot className="h-5 w-5" />
                                </div>
                                <div className="rounded-2xl bg-gray-100 px-5 py-3 dark:bg-gray-800">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
                    <div className="mx-auto max-w-3xl">
                        <form onSubmit={handleSendMessage} className="relative flex items-center">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Message Swasthya AI..."
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-5 pr-12 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || loading}
                                className="absolute right-2 rounded-lg p-2 text-gray-400 hover:bg-gray-200 hover:text-blue-600 disabled:opacity-50 dark:hover:bg-gray-700"
                            >
                                <Send className="h-5 w-5" />
                            </button>
                        </form>
                        <p className="mt-2 text-center text-xs text-gray-400">
                            Swasthya AI can make mistakes. Verify important medical info.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
