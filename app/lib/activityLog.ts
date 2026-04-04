export type LogEntry = {
    id: string;
    action: string;
    entityId?: string;
    oldValue?: any;
    newValue?: any;
    timestamp: number;
};

const STORAGE_KEY = "activity_log";
const ONE_DAY = 24 * 60 * 60 * 1000;

export function getLogs(): LogEntry[] {
    if (typeof window === "undefined") return [];

    const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    const filtered = logs.filter(
        (log: LogEntry) => Date.now() - log.timestamp < ONE_DAY
    )

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    return filtered;
}

export function addLog(entry: Omit<LogEntry, "id" | "timestamp">) {
    const logs = getLogs();

    const newLog: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        ...entry,
    };

    const updated = [newLog, ...logs];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    return newLog;
}

export function clearLogs() {
    localStorage.removeItem(STORAGE_KEY);
}