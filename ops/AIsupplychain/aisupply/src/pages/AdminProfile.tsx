import { CheckCircle, Info, Plus, MoreVertical, Clock, MapPin, Shield, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { AdminHubMap } from '../components/AdminHubMap';
import { useState, useEffect } from 'react';
import { getAllVirtualHubs } from '../services/apiClient';

export function AdminProfile() {
  const { showToast } = useToast();
  const [addHubMode, setAddHubMode] = useState(false);
  const [hubs, setHubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHubs();
  }, []);

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const data = await getAllVirtualHubs();
      setHubs(data);
    } catch (error) {
      console.error('Failed to fetch hubs:', error);
      showToast('Error', 'Failed to load virtual hubs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHubAdded = (hub: any) => {
    showToast(
      `${hub.name} Added Successfully!`,
      `Location: ${hub.address || 'Coordinates: ' + hub.latitude.toFixed(4) + ', ' + hub.longitude.toFixed(4)}`,
      'success'
    );
    setAddHubMode(false);
    fetchHubs(); // Refresh hub list
  };

  const handleHubRemoved = (hubId: string) => {
    showToast('Hub Removed', 'Virtual hub has been removed from the network.', 'info');
    fetchHubs(); // Refresh hub list
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm text-eco-text-secondary mb-2">
           Dashboard <span className="mx-2">&gt;</span> <span className="text-white font-semibold">Admin Profile</span>
      </div>

      {/* Profile Header */}
      <div className="bg-eco-card rounded-xl p-8 border border-eco-card-border flex flex-col md:flex-row items-center md:items-start gap-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-eco-brand-orange/5 rounded-full blur-3xl transform translate-x-16 -translate-y-16 pointer-events-none"></div>
          
          <div className="w-24 h-24 rounded-full bg-eco-brand-orange text-white text-3xl font-bold flex items-center justify-center shadow-neon-orange z-10 border-4 border-[#151B28]">
              A
          </div>
          
          <div className="flex-1 text-center md:text-left z-10">
              <h1 className="text-2xl font-bold text-white mb-1">Admin User</h1>
              <div className="text-eco-text-secondary mb-2">admin@ecologiq.com</div>
              <div className="text-sm text-white/80 font-medium bg-white/5 inline-block px-3 py-1 rounded-lg border border-white/10">System Administrator</div>
          </div>

          <div className="flex gap-3 z-10">
              <span className="px-4 py-2 bg-eco-success/10 text-eco-success rounded-full text-sm font-semibold border border-eco-success/20 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" /> Active
              </span>
              <span className="px-4 py-2 bg-eco-brand-orange/10 text-eco-brand-orange rounded-full text-sm font-semibold border border-eco-brand-orange/20 flex items-center">
                  <Shield className="w-4 h-4 mr-2" /> Full Access
              </span>
          </div>
      </div>

      {/* Virtual Hub Network Map */}
      <div className="bg-eco-card rounded-xl border border-eco-card-border overflow-hidden">
        <div className="p-6 border-b border-eco-card-border flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-eco-brand-orange/10 rounded-lg text-eco-brand-orange">
                    <MapPin className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Virtual Hub Network Map</h2>
                    <p className="text-eco-text-secondary text-sm">
                      {addHubMode ? 'Click on map to place new hub' : 'Manage virtual hub locations and status'}
                    </p>
                </div>
            </div>
            <button 
                onClick={() => {
                  setAddHubMode(!addHubMode);
                  if (!addHubMode) {
                    showToast('Add Hub Mode Activated', 'Click anywhere on the map to place a new virtual hub.', 'info');
                  } else {
                    showToast('Add Hub Mode Deactivated', 'Click the button again to add more hubs.', 'info');
                  }
                }}
                className={`${
                  addHubMode 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-eco-brand-orange hover:bg-eco-brand-orange-hover'
                } text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-neon-orange transition-all flex items-center active:scale-[0.98]`}
            >
                <Plus className={`w-4 h-4 mr-2 ${addHubMode ? 'rotate-45' : ''} transition-transform`} />
                {addHubMode ? 'Cancel' : 'Add Hub'}
            </button>
        </div>
        
        <div className="relative h-[400px] w-full">
            <AdminHubMap 
              addMode={addHubMode}
              onHubAdded={handleHubAdded}
              onHubRemoved={handleHubRemoved}
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Permissions & Access */}
          <div className="bg-eco-card rounded-xl border border-eco-card-border overflow-hidden flex flex-col">
              <div className="p-6 border-b border-eco-card-border flex items-center gap-3">
                  <div className="p-2 bg-eco-brand-orange/10 rounded-lg text-eco-brand-orange">
                      <Shield className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Permissions & Access</h2>
              </div>
              <div className="p-6 space-y-3 flex-1">
                  {[
                      {label: 'Absorption Request Management', active: true},
                      {label: 'Driver Management', active: true},
                      {label: 'E-Way Bill Approval', active: true},
                      {label: 'Virtual Hub Management', active: true},
                      {label: 'Analytics Access', active: true},
                      {label: 'Carbon Tracking', active: true},
                      {label: 'System Settings', active: false},
                  ].map((perm, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${perm.active ? 'bg-[#1A1F2E] border-white/5' : 'bg-[#1A1F2E]/60 border-transparent opacity-60'}`}>
                          <span className="text-white font-medium">{perm.label}</span>
                          {perm.active ? (
                              <div className="bg-eco-success/20 p-1 rounded-full">
                                  <Check className="w-4 h-4 text-eco-success" />
                              </div>
                          ) : (
                              <div className="bg-gray-700/50 p-1 rounded-full">
                                  <Info className="w-4 h-4 text-gray-400" />
                              </div>
                          )}
                      </div>
                  ))}
              </div>
          </div>

          {/* Authorized Virtual Hub Management */}
          <div className="bg-eco-card rounded-xl border border-eco-card-border overflow-hidden flex flex-col">
              <div className="p-6 border-b border-eco-card-border flex justify-between items-center">
                  <h2 className="text-lg font-bold text-white">Authorized Virtual Hub Management</h2>
                   <button 
                      onClick={() => showToast('Opening Hub Creation Form', 'Please wait...', 'info')}
                      className="bg-eco-brand-orange hover:bg-eco-brand-orange-hover text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-neon-orange transition-all flex items-center active:scale-[0.98]"
                   >
                      <Plus className="w-3 h-3 mr-1" /> Add Hub
                  </button>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-[#2A3142]">
                          <tr>
                              <th className="px-6 py-4 text-xs uppercase tracking-wider text-eco-text-secondary font-medium">Hub</th>
                              <th className="px-6 py-4 text-xs uppercase tracking-wider text-eco-text-secondary font-medium">Location</th>
                              <th className="px-6 py-4 text-xs uppercase tracking-wider text-eco-text-secondary font-medium">Status</th>
                              <th className="px-6 py-4 text-xs uppercase tracking-wider text-eco-text-secondary font-medium">Created</th>
                              <th className="px-6 py-4 text-xs uppercase tracking-wider text-eco-text-secondary font-medium text-right">Actions</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-eco-card-border text-sm">
                          {loading ? (
                              <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                      <div className="flex items-center justify-center">
                                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eco-brand-orange"></div>
                                      </div>
                                  </td>
                              </tr>
                          ) : hubs.length === 0 ? (
                              <tr>
                                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                                      No virtual hubs found. Click "Add Hub" to create one.
                                  </td>
                              </tr>
                          ) : (
                              hubs.map((hub, idx) => (
                                  <tr key={hub.id} className="hover:bg-[#1A1F2E] transition-colors">
                                      <td className="px-6 py-4 flex items-center text-white font-medium">
                                          <span className="mr-2 text-lg">🤝</span> {hub.name}
                                      </td>
                                      <td className="px-6 py-4 text-gray-300">
                                          {hub.address || `${hub.latitude.toFixed(4)}, ${hub.longitude.toFixed(4)}`}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="px-2 py-1 bg-eco-success/10 text-eco-success rounded text-xs border border-eco-success/20 flex items-center w-fit">
                                              <Check className="w-3 h-3 mr-1" /> Authorized
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-gray-400 text-xs">
                                          {new Date(hub.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/10">
                                              <MoreVertical className="w-4 h-4" />
                                          </button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-eco-card rounded-xl border border-eco-card-border overflow-hidden">
          <div className="p-6 border-b border-eco-card-border flex items-center gap-3">
              <div className="p-2 bg-eco-brand-orange/10 rounded-lg text-eco-brand-orange">
                  <Clock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
          </div>
          <div className="p-6 relative">
              <div className="absolute top-6 bottom-6 left-[41px] w-px bg-[#2A3142]"></div>
              <div className="space-y-8">
                  {[
                      {action: 'Approved absorption request #AR-2601', time: '26 Jan 2026, 14:30', type: 'check', color: 'bg-eco-success', iconColor: 'text-white'},
                      {action: 'Added Virtual Hub E to authorized list', time: '26 Jan 2026, 12:15', type: 'hub', color: 'bg-eco-brand-orange', iconColor: 'text-white'},
                      {action: "Updated driver Suresh Kumar's status", time: '26 Jan 2026, 10:45', type: 'user', color: 'bg-blue-500', iconColor: 'text-white'},
                      {action: 'Disabled Virtual Hub F', time: '25 Jan 2026, 18:20', type: 'hub', color: 'bg-eco-brand-orange', iconColor: 'text-white'},
                      {action: 'Approved E-Way Bill EWB-2024-156', time: '25 Jan 2026, 16:00', type: 'doc', color: 'bg-eco-success', iconColor: 'text-white'},
                  ].map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-4 relative z-10">
                          <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center shadow-lg border-2 border-[#151B28]`}>
                              {activity.type === 'check' && <Check className="w-4 h-4 text-white" />}
                              {activity.type === 'hub' && <span className="text-xs">🤝</span>}
                              {activity.type === 'user' && <div className="w-4 h-4 bg-white/20 rounded-full"></div>}
                              {activity.type === 'doc' && <div className="w-3 h-4 bg-white/20 rounded-[2px]"></div>}
                          </div>
                          <div>
                              <div className="text-white font-medium">{activity.action}</div>
                              <div className="flex items-center text-xs text-gray-500 mt-1">
                                  <Clock className="w-3 h-3 mr-1" /> {activity.time}
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>

    </div>
  );
}
