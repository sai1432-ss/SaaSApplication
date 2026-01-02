import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api'; 
import { 
  Folder, Search, Filter, Plus, MoreVertical, 
  Edit, Trash2, Eye, X, Loader 
} from 'lucide-react';

const Projects = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // FILTERS & SEARCH
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [searchQuery, setSearchQuery] = useState('');

  // MODAL & DROPDOWN STATE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // FORM STATE
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
  const [error, setError] = useState('');

  // --- 1. FETCH DATA ---
  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    setLoading(true);
    try {
      let query = '/projects?limit=100'; 
      if (filterStatus !== 'All') query += `&status=${filterStatus}`;
      if (searchQuery) query += `&search=${searchQuery}`;
      const res = await api.get(query);
      const rawProjects = res.data.data.projects;

      const taskCountsRes = await api.get('/stats/project-tasks');
      const countsMap = taskCountsRes.data.data;

      const mappedProjects = rawProjects.map(p => {
        const countData = countsMap.find(c => c.id === p.id);
        const total = countData ? Number(countData.taskCount) : 0;

        return {
          ...p,
          id: p.id,
          name: p.name,
          status: p.status,
          totalTasks: total,
          createdAt: new Date(p.createdAt).toLocaleDateString(),
          organization: p.organization 
        };
      });

      setProjects(mappedProjects);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchProjects(), 300);
    return () => clearTimeout(timer);
  }, [filterStatus, searchQuery]);

  // --- 2. HANDLERS ---
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({ name: '', description: '', status: 'active' });
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (e, project) => {
    e.stopPropagation();
    setIsEditing(true);
    setCurrentId(project.id);
    setFormData({ name: project.name, description: project.description || '', status: project.status });
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this project?')) {
      try {
        await api.delete(`/projects/${id}`);
        setProjects(projects.filter(p => p.id !== id));
      } catch (err) {
        alert("Action restricted to Administrators.");
      }
    }
    setActiveDropdown(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError('Project Name is required');

    try {
      if (isEditing && currentId !== null) await api.put(`/projects/${currentId}`, formData);
      else await api.post('/projects', formData);
      setIsModalOpen(false);
      fetchProjects(); 
    } catch (err) {
      setError(err.response?.data?.error || "Creation failed.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 ring-emerald-600/20';
      case 'active': return 'bg-indigo-100 text-indigo-800 ring-indigo-600/20';
      default: return 'bg-slate-100 text-slate-800 ring-slate-600/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" onClick={() => setActiveDropdown(null)}> 
      <Navbar />
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Projects</h2>
            <p className="mt-1 text-sm text-slate-500 font-medium tracking-tight">System overview of active work</p>
          </div>
          <button onClick={handleOpenCreate} className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> New Project
          </button>
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-t-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center overflow-visible">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="block w-full rounded-lg border border-slate-200 py-2 pl-10 focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-900 transition-all" 
                  placeholder="Search projects..." 
                />
             </div>
             <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-slate-200 py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900 outline-none transition-all cursor-pointer">
                    <option value="All">All Status</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                </select>
             </div>
        </div>

        {/* Table Body */}
        <div className="bg-white shadow-sm border border-t-0 border-slate-200 rounded-b-xl overflow-visible">
          {loading ? (
             <div className="flex justify-center items-center h-64"><Loader className="animate-spin h-8 w-8 text-indigo-600" /></div>
          ) : (
            <div className="overflow-x-auto overflow-y-visible">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project Details</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tasks Count</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created Date</th>
                    <th className="relative px-6 py-4 w-16"></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                    {projects.map((project) => (
                    <tr key={project.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center" onClick={() => navigate(`/projects/${project.id}`)}>
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 font-bold"><Folder className="h-5 w-5" /></div>
                            <div className="ml-4 cursor-pointer">
                              <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{project.name}</div>
                              {project.organization && <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-tighter">{project.organization}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ring-1 ring-inset ${getStatusColor(project.status)}`}>{project.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                          <span className="text-sm font-bold text-slate-900">{project.totalTasks} <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter ml-1 italic">Total</span></span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-slate-500 uppercase tracking-tighter">{project.createdAt}</td>
                        <td className="px-6 py-4 text-right relative overflow-visible">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === project.id ? null : project.id); }} 
                            className="text-slate-400 hover:text-indigo-600 p-1 rounded-full hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {activeDropdown === project.id && (
                            <div className="absolute right-6 top-10 w-48 bg-white rounded-xl shadow-2xl z-[1000] border border-slate-100 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 ring-1 ring-black ring-opacity-5">
                                <button onClick={() => navigate(`/projects/${project.id}`)} className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors uppercase tracking-widest text-left">
                                    <Eye className="mr-3 h-4 w-4 opacity-70" /> View Details
                                </button>
                                <button onClick={(e) => handleOpenEdit(e, project)} className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors uppercase tracking-widest text-left">
                                    <Edit className="mr-3 h-4 w-4 opacity-70" /> Edit Project
                                </button>
                                <div className="border-t border-slate-100 my-1.5 mx-2"></div>
                                <button onClick={(e) => handleDelete(e, project.id)} className="flex w-full items-center px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors uppercase tracking-widest text-left">
                                    <Trash2 className="mr-3 h-4 w-4 opacity-70" /> Delete
                                </button>
                            </div>
                          )}
                        </td>
                    </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: PROFESSIONAL UI WITH BOLD BORDERS */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsModalOpen(false)}>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs">{isEditing ? 'Modify Project' : 'New Project'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="p-8 space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Project Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})} 
                        className="w-full rounded-lg border-2 border-slate-900 py-2.5 px-4 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300" 
                        placeholder="Enter project name..." 
                      />
                      {error && <p className="mt-2 text-[10px] text-red-500 font-bold uppercase tracking-tighter italic">{error}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Description</label>
                      <textarea 
                        rows={3} 
                        value={formData.description} 
                        onChange={(e) => setFormData({...formData, description: e.target.value})} 
                        className="w-full rounded-lg border-2 border-slate-900 py-2.5 px-4 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300 resize-none" 
                        placeholder="Brief project details..." 
                      />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Current Status</label>
                        <select 
                          value={formData.status} 
                          onChange={(e) => setFormData({...formData, status: e.target.value})} 
                          className="w-full rounded-lg border-2 border-slate-900 py-2.5 px-4 text-sm font-bold text-slate-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer appearance-none"
                        >
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                        </select>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-8 py-5 flex flex-row-reverse gap-3 border-t border-slate-100">
                    <button type="submit" className="bg-indigo-600 px-6 py-2.5 text-[10px] font-bold text-white uppercase tracking-widest rounded-lg hover:bg-indigo-700 shadow-md active:scale-95 transition-all">
                        {isEditing ? 'Save Changes' : 'Create Project'}
                    </button>
                    <button type="button" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-gray-900 px-2 transition-colors" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  </div>
                </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Projects;