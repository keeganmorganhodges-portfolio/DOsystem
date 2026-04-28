import React, { useEffect, useState } from "react";
import { Shield, Trash2, UserX, UserCheck } from "lucide-react";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    // Fetch initial audit logs and user list from API
    fetch("/api/admin/audit").then(res => res.json()).then(setReports);
    fetch("/api/admin/users").then(res => res.json()).then(setUsers);
  }, []);

  const handleBan = async (userId: string) => {
    const reason = prompt("Reason for ban?");
    if (!reason) return;
    await fetch(`/api/admin/ban/${userId}`, { 
      method: "POST", 
      body: JSON.stringify({ reason }) 
    });
    // Refresh list
  };

  return (
    <div className="flex-1 bg-[#313338] p-8 text-white overflow-y-auto">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={32} className="text-red-500" />
        <h1 className="text-2xl font-bold">Admin Control Center</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Management */}
        <section className="bg-[#2b2d31] rounded-lg p-6 border border-[#1f2124]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
             <UserCheck size={20} /> User Directory
          </h2>
          <div className="space-y-4">
            {users.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-[#383a40] rounded">
                <div>
                  <div className="font-bold">{u.username}</div>
                  <div className="text-xs text-gray-400">{u.email} • {u.role}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleBan(u.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded">
                    <UserX size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Audit Log */}
        <section className="bg-[#2b2d31] rounded-lg p-6 border border-[#1f2124]">
          <h2 className="text-lg font-semibold mb-4">Moderation Audit Log</h2>
          <div className="text-sm space-y-2">
            {reports.map((log: any) => (
              <div key={log.id} className="p-2 border-b border-gray-700">
                <span className="text-indigo-400 font-mono">[{log.action}]</span> 
                <span className="mx-2">{log.reason}</span>
                <div className="text-[10px] text-gray-500">{new Date(log.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
