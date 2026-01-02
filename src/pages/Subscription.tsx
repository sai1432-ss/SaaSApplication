import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api'; 
import { Check, AlertTriangle, Shield, Zap, Loader } from 'lucide-react';

const Subscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Real Data State
  const [usage, setUsage] = useState({
    plan: 'Free',
    usersCount: 0,
    maxUsers: 5,
    projectsCount: 0,
    maxProjects: 3
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
        // 2. Check Role & Profile
        const userRes = await api.get('/auth/me');
        const user = userRes.data.data;
        
        // Strictly restrict billing to Tenant Admins
        if (user.role !== 'tenant_admin' && user.role !== 'super_admin') {
            alert("Access Denied: Only Admins can view billing.");
            navigate('/dashboard'); 
            return;
        }
        setIsAdmin(true);

        // 3. Fetch Subscription Data
        const subRes = await api.get('/subscription');
        setUsage(subRes.data.data);

      } catch (err) {
        console.error("Subscription Load Error:", err);
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

  // --- HANDLE UPGRADE ---
  const handleUpgrade = async (newPlan) => {
    if(!window.confirm(`Are you sure you want to switch to the ${newPlan} plan?`)) return;
    
    setProcessing(true);
    try {
        await api.put('/subscription', { newPlan });
        
        // Refresh data to ensure limits are synced from DB
        const subRes = await api.get('/subscription');
        setUsage(subRes.data.data);
        
        alert(`Successfully switched to ${newPlan}!`);
    } catch (err) {
        console.error(err);
        alert("Failed to update plan.");
        // Refetch to ensure UI matches server state
        const subRes = await api.get('/subscription');
        setUsage(subRes.data.data);
    } finally {
        setProcessing(false);
    }
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for small teams getting started.',
      features: ['Max 5 Users', 'Max 3 Projects', 'Community Support'],
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      description: 'For growing teams that need more resources.',
      features: ['Max 25 Users', 'Max 15 Projects', 'Priority Email Support', 'Advanced Analytics'],
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Unlimited scale for large organizations.',
      features: ['Max 100 Users', 'Max 50 Projects', '24/7 Dedicated Support', 'Audit Logs & SSO'],
    }
  ];

  const getProgressColor = (current, max) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="animate-spin h-8 w-8 text-indigo-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
        
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Subscription & Usage</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium uppercase tracking-widest">Secure Billing Management</p>
        </div>

        {/* --- USAGE STATS SECTION --- */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-12">
          <div className="flex items-center justify-between mb-8 border-b pb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Current Plan: <span className="text-indigo-600 uppercase">{usage.plan}</span></h2>
              <p className="text-xs text-gray-400 font-bold uppercase mt-1">Status: Active</p>
            </div>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              Manage Payment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Users Limit */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-2 text-indigo-400"/> User Seats
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {usage.usersCount} / {usage.maxUsers} <span className="text-[10px] text-gray-400 uppercase">Used</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(usage.usersCount, usage.maxUsers)}`} 
                  style={{ width: `${Math.min((usage.usersCount / usage.maxUsers) * 100, 100)}%` }}
                ></div>
              </div>
              {usage.usersCount >= usage.maxUsers && (
                <p className="text-[10px] text-red-600 mt-2 font-bold uppercase flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1"/> Seat limit reached. Upgrade required to add more members.
                </p>
              )}
            </div>

            {/* Projects Limit */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                  <Zap className="w-3.5 h-3.5 mr-2 text-amber-400"/> Active Projects
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {usage.projectsCount} / {usage.maxProjects} <span className="text-[10px] text-gray-400 uppercase">Used</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-1000 ${getProgressColor(usage.projectsCount, usage.maxProjects)}`} 
                  style={{ width: `${Math.min((usage.projectsCount / usage.maxProjects) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* --- PLANS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = usage.plan.toLowerCase() === plan.name.toLowerCase();
            return (
                <div key={plan.name} className={`bg-white rounded-2xl p-8 border shadow-sm relative flex flex-col transition-all duration-300 ${isCurrent ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-10 scale-105 z-10' : 'border-gray-200 hover:border-gray-300'}`}>
                {isCurrent && (
                    <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl uppercase tracking-widest">
                      Active Plan
                    </span>
                )}
                
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">{plan.name}</h3>
                <div className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-4xl font-extrabold tracking-tight">{plan.price}</span>
                    {plan.period && <span className="ml-1 text-sm font-bold text-gray-400 uppercase">{plan.period}</span>}
                </div>
                <p className="mt-4 text-sm text-gray-500 font-medium h-10">{plan.description}</p>

                <ul className="mt-8 space-y-4 flex-1">
                    {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                        <Check className="flex-shrink-0 w-4 h-4 text-green-500" />
                        <span className="ml-3 text-xs font-bold text-gray-600 uppercase tracking-tight">{feature}</span>
                    </li>
                    ))}
                </ul>

                <button 
                    disabled={isCurrent || processing}
                    onClick={() => handleUpgrade(plan.name)}
                    className={`mt-8 w-full block py-3 px-6 rounded-xl text-center text-xs font-bold uppercase tracking-widest transition-all ${
                    isCurrent 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100 active:scale-95'
                    }`}
                >
                    {processing && !isCurrent ? 'Processing...' : (isCurrent ? 'Current Plan' : `Select ${plan.name}`)}
                </button>
                </div>
            );
          })}
        </div>

      </main>
    </div>
  );
};

export default Subscription;