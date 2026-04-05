"use client";

import { useEffect, useState } from "react";
import { getLogs, LogEntry } from "@/app/lib/activityLog";

export default function LogsPage() {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const savedLogs = getLogs();
        setLogs(savedLogs);
    }, []);

    return (
        <div className="min-h-screen p-6 bg-gray-50">
            <h1 className="text-2x1 font-bold mb-4">Activity Logs</h1>

            {logs.length === 0 ? (
                <p className="text-gray-500">No Activity Logs Available</p>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border px-4 py-2 text-left">Action</th>
                            <th className="border px-4 py-2 text-left">Entity</th>
                            <th className="border px-4 py-2 text-left">Old Value</th>
                            <th className="border px-4 py-2 text-left">New Value</th>
                            <th className="border px-4 py-2 text-left">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="even:bg-gray-100">
                                <td className="border px-4 py-2">{log.action}</td>
                                <td className="border px-4 py-2">{log.entityId || "-"}</td>
                                <td className="border px-4 py-2">{JSON.stringify(log.oldValue) || "-"}</td>
                                <td className="border px-4 py-2">{JSON.stringify(log.newValue) || "-"}</td>
                                <td className="border px-4 py-2">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

