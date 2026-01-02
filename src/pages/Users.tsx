import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';
import { 
  Search, Filter, Plus, Edit, Trash2, X, User as UserIcon, Mail, Shield, 
  CheckCircle, XCircle, Lock, Loader, ShieldAlert 
} from 'lucide-react';

const Users = () => {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '', email: '', role: 'user', password: '', isActive: true
  });
  const [error, setError] = useState('');

  // --- 1. FETCH DATA ---
  const fetchUsers = async (tenantId) => {
    try {
      const res = await api.get(`/tenants/${tenantId}/users?limit=100`);
      setUsers(res.data.data.users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      try {
        setLoading(true);
        const userRes = await api.get('/auth/me');
        const user = userRes.data.data;
        setCurrentUser(user);

        if (user.role !== 'tenant_admin' && user.role !== 'super_admin') {
            setLoading(false);
            return;
        }

        const tenantId = user.tenantId || user.tenant_id || (user.tenant && user.tenant.id);
        if (tenantId) { await fetchUsers(tenantId); }
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else { setLoading(false); }
      }
    };
    init();
  }, [navigate]);

  // --- 2. ACCESS CONTROL RENDER ---
  if (!loading && currentUser && currentUser.role !== 'tenant_admin' && currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 uppercase">Access Denied</h2>
          <p className="mt-2 text-gray-600">Only organization admins can manage the team members list.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-sm">
            Go back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- 3. HANDLERS ---
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    try {
        const tenantId = currentUser.tenantId || currentUser.tenant_id || (currentUser.tenant && currentUser.tenant.id);
        if (isEditing) {
            await api.put(`/users/${currentUserId}`, { fullName: formData.fullName, role: formData.role, isActive: formData.isActive });
        } else {
            await api.post(`/tenants/${tenantId}/users`, formData);
        }
        await fetchUsers(tenantId);
        setIsModalOpen(false);
    } catch (err) {
        setError(err.response?.data?.error || "Operation failed.");
    }
  };

  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??';
  const formatRole = (role) => role === 'tenant_admin' ? 'Organization Admin' : 'User';
  const getRoleBadgeColor = (role) => role === 'tenant_admin' ? 'bg-purple-100 text-purple-800 ring-purple-600/20' : 'bg-blue-100 text-blue-800 ring-blue-600/20';

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader className="animate-spin h-10 w-10 text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
        
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h2>
            <p className="mt-1 text-sm text-gray-500 font-medium">Provision and manage organization team members.</p>
          </div>
          <button onClick={() => { setIsEditing(false); setFormData({fullName:'', email:'', role:'user', password:'', isActive:true}); setError(''); setIsModalOpen(true); }} className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Add Team Member
          </button>
        </div>

        <div className="bg-white p-4 rounded-t-xl border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input type="text" className="block w-full rounded-lg border-gray-300 py-2 pl-10 text-sm focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg border-gray-300 py-2 text-sm focus:ring-2 focus:ring-indigo-600 bg-white">
              <option value="All">All Roles</option><option value="tenant_admin">Admins</option><option value="user">Users</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-b-xl overflow-hidden border border-t-0 border-gray-200 min-h-[400px]">
          <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50/50">
                    <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Team Member</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Access Level</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Joined</th>
                    <th className="relative px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                    {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0"><div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100 text-xs uppercase tracking-tighter">{getInitials(user.fullName)}</div></div>
                            <div className="ml-4"><div className="text-sm font-bold text-gray-900">{user.fullName}</div><div className="text-xs text-gray-500 font-medium tracking-tight">{user.email}</div></div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${getRoleBadgeColor(user.role)}`}>{formatRole(user.role)}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        {user.isActive !== false ? (
                            <span className="inline-flex items-center text-green-700 text-[10px] font-bold uppercase bg-green-50 px-2 py-1 rounded-full ring-1 ring-green-600/20"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>
                        ) : (
                            <span className="inline-flex items-center text-gray-500 text-[10px] font-bold uppercase bg-gray-50 px-2 py-1 rounded-full ring-1 ring-gray-300/50"><XCircle className="w-3 h-3 mr-1" /> Suspended</span>
                        )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setIsEditing(true); setCurrentUserId(user.id); setFormData({fullName: user.fullName, email: user.email, role: user.role, password: '', isActive: user.isActive}); setIsModalOpen(true); }} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-colors"><Edit className="w-4 h-4" /></button>
                            {currentUser?.id !== user.id && (<button onClick={async () => { if(window.confirm('Delete user?')) { await api.delete(`/users/${user.id}`); setUsers(users.filter(u => u.id !== user.id)); } }} className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"><Trash2 className="w-4 h-4" /></button>)}
                          </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
          </div>
        </div>

        {/* MODAL: REGISTER / MODIFY MEMBER */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 uppercase text-xs tracking-widest">{isEditing ? 'Modify Member' : 'Register New Member'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="h-5 w-5 text-gray-400 hover:text-gray-600" /></button>
              </div>
              <form onSubmit={handleSave} className="p-8 space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} className="w-full rounded-lg border-2 border-slate-900 pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none transition-all" placeholder="John Doe" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} disabled={isEditing} className={`w-full rounded-lg border-2 border-slate-900 pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 ${isEditing ? 'bg-gray-100 opacity-70' : 'focus:ring-2 focus:ring-indigo-600 outline-none'}`} placeholder="john@organization.com" />
                  </div>
                </div>
                {!isEditing && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Initial Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input type="password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full rounded-lg border-2 border-slate-900 pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none" placeholder="••••••••" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-widest">Permission Role</label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full rounded-lg border-2 border-slate-900 pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 bg-white outline-none appearance-none cursor-pointer">
                      <option value="user">User</option>
                      <option value="tenant_admin">Organization Admin</option>
                    </select>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center pt-2">
                    <input id="status-active" type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="h-4 w-4 text-indigo-600 border-2 border-slate-900 rounded focus:ring-indigo-500" />
                    <label htmlFor="status-active" className="ml-2 block text-xs font-bold text-slate-600 uppercase tracking-tighter">Account Enabled</label>
                  </div>
                )}
                {error && <p className="text-red-500 text-[10px] font-bold uppercase text-center bg-red-50 p-2 rounded border border-red-100">{error}</p>}
                <div className="pt-2">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
                    {isEditing ? 'Commit Changes' : 'Provision Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Users;