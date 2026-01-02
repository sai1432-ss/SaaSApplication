import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api'; // Connect to backend
import { 
  User, 
  Mail, 
  Shield, 
  Save, 
  Loader 
} from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();

  // State
  const [formData, setFormData] = useState({
    id: null,
    fullName: '',
    email: '',
    role: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
      // 1. CLIENT-SIDE AUTH CHECK: Stop if no token exists
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        const res = await api.get('/auth/me');
        const { id, fullName, email, role } = res.data.data;
        setFormData({ id, fullName, email, role });
      } catch (err) {
        console.error("Failed to load profile", err);
        // 2. SERVER-SIDE AUTH CHECK: If backend returns 401, clear local session
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // --- HANDLE SAVE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update User (Assuming API allows updating own name)
      await api.put(`/users/${formData.id}`, {
        fullName: formData.fullName,
        role: formData.role, 
        isActive: true 
      });
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-gray-500 font-medium">Manage your personal details and account settings.</p>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-tight">Personal Information</h2>
            
            <form onSubmit={handleSave} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name (Editable) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Full Name</label>
                        <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input 
                            type="text" 
                            value={formData.fullName}
                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
                        />
                        </div>
                    </div>

                    {/* Role (Read-Only) */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Account Role</label>
                        <div className="relative">
                        <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input 
                            type="text" 
                            value={formData.role.replace('_', ' ')} // Format "tenant_admin" -> "tenant admin"
                            disabled
                            className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed capitalize font-bold" 
                        />
                        </div>
                    </div>
                </div>

                {/* Email (Read-Only) */}
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1 tracking-wider">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input 
                        type="email" 
                        value={formData.email}
                        disabled
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed font-medium" 
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 font-bold italic">Note: Email addresses are locked for security and cannot be changed.</p>
                </div>

                {/* Save Button */}
                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="flex items-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold uppercase text-xs tracking-widest disabled:opacity-70 transition-all shadow-sm active:scale-95"
                    >
                        {saving ? (
                          <Loader className="animate-spin h-4 w-4 mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {saving ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                </div>
            </form>
        </div>

      </main>
    </div>
  );
};

export default Profile;