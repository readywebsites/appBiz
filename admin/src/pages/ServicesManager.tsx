import React, { useEffect, useState } from 'react';
import { Boxes, Plus, Check, Clock, Tag } from 'lucide-react';
import { api } from '../lib/api';

export const ServicesManager: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, svcsRes, pkgsRes] = await Promise.all([
        api.listCategories(),
        api.listServices(),
        api.listPackages(),
      ]);
      setCategories(catsRes.results || catsRes);
      setServices(svcsRes.results || svcsRes);
      setPackages(pkgsRes.results || pkgsRes);
    } catch (err) {
      console.error('Failed to load services', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Service Packages & Offerings Catalog</h2>
        <p className="text-xs text-slate-500">Configure packages, pricing tiers, included deliverables, and turnaround times</p>
      </div>

      {/* Category Badges */}
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <div key={c.id} className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold text-slate-700">{c.name}</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-semibold">
              {c.services_count || 1}
            </span>
          </div>
        ))}
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-xs text-slate-400">Loading catalog...</div>
        ) : (
          packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                pkg.is_popular ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Tier Package
                  </span>
                  {pkg.is_popular && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                      Best Seller
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base">{pkg.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{pkg.tagline}</p>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    ₹{parseFloat(pkg.price).toLocaleString('en-IN')}
                  </span>
                  {pkg.original_price && (
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      ₹{parseFloat(pkg.original_price).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Turnaround: <b>~{pkg.delivery_days} Days Delivery</b>
                </p>

                {/* Features list */}
                <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">What's Included:</p>
                  {pkg.features?.map((f: any) => (
                    <div key={f.id} className="flex items-start gap-2 text-xs text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

