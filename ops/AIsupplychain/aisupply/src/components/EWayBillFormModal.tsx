import { useState } from 'react';
import { X, Truck, User, MapPin, FileText, AlertCircle } from 'lucide-react';

interface EWayBillFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any;
    createBill?: (data: any) => Promise<any>;
    updateBill?: (id: string, data: any) => Promise<any>;
}

export function EWayBillFormModal({ isOpen, onClose, onSuccess, initialData, createBill, updateBill }: EWayBillFormModalProps) {
    const [formData, setFormData] = useState({
        vehicleNo: initialData?.vehicle || '',
        from: initialData?.from || '',
        to: initialData?.to || '',
        driver: initialData?.driver || '',
        cargoValue: initialData?.value?.toString() || '',
        status: initialData?.status?.toUpperCase() || 'ACTIVE',
        validUntil: initialData?.validUntil || '',
        distance: initialData?.dist || ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (initialData && updateBill) {
                // Pass the correct ID. Frontend displays 'Bill No' as ID usually.
                await updateBill(initialData.id, formData);
            } else if (createBill) {
                // Not implementing create in this cycle but prepared for it
                await createBill(formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Failed to save bill:', err);
            setError(err.response?.data?.message || 'Failed to save E-Way Bill.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-eco-card border border-eco-card-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-eco-card-border bg-eco-secondary/30">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-eco-brand-orange" />
                        {initialData ? 'Edit E-Way Bill' : 'New E-Way Bill'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded p-3 text-red-400 text-sm flex">
                            <AlertCircle className="w-4 h-4 mr-2" /> {error}
                        </div>
                    )}

                    {/* Status Dropdown */}
                    <div>
                         <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                         <select 
                            value={formData.status}
                            onChange={(e) => setFormData({...formData, status: e.target.value})}
                            className="w-full bg-eco-secondary border border-eco-card-border rounded-lg px-3 py-2 text-white text-sm"
                         >
                            <option value="ACTIVE" className="bg-gray-900 text-white">ACTIVE</option>
                            <option value="EXPIRED" className="bg-gray-900 text-white">EXPIRED</option>
                            <option value="CANCELLED" className="bg-gray-900 text-white">CANCELLED</option>
                            <option value="COMPLETED" className="bg-gray-900 text-white">COMPLETED</option>
                         </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Vehicle No</label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    value={formData.vehicleNo}
                                    onChange={(e) => setFormData({...formData, vehicleNo: e.target.value})}
                                    className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                                />
                            </div>
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Driver</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    value={formData.driver}
                                    onChange={(e) => setFormData({...formData, driver: e.target.value})}
                                    className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                                    placeholder="Driver Name or ID" // Ideally would be a select but text is fine for MVP
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">From</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    value={formData.from}
                                    onChange={(e) => setFormData({...formData, from: e.target.value})}
                                    className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">To</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                                <input 
                                    type="text"
                                    value={formData.to}
                                    onChange={(e) => setFormData({...formData, to: e.target.value})}
                                    className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-9 pr-3 py-2 text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 py-2 bg-eco-secondary hover:bg-white/5 border border-eco-card-border rounded-lg text-white text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 bg-eco-brand-orange hover:bg-eco-brand-orange-hover text-white rounded-lg text-sm font-semibold shadow-neon-orange">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
