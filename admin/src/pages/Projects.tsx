import React, { useEffect, useState } from 'react';
import { FolderKanban, CheckCircle2, Clock, Globe, ExternalLink, ArrowRight, Save, X } from 'lucide-react';
import { api } from '../lib/api';
import { Project } from '../types';

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingUrls, setEditingUrls] = useState(false);
  const [stagingUrl, setStagingUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [progress, setProgress] = useState(0);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.listProjects();
      setProjects(res.results || res);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const openProjectDetails = async (id: string) => {
    try {
      const proj = await api.getProject(id);
      setSelectedProject(proj);
      setStagingUrl(proj.staging_url || '');
      setLiveUrl(proj.live_url || '');
      setProgress(proj.progress_percentage || 0);
    } catch (err) {
      console.error('Failed to load project details', err);
    }
  };

  const handleSaveProjectUpdates = async () => {
    if (!selectedProject) return;
    try {
      const updated = await api.updateProject(selectedProject.id, {
        staging_url: stagingUrl,
        live_url: liveUrl,
        progress_percentage: progress,
      });
      setSelectedProject(updated);
      alert('Project progress and URLs updated!');
      fetchProjects();
    } catch (err: any) {
      alert(`Error updating project: ${err.message}`);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Project Delivery & Client Portals</h2>
          <p className="text-xs text-slate-500">Track development milestones, staging previews, revisions and client approvals</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">Loading delivery projects...</div>
        ) : projects.length === 0 ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">No active projects currently.</div>
        ) : (
          projects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {p.order_number}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      p.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700'
                        : p.status === 'REVISIONS'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {p.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm">{p.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Client: <b>{p.customer_name}</b></p>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Progress</span>
                    <span>{p.progress_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                      style={{ width: `${p.progress_percentage}%` }}
                    ></div>
                  </div>
                </div>

                {p.target_delivery_date && (
                  <p className="text-[10px] text-slate-400 mt-3 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Target: {p.target_delivery_date}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                {p.live_url ? (
                  <a
                    href={p.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-3.5 h-3.5" /> Live Site
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-400">In Development</span>
                )}
                <button
                  onClick={() => openProjectDetails(p.id)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1"
                >
                  Manage <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Project Management Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{selectedProject.title}</h3>
                <p className="text-xs text-slate-400">Order Ref: {selectedProject.order_number}</p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Progress Slider */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-slate-700">Project Completion:</span>
                  <span className="font-mono text-sm font-bold text-blue-600">{progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={(e) => setProgress(parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Delivery URLs */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800">Deployment & Preview URLs</h4>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Staging / Development URL</label>
                  <input
                    type="url"
                    placeholder="https://staging.biz499.com/client-preview"
                    value={stagingUrl}
                    onChange={(e) => setStagingUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Production Live Domain</label>
                  <input
                    type="url"
                    placeholder="https://www.apexretail.in"
                    value={liveUrl}
                    onChange={(e) => setLiveUrl(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              {/* Milestones list */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2">Milestone Timeline</h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {selectedProject.milestones?.map((m) => (
                    <div key={m.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 ${
                            m.status === 'COMPLETED' ? 'text-emerald-500' : 'text-slate-300'
                          }`}
                        />
                        <div>
                          <p className="font-semibold text-slate-800">{m.title}</p>
                          <p className="text-[10px] text-slate-400">{m.description}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSaveProjectUpdates}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

