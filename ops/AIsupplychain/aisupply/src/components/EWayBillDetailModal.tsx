import { X, FileText, Truck, User, MapPin, Calendar, DollarSign } from 'lucide-react';

interface EWayBillDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    bill: any;
}

export function EWayBillDetailModal({ isOpen, onClose, bill }: EWayBillDetailModalProps) {
    if (!isOpen || !bill) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-eco-card border border-eco-card-border rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-eco-card-border bg-eco-secondary/30">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <FileText className="w-5 h-5 mr-3 text-eco-brand-orange" />
                        E-Way Bill Details
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Header Info */}
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-xs text-eco-text-secondary uppercase tracking-wider mb-1">Bill Number</div>
                            <div className="text-2xl font-mono font-bold text-white">{bill.id}</div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            bill.status?.toLowerCase().includes('active') ? 'bg-eco-success/10 text-eco-success border-eco-success/20' :
                            bill.status?.toLowerCase().includes('expire') ? 'bg-eco-warning/10 text-eco-warning border-eco-warning/20' :
                            'bg-gray-700/50 text-gray-400 border-gray-600'
                        }`}>
                            {bill.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center text-eco-text-secondary text-xs mb-1">
                                    <Truck className="w-3 h-3 mr-1" /> Vehicle
                                </div>
                                <div className="text-white font-medium">{bill.vehicle}</div>
                            </div>
                            <div>
                                <div className="flex items-center text-eco-text-secondary text-xs mb-1">
                                    <User className="w-3 h-3 mr-1" /> Driver
                                </div>
                                <div className="text-white font-medium">{bill.driver}</div>
                            </div>
                        </div>
                        <div className="space-y-4">
                             <div>
                                <div className="flex items-center text-eco-text-secondary text-xs mb-1">
                                    <DollarSign className="w-3 h-3 mr-1" /> Cargo Value
                                </div>
                                <div className="text-white font-medium">₹{bill.value?.toLocaleString()}</div>
                            </div>
                            <div>
                                <div className="flex items-center text-eco-text-secondary text-xs mb-1">
                                    <Calendar className="w-3 h-3 mr-1" /> Valid Until
                                </div>
                                <div className="text-white font-medium">{bill.valid}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-eco-secondary/50 rounded-lg p-4 border border-eco-card-border">
                        <div className="flex items-center justify-between mb-4">
                             <div className="flex items-center text-eco-text-secondary text-xs">
                                <MapPin className="w-3 h-3 mr-1" /> Route Information
                            </div>
                            <div className="text-xs text-eco-brand-orange font-medium">{bill.dist} km</div>
                        </div>
                        <div className="relative pl-4 space-y-6 border-l-2 border-dashed border-gray-700 ml-1">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-red-500 border-2 border-eco-card"></div>
                                <div className="text-xs text-gray-400 mb-1">From</div>
                                <div className="text-white font-medium text-sm">{bill.from}</div>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-eco-card"></div>
                                <div className="text-xs text-gray-400 mb-1">To</div>
                                <div className="text-white font-medium text-sm">{bill.to}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-eco-card-border bg-eco-secondary/30 flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-eco-secondary hover:bg-white/10 text-white text-sm font-medium rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
