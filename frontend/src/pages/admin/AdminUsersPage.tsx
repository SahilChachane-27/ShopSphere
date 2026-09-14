import React, { useEffect, useState } from 'react';
import { Users, UserCheck, ShieldAlert } from 'lucide-react';
import { SidebarLayout } from '../../components/SidebarLayout';
import { User } from '../../types';
import { apiClient } from '../../api/client';
import { Badge } from '../../components/Badge';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentActive: boolean) => {
    try {
      const res = await apiClient.put(`/admin/users/${userId}/status`, {
        is_active: !currentActive,
      });

      if (res.data.success) {
        fetchUsers();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle user status');
    }
  };

  return (
    <SidebarLayout type="admin" title="Platform User Management">
      <div className="space-y-6">
        <div className="p-6 rounded-3xl glass-panel border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Users className="text-emerald-400" size={20} /> All Registered Users
          </h3>

          {isLoading ? (
            <p className="text-xs text-slate-400">Loading user accounts...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="py-3 px-4 font-bold text-white">{u.full_name}</td>
                      <td className="py-3 px-4 text-slate-400">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={u.is_active ? 'ACTIVE' : 'SUSPENDED'} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right">
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold border ${
                              u.is_active
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                            }`}
                          >
                            {u.is_active ? 'Suspend User' : 'Activate User'}
                          </button>
                        )}
                      </td>
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
