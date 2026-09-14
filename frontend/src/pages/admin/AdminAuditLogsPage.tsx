import React, { useEffect, useState } from 'react';
import { FileText, Shield, Clock } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { apiClient } from '../../api/client';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/audit-logs');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout type="admin" title="Platform Security Audit Logs">
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="text-indigo-400" size={20} /> System Event & Administrative Audit Logs
          </h3>

          {isLoading ? (
            <p className="text-xs text-slate-400">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4">No audit log entries recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Entity ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-amber-300">{log.action}</td>
                      <td className="py-3 px-4 text-indigo-300">{log.entity}</td>
                      <td className="py-3 px-4 text-slate-400">{log.user_id || 'System'}</td>
                      <td className="py-3 px-4 text-slate-400">{log.entity_id || 'N/A'}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
};
