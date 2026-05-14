import { useState, useEffect } from 'react';
import { PackageForm, type PackageFormData } from '../components/packages/PackageForm';
import { PackagePreview } from '../components/packages/PackagePreview';
import { ActionButtons } from '../components/packages/ActionButtons';
import { GlassCard } from '../components/ui/GlassCard';
import { Package, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { createDelivery } from '../services/apiClient';

const initialFormData: PackageFormData = {
  packageId: `PKG-${Math.floor(Math.random() * 10000)}`,
  cargoType: 'General',
  packageCount: 1,
  pickupLocation: '',
  pickupLat: undefined,
  pickupLng: undefined,
  pickupContact: '',
  pickupTimeStart: '',
  pickupTimeEnd: '',
  deliveryLocation: '',
  deliveryLat: undefined,
  deliveryLng: undefined,
  deliveryContact: '',
  deliveryTimeStart: '',
  deliveryTimeEnd: '',
  weight: '',
  volume: '',
  urgent: false,
  specialInstructions: '',
};

export function Packages() {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<PackageFormData>(initialFormData);
  const [loading, setLoading] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('packageDraft');
    if (savedDraft) {
      try {
        const parsedDraft = JSON.parse(savedDraft);
        setFormData(parsedDraft);
        showToast('Draft Loaded', 'Previous package draft restored', 'info');
      } catch (error) {
        console.error('Failed to parse saved draft:', error);
      }
    } else {
      // Generate new ID if no draft
      setFormData(prev => ({
        ...prev,
        packageId: `PKG-${Math.floor(Math.random() * 10000)}`
      }));
    }
  }, []);

  const handleFormDataChange = (newData: PackageFormData) => {
    setFormData(newData);
  };

  const handleCancel = () => {
    setFormData({
        ...initialFormData,
        packageId: `PKG-${Math.floor(Math.random() * 10000)}`
    });
    showToast('Cancelled', 'Package entry cancelled.', 'info');
  };

  const handleSubmit = async (data: PackageFormData, action?: 'save' | 'saveAndAdd') => {
    setLoading(true);
    try {
        if (action === 'save') {
            // Save to localStorage only
            localStorage.setItem('packageDraft', JSON.stringify(data));
            showToast('Saved', 'Package draft saved to local storage', 'success');
            setLoading(false);
            return;
        }

        // For 'saveAndAdd', POST to backend
        const payload = {
            pickupLocation: data.pickupLocation,
            pickupLat: data.pickupLat,
            pickupLng: data.pickupLng,
            pickupTime: data.pickupTimeStart,
            deliveryLocation: data.deliveryLocation,
            deliveryLat: data.deliveryLat,
            deliveryLng: data.deliveryLng,
            deliveryTime: data.deliveryTimeStart,
            cargoType: data.cargoType,
            cargoWeight: parseFloat(data.weight) || 1,
            cargoVolumeLtrs: parseFloat(data.volume) || null,
            /* cargoValue: null, */
            dispatcherId:"819f1587-5cc8-41bb-921c-1312c5249b24",
            postalCode:"600069",
            timeWindowStart: data.pickupTimeStart,
            timeWindowEnd: data.pickupTimeEnd,
            distanceKm: null

            // specialInstructions: data.specialInstructions
        };

        const response = await createDelivery(payload);
        
        if (response.success) {
            showToast('Success', 'Package created successfully!', 'success');
            
            // Clear localStorage draft
            localStorage.removeItem('packageDraft');
            
            // Reset form for next entry
            setFormData({
                ...initialFormData,
                packageId: `PKG-${Math.floor(Math.random() * 10000)}`
            });
        } else {
            showToast('Error', response.message || 'Failed to create package', 'error');
        }
    } catch (error: any) {
        console.error('Submission error:', error);
        showToast('Error', error.response?.data?.message || 'Failed to connect to server', 'error');
    } finally {
        setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        const saveBtn = document.querySelector('button[value="save"][form="package-form"]') as HTMLButtonElement;
        saveBtn?.click();
      }
      // Ctrl+Enter: Save & Add Another
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        const saveAddBtn = document.querySelector('button[value="saveAndAdd"][form="package-form"]') as HTMLButtonElement;
        saveAddBtn?.click();
      }
      // Esc: Cancel
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-600/20 rounded-xl">
                <Package className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Add New Package</h1>
                <p className="text-gray-400 mt-1">Enter delivery details for package allocation</p>
              </div>
            </div>
            
            {/* Quick Actions Badge */}
            <div className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-orange-600/10 border border-orange-600/30 rounded-lg">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-sm font-medium">Smart Defaults Active</span>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
            <span className="px-2 py-1 bg-white/5 rounded border border-white/10">
              <kbd className="font-mono">Ctrl+S</kbd> Save
            </span>
            <span className="px-2 py-1 bg-white/5 rounded border border-white/10">
              <kbd className="font-mono">Ctrl+Enter</kbd> Save & Add Another
            </span>
            <span className="px-2 py-1 bg-white/5 rounded border border-white/10">
              <kbd className="font-mono">Esc</kbd> Cancel
            </span>
          </div>
        </div>



        {/* Two-column layout */}
        <div className="grid lg:grid-cols-5 gap-6 mt-8">
          {/* Form Card (3 columns) */}
          <GlassCard className="lg:col-span-3">
            <PackageForm 
              id="package-form"
              onSubmit={handleSubmit}
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />
          </GlassCard>

          {/* Preview Card (2 columns) - Summary & Map */}
          <GlassCard className="lg:col-span-2">
            <PackagePreview data={formData} />
          </GlassCard>
        </div>

        {/* Action Buttons */}
        <ActionButtons
          formId="package-form"
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}
