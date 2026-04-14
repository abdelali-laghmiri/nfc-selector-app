import { useState, useEffect, useRef } from "react";
import type { AuthUser } from "@/types/auth";

interface SelectionScreenProps {
  user: AuthUser;
  onLogout: () => void;
}

interface ScanResult {
  employeeId: string;
  employeeName: string;
  timestamp: Date;
  success: boolean;
  message: string;
}

export function SelectionScreen({ user, onLogout }: SelectionScreenProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isScanning]);

  const handleNfcScan = async (nfcId: string) => {
    setIsScanning(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "https://backend-n-lac.vercel.app"}/api/v1/attendance/nfc-scans`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("nfc_selector.access_token")}`,
          },
          body: JSON.stringify({ nfc_uid: nfcId }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setLastScan({
          employeeId: String(data.employee_id || nfcId),
          employeeName: data.employee_name || "Unknown",
          timestamp: new Date(),
          success: true,
          message: data.message || "Check-in successful",
        });
      } else {
        setLastScan({
          employeeId: nfcId,
          employeeName: "Unknown",
          timestamp: new Date(),
          success: false,
          message: data.detail || "Check-in failed",
        });
      }
    } catch {
      setLastScan({
        employeeId: nfcId,
        employeeName: "Unknown",
        timestamp: new Date(),
        success: false,
        message: "Network error - please try again",
      });
    } finally {
      setIsScanning(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white">NFC Selector</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-gray-400 text-sm">
              {isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-300">
            Welcome, {user.first_name} {user.last_name}
          </span>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-blue-600 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isScanning ? "Reading NFC Card..." : "Ready to Scan"}
          </h2>
          <p className="text-gray-400">
            {isScanning
              ? "Hold the NFC card near the scanner"
              : "Tap an NFC card to select employee"}
          </p>
        </div>

        <input
          ref={inputRef}
          type="text"
          className="opacity-0 absolute"
          onChange={(e) => {
            if (e.target.value) {
              handleNfcScan(e.target.value);
              e.target.value = "";
            }
          }}
          autoFocus
        />

        {lastScan && (
          <div
            className={`mt-8 p-6 rounded-lg text-center ${
              lastScan.success
                ? "bg-green-900/50 border border-green-500"
                : "bg-red-900/50 border border-red-500"
            }`}
          >
            <div
              className={`text-3xl font-bold mb-2 ${
                lastScan.success ? "text-green-400" : "text-red-400"
              }`}
            >
              {lastScan.success ? "✓" : "✗"}
            </div>
            <div className="text-white text-lg font-semibold">
              {lastScan.employeeName}
            </div>
            <div className="text-gray-300">{lastScan.message}</div>
            <div className="text-gray-500 text-sm mt-2">
              {lastScan.timestamp.toLocaleTimeString()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
