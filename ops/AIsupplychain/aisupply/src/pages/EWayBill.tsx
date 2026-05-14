import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock, MoreHorizontal, Edit, Trash, AlertCircle, Check } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { getAllBills, getEWayBillsStats, updateEWayBill, deleteEWayBill } from '../services/apiClient';
import { EWayBillDetailModal } from '../components/EWayBillDetailModal';
import { EWayBillFormModal } from '../components/EWayBillFormModal';

export function EWayBill() {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [billsData, setBillsData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ active: 0, expireSoon: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Menu State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setActiveMenuId(null);
          }
          if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
              setIsFilterMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleView = (bill: any) => {
      setSelectedBill(bill);
      setIsDetailModalOpen(true);
      setActiveMenuId(null); // Close menu if open
  };

  const handleEdit = (e: React.MouseEvent, bill: any) => {
      e.stopPropagation();
      setSelectedBill(bill);
      setIsEditModalOpen(true);
      setActiveMenuId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (window.confirm('Are you sure you want to delete this E-Way Bill?')) {
          try {
              await deleteEWayBill(id);
              showToast('Success', 'E-Way Bill deleted successfully', 'success');
              // Refresh data
              setLoading(true); // temporary loading
              const [bills, statsData] = await Promise.all([getAllBills(), getEWayBillsStats()]);
              setBillsData(bills);
              setStats(statsData);
              setLoading(false);
          } catch (err) {
              console.error('Failed to delete e-way bill:', err);
              showToast('Error', 'Failed to delete E-Way Bill', 'error');
          }
      }
      setActiveMenuId(null);
  };

  const handleUpdateSuccess = async () => {
      showToast('Success', 'E-Way Bill updated successfully', 'success');
      setIsEditModalOpen(false);
      // Refresh data
      const [bills, statsData] = await Promise.all([getAllBills(), getEWayBillsStats()]);
      setBillsData(bills);
      setStats(statsData);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bills, statsData] = await Promise.all([
          getAllBills(),
          getEWayBillsStats()
        ]);
        setBillsData(bills);
        setStats(statsData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch e-way bills:', err);
        setError('Failed to load e-way bills. Check backend connection.');
        showToast('Connection Error', 'Unable to fetch e-way bills', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [showToast]);

  const filteredBills = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return billsData.filter(bill => {
        const matchesSearch = 
            bill.id?.toLowerCase().includes(lowerSearch) ||
            bill.vehicle?.toLowerCase().includes(lowerSearch) ||
            bill.driver?.toLowerCase().includes(lowerSearch) ||
            bill.from?.toLowerCase().includes(lowerSearch) ||
            bill.to?.toLowerCase().includes(lowerSearch) ||
            bill.value?.toString().toLowerCase().includes(lowerSearch) ||
            bill.valid?.toLowerCase().includes(lowerSearch) ||
            bill.status?.toLowerCase().includes(lowerSearch);

        const matchesStatus = filterStatus === 'ALL' || bill.status?.toUpperCase() === filterStatus;
        
        return matchesSearch && matchesStatus;
    });
  }, [searchTerm, billsData, filterStatus]);

  const handleExport = () => {
    // Convert bills to CSV
    const headers = ['E-Way Bill ID', 'Vehicle No.', 'Route', 'Driver', 'Cargo Value', 'Valid Until', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredBills.map(bill => [
        bill.id,
        bill.vehicle,
        `${bill.from} → ${bill.to}`,
        bill.driver,
        bill.value,
        bill.valid,
        bill.status
      ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eway-bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Export Complete', 'E-Way Bills exported successfully', 'success');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-eco-brand-orange"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <AlertCircle className="w-12 h-12 text-eco-error mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Unavailable</h3>
        <p className="text-eco-text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center text-sm text-eco-text-secondary mb-2">
           Dashboard <span className="mx-2">&gt;</span> <span className="text-white font-semibold">E-Way Bill</span>
       </div>
       
       {/* Stats Row */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-eco-card rounded-xl p-6 border border-eco-card-border flex items-center shadow-lg hover:shadow-xl transition-shadow cursor-default">
               <div className="p-3 bg-eco-emerald-500/10 rounded-lg mr-4">
                   <CheckCircle className="w-6 h-6 text-eco-emerald-400" />
               </div>
               <div>
                   <div className="text-eco-text-secondary text-sm">Active E-Way Bills</div>
                   <div className="text-2xl font-bold text-white">{stats.active}</div>
               </div>
           </div>
           <div className="bg-eco-card rounded-xl p-6 border border-eco-card-border flex items-center shadow-lg hover:shadow-xl transition-shadow cursor-default">
               <div className="p-3 bg-eco-brand-orange/10 rounded-lg mr-4">
                   <AlertTriangle className="w-6 h-6 text-eco-brand-orange" />
               </div>
               <div>
                   <div className="text-eco-text-secondary text-sm">Expiring Soon</div>
                   <div className="text-2xl font-bold text-white">{stats.expireSoon}</div>
               </div>
           </div>
            <div className="bg-eco-card rounded-xl p-6 border border-eco-card-border flex items-center shadow-lg hover:shadow-xl transition-shadow cursor-default">
               <div className="p-3 bg-red-500/10 rounded-lg mr-4">
                   <Clock className="w-6 h-6 text-red-500" />
               </div>
               <div>
                   <div className="text-eco-text-secondary text-sm">Expired Today</div>
                   <div className="text-2xl font-bold text-white">{stats.expired}</div>
               </div>
           </div>
       </div>

       {/* Filters */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-eco-card p-4 rounded-xl border border-eco-card-border">
           <div className="relative flex-1 max-w-xl w-full">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search by E-Way Bill ID, Vehicle No, or Driver..." 
                   className="w-full bg-eco-secondary border border-eco-card-border rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-eco-brand-orange transition-colors placeholder:text-gray-600"
               />
           </div>
           <div className="flex gap-3 w-full md:w-auto">
            <div className="relative" ref={filterMenuRef}>
                <button 
                    onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                    className={`flex items-center justify-center px-4 py-2 border rounded-lg text-sm transition-colors w-full md:w-auto ${
                        filterStatus !== 'ALL' 
                        ? 'bg-eco-brand-orange/10 border-eco-brand-orange text-eco-brand-orange' 
                        : 'bg-eco-secondary border-eco-card-border text-white hover:border-gray-500'
                    }`}
                >
                    <Filter className="w-4 h-4 mr-2" /> 
                    {filterStatus === 'ALL' ? 'Filter' : filterStatus.charAt(0) + filterStatus.slice(1).toLowerCase()}
                </button>
                
                {isFilterMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-eco-card-border rounded-lg shadow-xl z-[100] overflow-hidden">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-eco-secondary/50">
                            Filter by Status
                        </div>
                        {['ALL', 'ACTIVE', 'EXPIRED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setFilterStatus(status);
                                    setIsFilterMenuOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-eco-secondary hover:text-white flex items-center justify-between transition-colors border-t border-eco-card-border first:border-t-0"
                            >
                                <span>{status === 'ALL' ? 'All Statuses' : status.charAt(0) + status.slice(1).toLowerCase()}</span>
                                {filterStatus === status && <Check className="w-4 h-4 text-eco-brand-orange" />}
                            </button>
                        ))}
                    </div>
                )}
            </div>
               <button 
                  onClick={handleExport}
                  className="flex items-center justify-center px-6 py-2 bg-eco-brand-orange hover:bg-eco-brand-orange-hover text-white text-sm font-semibold rounded-lg shadow-neon-orange transition-all active:scale-95 w-full md:w-auto"
               >
                   <Download className="w-4 h-4 mr-2" /> Export
               </button>
           </div>
       </div>

       {/* Table */}
       <div className="bg-eco-card rounded-xl border border-eco-card-border overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                   <thead>
                       <tr className="bg-eco-secondary text-eco-text-secondary text-xs uppercase tracking-wider border-b border-eco-card-border">
                           <th className="px-6 py-4 font-medium">E-Way Bill ID</th>
                           <th className="px-6 py-4 font-medium">Vehicle No.</th>
                           <th className="px-6 py-4 font-medium">Route</th>
                           <th className="px-6 py-4 font-medium">Driver</th>
                           <th className="px-6 py-4 font-medium">Cargo Value</th>
                           <th className="px-6 py-4 font-medium">Valid Until</th>
                           <th className="px-6 py-4 font-medium">Status</th>
                           <th className="px-6 py-4 font-medium text-right">Actions</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-eco-card-border text-sm">
                       {filteredBills.length > 0 ? filteredBills.map((bill) => (
                           <tr key={bill.id} className="hover:bg-eco-secondary/50 transition-colors group">
                               <td className="px-6 py-4 text-eco-brand-orange font-medium">{bill.id}</td>
                               <td className="px-6 py-4 text-white font-mono bg-white/5 rounded-lg w-fit inline-block my-3 mx-6 text-center">{bill.vehicle}</td>
                               <td className="px-6 py-4 text-gray-300">
                                   <div className="font-medium text-white">{bill.from} → {bill.to}</div>
                                   <div className="text-xs text-eco-text-secondary">{bill.dist}</div>
                               </td>
                               <td className="px-6 py-4 text-white">{bill.driver}</td>
                               <td className="px-6 py-4 text-white font-bold">{bill.value}</td>
                               <td className="px-6 py-4 text-gray-300">
                                   <div className="flex items-center">
                                       <Clock className="w-3 h-3 mr-2 text-gray-500" /> {bill.valid}
                                   </div>
                               </td>
                               <td className="px-6 py-4">
                                   <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                       bill.status === 'Active' 
                                       ? 'bg-eco-success/10 text-eco-success border-eco-success/20' 
                                       : 'bg-gray-700/50 text-gray-400 border-gray-600'
                                   }`}>
                                       {bill.status}
                                   </span>
                               </td>
                               <td className="px-6 py-4 text-right">
                                   <div className="flex justify-end space-x-2 relative">
                                       <button 
                                          onClick={() => handleView(bill)}
                                          className="p-1.5 hover:bg-white/10 rounded-lg text-eco-info hover:text-white transition-colors"
                                          title="View Details"
                                        >
                                           <Eye className="w-4 h-4" />
                                       </button>
                                       
                                       <div className="relative">
                                           <button 
                                               onClick={(e) => toggleMenu(e, bill.id)}
                                               className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                           >
                                                <MoreHorizontal className="w-4 h-4" />
                                           </button>

                                           {activeMenuId === bill.id && (
                                               <div 
                                                   ref={menuRef} 
                                                   className="absolute right-0 top-full mt-1 w-40 bg-gray-900 border border-eco-card-border rounded-lg shadow-xl z-[100] overflow-hidden"
                                               >
                                                   <button 
                                                       onClick={(e) => handleEdit(e, bill)}
                                                       className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-eco-secondary hover:text-white flex items-center transition-colors"
                                                   >
                                                       <Edit className="w-3 h-3 mr-2 text-eco-brand-orange" /> Edit
                                                   </button>
                                                   <button 
                                                       onClick={(e) => handleDelete(e, bill.id)}
                                                       className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-eco-secondary hover:text-white flex items-center transition-colors border-t border-eco-card-border"
                                                   >
                                                       <Trash className="w-3 h-3 mr-2 text-red-500" /> Delete
                                                   </button>
                                               </div>
                                           )}
                                       </div>
                                   </div>
                               </td>
                           </tr>
                       )) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                    No records found matching your search.
                                </td>
                            </tr>
                       )}
                   </tbody>
               </table>
           </div>
       </div>


    {/* Modals */}
    <EWayBillDetailModal 
        isOpen={isDetailModalOpen} 
        onClose={() => setIsDetailModalOpen(false)} 
        bill={selectedBill} 
    />

    <EWayBillFormModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        onSuccess={handleUpdateSuccess} 
        initialData={selectedBill}
        updateBill={updateEWayBill}
    />
    </div>
  );
}
