import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Menu, 
  X, 
  ChevronDown, 
  User, 
  Settings, 
  LogOut,
  CreditCard,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Building
} from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    try {
        if (token) {
            await axios.post('http://localhost:5000/api/auth/logout', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    } catch (error) {
        console.error("Logout error", error);
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    }
  };

  const getInitials = (name) => {
    return name
      ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';
  };

  // Define Links
  const allLinks = [
    { 
      name: 'Dashboard', 
      path: '/dashboard', 
      icon: <LayoutDashboard className="w-4 h-4 mr-2"/>,
      roles: ['all'] 
    },
    { 
      name: 'Projects', 
      path: '/projects', 
      icon: <FolderKanban className="w-4 h-4 mr-2"/>,
      roles: ['all'] 
    },
    { 
      name: 'Tasks', 
      path: '/tasks', 
      icon: <CheckSquare className="w-4 h-4 mr-2"/>,
      roles: ['tenant_admin', 'super_admin'] 
    },
    { 
      name: 'Users', 
      path: '/users', 
      icon: <Users className="w-4 h-4 mr-2"/>,
      roles: ['tenant_admin'] 
    },
    { 
      name: 'Tenants', 
      path: '/tenants', 
      icon: <Building className="w-4 h-4 mr-2"/>,
      roles: ['super_admin'] 
    },
  ];

  const visibleLinks = allLinks.filter(link => {
    if (!user) return false;
    if (link.roles.includes('all')) return true;
    return link.roles.includes(user.role);
  });

  if (!user) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* LEFT: Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              S
            </div>
            <span className="hidden lg:block text-xl font-bold text-slate-900 tracking-tight">
              Multi-Tenant SaaS Platform with Project & Task Management
            </span>
          </div>

          {/* CENTER: Navigation */}
          <div className="hidden md:flex items-center space-x-1 ml-8">
            {visibleLinks.map((link) => {
              const isActive = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`text-sm font-medium px-4 py-2 rounded-lg transition-all flex items-center ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: User Profile */}
          <div className="hidden md:flex items-center ml-auto">
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 focus:outline-none hover:bg-slate-50 p-2 rounded-xl transition-colors"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-bold text-slate-900 leading-none">{user.fullName || "User"}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">
                    {user.role?.replace('_', ' ')}
                  </p>
                </div>
                <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm">
                  {getInitials(user.fullName)}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl py-2 origin-top-right ring-1 ring-black ring-opacity-5">
                  <Link to="/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4 mr-2 text-gray-400"/> Profile
                  </Link>
                  
                  {/* REQUIREMENT: Subscription visible only to tenant_admin */}
                  {user.role === 'tenant_admin' && (
                    <Link to="/subscription" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                        <CreditCard className="w-4 h-4 mr-2 text-gray-400"/> Subscription
                    </Link>
                  )}

                  <Link to="/settings" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4 mr-2 text-gray-400"/> Settings
                  </Link>

                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button onClick={handleLogout} className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4 mr-2"/> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Button */}
          <div className="flex items-center md:hidden ml-auto">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md text-gray-400 hover:bg-gray-100">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="pt-2 pb-3 space-y-1 px-4">
            {visibleLinks.map((link) => (
              <Link key={link.name} to={link.path} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50">
                {link.icon} {link.name}
              </Link>
            ))}
            
            {/* Mobile Requirement Check */}
            {user.role === 'tenant_admin' && (
                <Link to="/subscription" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-indigo-50">
                    <CreditCard className="w-4 h-4 mr-2"/> Subscription
                </Link>
            )}

            <button onClick={handleLogout} className="w-full flex items-center px-3 py-3 text-red-600">
              <LogOut className="w-4 h-4 mr-2"/> Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;