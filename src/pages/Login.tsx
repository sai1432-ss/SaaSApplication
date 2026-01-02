import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { Mail, Lock, Building2, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(""); 
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setServerError(""); 

    try {
      // 1. Send Login Request
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: data.email,
        password: data.password,
        tenantsSubdomain: data.tenantId 
      });

      console.log("SERVER RESPONSE:", response.data); // Debugging Log

      if (response.data.success) {
        // 2. ROBUST EXTRACTION: Check both top-level and nested locations
        // This handles differences in how the backend might structure the response
        const token = response.data.token || response.data.data?.token;
        const user = response.data.user || response.data.data?.user;

        if (token) {
            // 3. Store in Local Storage
            localStorage.setItem('token', token);
            
            // Safety check: ensure 'user' exists before saving
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
            }

            console.log("✅ SUCCESS: Token and User saved to localStorage");
            
            // 4. Redirect
            alert("Login Successful! Welcome back.");
            navigate('/dashboard'); 
        } else {
            console.error("❌ ERROR: Login reported success, but NO TOKEN found.");
            setServerError("Login failed: Server did not send a security token.");
        }
      }

    } catch (err: any) {
      console.error("Login Failed:", err);
      setServerError(err.response?.data?.error || "Login failed. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-900 font-sans relative overflow-hidden">
      
      {/* ANIMATED BACKGROUND BLOBS */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-[20%] right-[20%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] right-[40%] w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="w-full max-w-md p-4 relative z-10">
        
        {/* LOGIN CARD */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden animate-slide-up-fade">
          
          {/* Header Section */}
          <div className="px-8 pt-8 pb-6 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your workspace details to continue
            </p>
          </div>

          <div className="px-8 pb-8">
            
            {/* --- ERROR MESSAGE DISPLAY --- */}
            {serverError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded-r-lg text-sm">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span>{serverError}</span>
              </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              
              {/* Tenant Subdomain Input */}
              <div className="group">
                <label htmlFor="tenantId" className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Tenant Subdomain
                </label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    {...register("tenantId", { required: true })}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                    placeholder="acme"
                  />
                </div>
                {errors.tenantId && <span className="text-red-500 text-xs ml-1 mt-1 block">Tenant ID is required</span>}
              </div>

              {/* Email Input */}
              <div className="group">
                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">
                  Email address
                </label>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    {...register("email", { required: true })}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    {...register("password", { required: true })}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      Sign In <ArrowRight className="ml-2 w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
               <p className="text-center text-sm text-slate-600">
                Need to create a new workspace?{' '}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors flex items-center justify-center mt-2 group">
                  Register a new tenant
                  <ArrowRight className="ml-1 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer Credit */}
        <p className="text-center text-slate-400 text-xs mt-8 opacity-60">
          © 2025 SaaS Platform. Secure & Encrypted.
        </p>
      </div>

      {/* REUSED ANIMATION STYLES */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up-fade {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Login;