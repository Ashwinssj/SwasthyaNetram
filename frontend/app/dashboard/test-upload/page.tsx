"use client";

import { useState } from "react";

export default function TestUploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [result, setResult] = useState<string>("");

    const handleUpload = async () => {
        if (!file) return;
        
        const token = localStorage.getItem("access_token");
        const formData = new FormData();
        formData.append("patient", "3"); // Use the dummy patient from earlier test
        formData.append("title", "Browser Upload Test");
        formData.append("file", file);

        try {
            const res = await fetch("http://127.0.0.1:8000/api/patients/reports/", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                    // NO CONTENT TYPE
                },
                body: formData
            });

            if (!res.ok) {
                const errText = await res.text();
                setResult(`ERROR: ${res.status} - ${errText}`);
            } else {
                const data = await res.json();
                setResult(`SUCCESS: ${JSON.stringify(data, null, 2)}`);
            }
        } catch (err: any) {
            setResult(`CATCH ERROR: ${err.message}`);
        }
    };

    return (
        <div className="p-10">
            <h1 className="text-xl font-bold mb-4">Upload Debugger</h1>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mb-4" />
            <br />
            <button onClick={handleUpload} className="bg-blue-600 text-white px-4 py-2 rounded">
                Test Upload
            </button>
            <pre className="mt-6 p-4 bg-gray-100 rounded text-sm text-black">
                {result || "Waiting..."}
            </pre>
        </div>
    );
}
