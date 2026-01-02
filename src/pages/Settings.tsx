import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api'; 
import { 
  Building2, 
  AlertTriangle,
  CreditCard,
  Loader,
  Mail,
  Globe
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    tenantName: '',
    subdomain: '',
    adminEmail: '',
    plan: ''
  });

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      // 1. CLIENT-SIDE AUTH CHECK: Stop if no token exists
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        // 2. Get User & Tenant Info
        const res = await api.get('/auth/me');
        const user = res.data.data;
        
        // 3. Get detailed Tenant Info from subscription endpoint
        const subRes = await api.get('/subscription');
        const subData = subRes.data.data;

        setFormData({
            tenantName: user.tenant?.name || 'My Organization',
            subdomain: user.tenant?.subdomain || '',
            adminEmail: user.email, 
            plan: subData.plan || 'Free'
        });

        setIsAdmin(user.role === 'tenant_admin');

      } catch (err) {
        console.error("Failed to load settings:", err);
        // 4. SERVER-SIDE AUTH CHECK: If backend returns 401, clean up and redirect
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // --- HANDLERS ---

  const handleDelete = async () => {
    if(!isAdmin) return alert("Only admins can delete the organization.");
    
    const confirmName = window.prompt(
        `DANGER: This action is IRREVERSIBLE.\nAll projects, tasks, and users will be permanently deleted.\n\nType "${formData.tenantName}" to confirm deletion:`
    );
    
    if (confirmName === formData.tenantName) {
        try {
            await api.delete('/tenants/settings');
            alert("Organization successfully deleted. Redirecting...");
            
            localStorage.removeItem('token');
            navigate('/register');
        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Failed to delete organization.";
            alert(errMsg);
        }
    } else if (confirmName !== null) {
        alert("Confirmation name did not match. Deletion cancelled.");
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organization Settings</h1>
          <p className="mt-1 text-gray-500">View workspace configuration and manage organization status.</p>
        </div>

        <div className="space-y-8">

          {/* 1. General Information (Read-Only) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Building2 className="w-5 h-5 mr-2 text-indigo-600"/> General Information
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Organization Name</label>
                  <p className="text-sm font-bold text-gray-900">{formData.tenantName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Admin Email</label>
                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {formData.adminEmail}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-50">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Workspace URL</label>
                <div className="mt-1 flex items-center text-sm font-bold text-indigo-600">
                  <Globe className="w-4 h-4 mr-2" />
                  https://{formData.subdomain}.yourplatform.com
                </div>
              </div>
            </div>
          </div>

          {/* 2. Plan & Billing Summary (Read-Only) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-indigo-600"/> Plan & Billing
              </h3>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-purple-200 uppercase tracking-wider">
                {formData.plan} Plan
              </span>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-600">You are currently on the <span className="font-bold text-gray-900 capitalize">{formData.plan}</span> plan.</p>
                  <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-tighter">Next billing date: November 1, 2025</p>
                </div>
                {isAdmin && (
                    <button 
                        onClick={() => navigate('/subscription')}
                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase tracking-widest transition-colors"
                    >
                    View Subscription Details &rarr;
                    </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Danger Zone */}
          {isAdmin && (
              <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-red-100 bg-red-50/50">
                  <h3 className="text-lg font-semibold text-red-700 flex items-center uppercase tracking-tighter">
                    <AlertTriangle className="w-5 h-5 mr-2"/> Danger Zone
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Deleting your organization is irreversible. All projects, tasks, and user data associated with <strong>{formData.tenantName}</strong> will be permanently removed.
                  </p>
                  <button 
                    onClick={handleDelete}
                    className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-bold uppercase tracking-wider transition-colors"
                  >
                    Delete Organization
                  </button>
                </div>
              </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default Settings;