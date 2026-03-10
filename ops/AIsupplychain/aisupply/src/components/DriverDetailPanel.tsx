import { X, Star, Truck, MapPin, Phone, Calendar, TrendingUp, Award } from 'lucide-react';

interface DriverDetailPanelProps {
  driver: any;
  isOpen: boolean;
  onClose: () => void;
}

export function DriverDetailPanel({ driver, isOpen, onClose }: DriverDetailPanelProps) {
  if (!driver) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full md:w-[500px] bg-eco-dark border-l border-eco-card-border shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-eco-card-border bg-eco-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full ${driver.color || 'bg-eco-brand-orange'} text-white flex items-center justify-center font-bold text-2xl shadow-lg`}>
                  {driver.avatar || driver.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{driver.name}</h2>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      driver.status === 'On Duty' ? 'bg-eco-success/10 text-eco-success border-eco-success/20' :
                      driver.status === 'In Transit' ? 'bg-eco-info/10 text-eco-info border-eco-info/20' :
                      'bg-gray-700/50 text-gray-400 border-gray-600'
                    }`}>
                      {driver.status}
                    </span>
                    <div className="flex items-center text-yellow-400 font-bold text-sm">
                      <Star className="w-4 h-4 mr-1 fill-current" />
                      {driver.rating}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Contact Info */}
            <div className="bg-eco-card rounded-xl p-4 border border-eco-card-border">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-eco-brand-orange" />
                Contact Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Phone:</span>
                  <span className="text-white font-medium">{driver.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Email:</span>
                  <span className="text-white font-medium">{driver.email || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-eco-card rounded-xl p-4 border border-eco-card-border">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Truck className="w-4 h-4 mr-2 text-eco-brand-orange" />
                Vehicle Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">License Plate:</span>
                  <span className="text-white font-mono font-medium">{driver.plate || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Vehicle Type:</span>
                  <span className="text-white font-medium">{driver.vehicle || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-eco-card rounded-xl p-4 border border-eco-card-border">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-eco-brand-orange" />
                Current Location
              </h3>
              <p className="text-white text-sm">{driver.loc || 'Location not available'}</p>
            </div>

            {/* Performance Stats */}
            <div className="bg-eco-card rounded-xl p-4 border border-eco-card-border">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-eco-brand-orange" />
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-eco-secondary/50 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">Total Deliveries</div>
                  <div className="text-2xl font-bold text-white mt-1">{driver.deliveriesCount || 0}</div>
                </div>
                <div className="bg-eco-secondary/50 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">Rating</div>
                  <div className="text-2xl font-bold text-yellow-400 mt-1 flex items-center">
                    {driver.rating || 'N/A'}
                    <Star className="w-4 h-4 ml-1 fill-current" />
                  </div>
                </div>
                <div className="bg-eco-secondary/50 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">On-Time Rate</div>
                  <div className="text-2xl font-bold text-eco-success mt-1">{driver.onTimeRate || '95'}%</div>
                </div>
                <div className="bg-eco-secondary/50 p-3 rounded-lg">
                  <div className="text-xs text-gray-400">Experience</div>
                  <div className="text-2xl font-bold text-white mt-1">{driver.experience || '5'}y</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-eco-card rounded-xl p-4 border border-eco-card-border">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-eco-brand-orange" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-eco-success mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white">Completed delivery to Mumbai</div>
                    <div className="text-xs text-gray-400">2 hours ago</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-eco-info mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white">Started route from Ahmedabad</div>
                    <div className="text-xs text-gray-400">5 hours ago</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-gray-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-white">Completed delivery to Pune</div>
                    <div className="text-xs text-gray-400">Yesterday</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-eco-card rounded-xl p-4 border border-eco-card-border">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <Award className="w-4 h-4 mr-2 text-eco-brand-orange" />
                Achievements
              </h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-full text-xs font-medium">
                  🏆 Top Performer
                </span>
                <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-medium">
                  ⚡ Fast Delivery
                </span>
                <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium">
                  ✓ 100% On-Time
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-eco-card-border bg-eco-card">
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-eco-brand-orange hover:bg-eco-brand-orange-hover text-white py-3 rounded-lg font-semibold transition-all active:scale-95">
                Assign Task
              </button>
              <button className="bg-eco-secondary border border-eco-card-border hover:border-white/30 text-white py-3 rounded-lg font-semibold transition-all active:scale-95">
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
