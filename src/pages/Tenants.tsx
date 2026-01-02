import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import api from '../api'; 
import { Building2, Globe, Users, Folder, Loader } from 'lucide-react';

const Tenants = () => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/tenantdet');
        setTenants(res.data.data.tenants || []);
      } catch (err) {
        console.error("Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTenants();
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><Loader className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Organizations</h2>
          <p className="text-sm text-slate-500 font-medium">Monitoring client growth and resource usage</p>
        </div>

        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Usage Ratio</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Subscription Plan</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-50">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 font-bold"><Building2 size={20} /></div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-slate-900">{tenant.name}</div>
                        <div className="text-[10px] text-indigo-500 font-bold flex items-center uppercase tracking-tighter"><Globe size={12} className="mr-1"/> {tenant.subdomain}.APP.COM</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-8">
                      <div className="flex items-center font-bold text-slate-700 text-sm"><Users size={16} className="mr-2 opacity-30" /> {tenant.current_users_count} <span className="text-slate-300 ml-1">/ {tenant.max_users}</span></div>
                      <div className="flex items-center font-bold text-slate-700 text-sm"><Folder size={16} className="mr-2 opacity-30" /> {tenant.current_projects_count} <span className="text-slate-300 ml-1">/ {tenant.max_projects}</span></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-purple-50 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase ring-1 ring-inset ring-purple-600/20">
                      {tenant.subscription_plan || 'FREE TIER'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
};

export default Tenants;