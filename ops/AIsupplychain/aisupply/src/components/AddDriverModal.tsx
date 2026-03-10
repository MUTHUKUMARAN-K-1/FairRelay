import { useState } from 'react';
import { X, Truck, User, MapPin, Phone, AlertCircle } from 'lucide-react';

interface AddDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    createDriver?: (data: any) => Promise<any>;
    updateDriver?: (id: string, data: any) => Promise<any>;
}

export function AddDriverModal({ isOpen, onClose, onSuccess, createDriver, initialData, updateDriver }: AddDriverModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        vehicleType: 'Standard',
        currentVehicleNo: '',
        homeBaseCity: '',
        avatarColor: 'bg-blue-500' // Default color
    });
    
    // Load initial data when modal opens
    useState(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                phone: initialData.phone || '',
                vehicleType: initialData.vehicleType || initialData.type || 'Standard',
                currentVehicleNo: initialData.currentVehicleNo || initialData.plate || '',
                homeBaseCity: initialData.homeBaseCity || initialData.loc || '',
                avatarColor: initialData.color || 'bg-blue-500'
            });
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (initialData && updateDriver) {
                 await updateDriver(initialData.id, {
                    ...formData,
                    // Keep existing values or defaults
                });
            } else if (createDriver) {
                await createDriver({
                    ...formData,
                    role: 'DRIVER',
                    status: 'ON_DUTY', // Default status
                    initials: formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                });
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to create driver:', err);
            setError(err.response?.data?.message || 'Failed to create driver. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-eco-card border border-eco-card-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-eco-card-border bg-eco-secondary/30">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <User className="w-5 h-5 mr-2 text-eco-brand-orange" />
                        {initialData ? 'Edit Driver' : 'Add New Driver'}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-eco-text-secondary hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-eco-text-secondary mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-eco-brand-orange transition-colors"
                                placeholder="Enter driver name"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-eco-text-secondary mb-1">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="tel"
                                required
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-eco-brand-orange transition-colors"
                                placeholder="+91 XXXXX XXXXX"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-eco-text-secondary mb-1">Vehicle Type</label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select 
                                    value={formData.vehicleType}
                                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                                    className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-eco-brand-orange transition-colors appearance-none"
                                >
                                    <option value="Standard" className="bg-gray-900 text-white">Standard</option>
                                    <option value="Heavy" className="bg-gray-900 text-white">Heavy</option>
                                    <option value="Van" className="bg-gray-900 text-white">Van</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-eco-text-secondary mb-1">Vehicle Plate</label>
                            <input 
                                type="text"
                                value={formData.currentVehicleNo}
                                onChange={(e) => setFormData({...formData, currentVehicleNo: e.target.value})}
                                className="w-full bg-eco-secondary border border-eco-card-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-eco-brand-orange transition-colors"
                                placeholder="MH-XX-XX-XXXX"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-eco-text-secondary mb-1">Home Base City</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input 
                                type="text"
                                value={formData.homeBaseCity}
                                onChange={(e) => setFormData({...formData, homeBaseCity: e.target.value})}
                                className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-eco-brand-orange transition-colors"
                                placeholder="e.g. Mumbai"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 bg-eco-secondary border border-eco-card-border rounded-lg text-white text-sm hover:bg-eco-card-border transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2 bg-eco-brand-orange hover:bg-eco-brand-orange-hover text-white rounded-lg text-sm font-semibold shadow-neon-orange transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                initialData ? 'Update Driver' : 'Add Driver'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
