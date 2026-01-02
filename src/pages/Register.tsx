import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // <--- 1. IMPORT AXIOS
import { Eye, EyeOff, Building2, User, Mail, Globe, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState(""); // <--- 2. NEW STATE FOR API ERRORS
  const navigate = useNavigate();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const subdomainValue = watch("subdomain", "");

  const onSubmit = async (data: any) => {
    // Clear previous errors
    setServerError("");

    if (data.password !== data.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      // <--- 3. REAL BACKEND CONNECTION START --->
      const response = await axios.post('http://localhost:5000/api/auth/register-tenant', {
        // We map your Form Field names to the Backend API names
        tenantName: data.orgName,
        subdomain: data.subdomain,
        adminFullName: data.fullName,
        adminEmail: data.email,
        adminPassword: data.password
      });

      if (response.data.success) {
        // Success! Redirect to login
        alert("Registration Successful! Please Login.");
        navigate('/login');
      }
      // <--- REAL BACKEND CONNECTION END --->

    } catch (err: any) {
      console.error("Registration Failed:", err);
      // Show the error message from the backend (e.g., "Subdomain already taken")
      setServerError(err.response?.data?.error || "Registration failed. Is the backend running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 font-sans">
      {/* LEFT SIDE - VISUALS */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 to-indigo-900 justify-center items-center text-white p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative z-10 max-w-lg animate-fade-in-up">
          <div className="mb-8 inline-block p-3 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl">
             <Building2 className="w-8 h-8 text-indigo-300" />
          </div>
          <h2 className="text-5xl font-extrabold mb-6 tracking-tight leading-tight">
              Multi-Tenant SaaS Platform with Project &  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300">Task Management</span>
          </h2>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative">
        <div className="max-w-md w-full animate-slide-up-fade">
          
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Create Tenant Account</h1>
          </div>

          {/* --- ERROR MESSAGE DISPLAY --- */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded-r-lg">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {/* Organization Name */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Organization Name</label>
              <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                <Building2 className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  {...register("orgName", { required: true })}
                  className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  placeholder="Acme Corp"
                />
              </div>
              {errors.orgName && <span className="text-red-500 text-xs ml-1 mt-1 block">Organization name is required</span>}
            </div>

            {/* Subdomain */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Workspace URL</label>
              <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                <Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  {...register("subdomain", { required: true, pattern: /^[a-z0-9]+$/i })}
                  className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  placeholder="acme"
                />
              </div>
              <div className="mt-2 flex items-center text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="mr-1">Preview:</span>
                <span className="font-mono text-indigo-600 font-medium bg-indigo-50 px-1 rounded">
                  https://{subdomainValue || 'your-org'}.app.com
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    {...register("fullName", { required: true })}
                    className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Work Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    type="email"
                    {...register("email", { required: true })}
                    className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    placeholder="name@company.com"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Password</label>
              <div className="relative transition-all duration-300 focus-within:transform focus-within:scale-[1.01]">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  {...register("password", { required: true, minLength: 6 })}
                  className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors">
                  {showPassword ? <EyeOff className="h-5 w-5"/> : <Eye className="h-5 w-5"/>}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="group">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Confirm Password</label>
              <div className="relative">
                <input 
                  type="password"
                  {...register("confirmPassword", { required: true })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-center ml-1">
              <input 
                id="terms" 
                type="checkbox" 
                {...register("terms", { required: true })}
                className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" 
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-slate-600">
                I agree to the <a href="#" className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline">Terms of Service</a> & <a href="#" className="text-indigo-600 font-medium hover:text-indigo-800 hover:underline">Privacy Policy</a>
              </label>
            </div>

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
                  Setup Workspace...
                </div>
              ) : (
                <div className="flex items-center">
                  Create Tenant Account <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors">
              Sign in to dashboard
            </Link>
          </p>
        </div>
      </div>
      
      {/* Custom Keyframe Styles */}
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
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-slide-up-fade {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Register;