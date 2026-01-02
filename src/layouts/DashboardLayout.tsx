import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown 
} from 'lucide-react';

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation Items
  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Projects', path: '/projects' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Users', path: '/users' },
    { name: 'Tenants', path: '/tenants' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
      
      {/* ================= NAVBAR ================= */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                SaaS Platform
              </span>
            </div>

            {/* Desktop Nav Links (Center) */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <Link 
                    key={item.name}
                    to={item.path} 
                    className={`text-sm font-medium h-16 flex items-center px-1 transition-all border-b-2 ${
                      isActive 
                        ? 'text-indigo-600 border-indigo-600' 
                        : 'text-gray-500 hover:text-gray-900 hover:border-gray-300 border-transparent'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right: User Dropdown */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-3 pl-3 py-1.5 pr-2 rounded-full hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                >
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-bold text-gray-900 leading-none">John Doe</p>
                    <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mt-0.5">Super Admin</p>
                  </div>
                  <div className="h-9 w-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    JD
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 animate-in fade-in zoom-in duration-200 origin-top-right">
                    <Link to="#" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <UserIcon className="w-4 h-4 mr-2 text-gray-400"/> Profile
                    </Link>
                    <Link to="#" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Settings className="w-4 h-4 mr-2 text-gray-400"/> Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1"></div>
                    <Link to="/login" className="flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                      <LogOut className="w-4 h-4 mr-2"/> Logout
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="pt-2 pb-3 space-y-1 px-4">
              {navItems.map((item) => (
                <Link key={item.name} to={item.path} className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-4 border-t border-gray-200 px-4">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">JD</div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">John Doe</div>
                  <div className="text-sm font-medium text-gray-500">Super Admin</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
