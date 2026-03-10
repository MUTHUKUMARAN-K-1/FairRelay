import { useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { Package, MapPin, Clock, Weight, Box, AlertCircle, CheckCircle } from 'lucide-react';
import { NominatimAddressInput } from '../NominatimAddressInput';

export interface PackageFormData {
  packageId: string;
  cargoType: string;
  packageCount: number;
  pickupLocation: string;
  pickupLat?: number;
  pickupLng?: number;
  pickupContact: string;
  pickupTimeStart: string;
  pickupTimeEnd: string;
  deliveryLocation: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryContact: string;
  deliveryTimeStart: string;
  deliveryTimeEnd: string;
  weight: string;
  volume: string;
  urgent: boolean;
  specialInstructions: string;
}

interface PackageFormProps {
  id?: string;
  onSubmit: (data: PackageFormData, action?: 'save' | 'saveAndAdd') => void;
  formData: PackageFormData;
  onFormDataChange: (data: PackageFormData) => void;
}

interface InputWrapperProps {
  label: string;
  htmlFor?: string;
  error?: string;
  touched?: boolean;
  icon?: any;
  children: React.ReactNode;
}

const InputWrapper = ({ 
  label, 
  htmlFor,
  error,
  touched,
  icon: Icon, 
  children 
}: InputWrapperProps) => {
  const status = !touched ? null : (error ? 'error' : 'success');
  
  return (
    <div className="space-y-2">
      <label 
        htmlFor={htmlFor}
        className="text-xs uppercase tracking-wide text-gray-400 font-medium cursor-pointer"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none">
            <Icon className="w-5 h-5" />
          </div>
        )}
        {children}
        {status === 'success' && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 animate-in fade-in duration-200 z-10 pointer-events-none ${!Icon ? 'right-10' : ''}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
        )}
        {status === 'error' && (
          <div className={`absolute right-3 top-1/2 -translate-y-1/2 text-red-500 z-10 pointer-events-none ${!Icon ? 'right-10' : ''}`}>
            <AlertCircle className="w-5 h-5" />
          </div>
        )}
      </div>
      {touched && error && (
        <p className="text-red-400 text-xs flex items-center space-x-1 animate-in slide-in-from-left duration-200">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

export function PackageForm({ id, onSubmit, formData, onFormDataChange }: PackageFormProps) {
  const [errors, setErrors] = useState<Partial<Record<keyof PackageFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PackageFormData, boolean>>>({});

  const handleChange = useCallback((field: keyof PackageFormData, value: any) => {
    onFormDataChange({ ...formData, [field]: value });
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formData, onFormDataChange, errors]);

  const handlePickupPlaceSelected = useCallback((place: { address: string; lat: number; lng: number }) => {
    onFormDataChange({
      ...formData,
      pickupLocation: place.address,
      pickupLat: place.lat,
      pickupLng: place.lng,
    });
  }, [formData, onFormDataChange]);

  const handleDeliveryPlaceSelected = useCallback((place: { address: string; lat: number; lng: number }) => {
    onFormDataChange({
      ...formData,
      deliveryLocation: place.address,
      deliveryLat: place.lat,
      deliveryLng: place.lng,
    });
  }, [formData, onFormDataChange]);

  const handleBlur = (field: keyof PackageFormData) => {
    setTouched({ ...touched, [field]: true });
    validateField(field, formData[field]);
  };

  const validateField = (field: keyof PackageFormData, value: any) => {
    let error = '';

    switch (field) {
      case 'pickupLocation':
      case 'deliveryLocation':
        if (!value || value.trim() === '') {
          error = 'This field is required';
        }
        break;
      case 'weight':
      case 'volume':
        if (value && parseFloat(value) <= 0) {
          error = 'Must be a positive number';
        }
        break;
      case 'pickupTimeEnd':
        if (formData.pickupTimeStart && value && new Date(value) <= new Date(formData.pickupTimeStart)) {
          error = 'End time must be after start time';
        }
        break;
      case 'deliveryTimeEnd':
        if (formData.deliveryTimeStart && value && new Date(value) <= new Date(formData.deliveryTimeStart)) {
          error = 'End time must be after start time';
        }
        break;
    }

    setErrors({ ...errors, [field]: error });
    return error === '';
  };

  const validateForm = () => {
    const newErrors: Partial<Record<keyof PackageFormData, string>> = {};
    
    if (!formData.pickupLocation) newErrors.pickupLocation = 'Pickup location is required';
    if (!formData.deliveryLocation) newErrors.deliveryLocation = 'Delivery location is required';
    if (formData.weight && parseFloat(formData.weight) <= 0) newErrors.weight = 'Must be positive';
    if (formData.volume && parseFloat(formData.volume) <= 0) newErrors.volume = 'Must be positive';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Determine which button submitted the form via the submitter property
      // Modern browsers populate this on nativeEvent
      const submitter = (e.nativeEvent as any).submitter;
      const action = submitter?.value as 'save' | 'saveAndAdd' | undefined;
      onSubmit(formData, action);
    }
  };

  return (
    <form id={id} onSubmit={handleSubmit} className="space-y-6">
      {/* Package Identification */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Package className="w-5 h-5 text-orange-500" />
          <span>Package Identification</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="packageId" className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              Package ID
            </label>
            <input
              id="packageId"
              name="packageId"
              type="text"
              value={formData.packageId}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cargoType" className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              Cargo Type
            </label>
            <select
              id="cargoType"
              name="cargoType"
              value={formData.cargoType}
              onChange={(e) => handleChange('cargoType', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150"
            >
              <option value="Electronics" className="bg-gray-900 text-white">Electronics</option>
              <option value="Industrial Machinery" className="bg-gray-900 text-white">Industrial Machinery</option>
              <option value="Textiles" className="bg-gray-900 text-white">Textiles</option>
              <option value="Automotive Parts" className="bg-gray-900 text-white">Automotive Parts</option>
              <option value="FMCG Products" className="bg-gray-900 text-white">FMCG Products</option>
              <option value="Pharmaceuticals" className="bg-gray-900 text-white">Pharmaceuticals</option>
              <option value="Steel & Metal" className="bg-gray-900 text-white">Steel & Metal</option>
              <option value="Agricultural Products" className="bg-gray-900 text-white">Agricultural Products</option>
              <option value="Furniture" className="bg-gray-900 text-white">Furniture</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="packageCount" className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              Package Count
            </label>
            <input
              id="packageCount"
              name="packageCount"
              type="number"
              min="1"
              value={formData.packageCount || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                handleChange('packageCount', isNaN(val) ? 0 : val);
              }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150"
            />
          </div>
        </div>
      </div>

      {/* Pickup Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-emerald-500" />
          <span>Pickup Details</span>
        </h3>

        <InputWrapper 
          label="Pickup Location *" 
          htmlFor="pickupLocation"
          error={errors.pickupLocation} 
          touched={touched.pickupLocation}
        >
          <NominatimAddressInput
            id="pickupLocation"
            value={formData.pickupLocation}
            onPlaceSelected={handlePickupPlaceSelected}
            placeholder="Search pickup address..."
          />
        </InputWrapper>

        <div className="space-y-2">
          <label htmlFor="pickupContact" className="text-xs uppercase tracking-wide text-gray-400 font-medium">
            Pickup Contact (Optional)
          </label>
          <input
            id="pickupContact"
            name="pickupContact"
            type="number"
            value={formData.pickupContact}
            onChange={(e) => handleChange('pickupContact', e.target.value)}
            placeholder="Contact phone..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWrapper 
            label="Pickup Time Start" 
            htmlFor="pickupTimeStart"
            icon={Clock}
            error={errors.pickupTimeStart}
            touched={touched.pickupTimeStart}
          >
            <input
              id="pickupTimeStart"
              name="pickupTimeStart"
              type="datetime-local"
              value={formData.pickupTimeStart}
              onChange={(e) => handleChange('pickupTimeStart', e.target.value)}
              onBlur={() => handleBlur('pickupTimeStart')}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150"
            />
          </InputWrapper>

          <InputWrapper 
            label="Pickup Time End" 
            htmlFor="pickupTimeEnd"
            icon={Clock}
            error={errors.pickupTimeEnd}
            touched={touched.pickupTimeEnd}
          >
            <input
              id="pickupTimeEnd"
              name="pickupTimeEnd"
              type="datetime-local"
              value={formData.pickupTimeEnd}
              onChange={(e) => handleChange('pickupTimeEnd', e.target.value)}
              onBlur={() => handleBlur('pickupTimeEnd')}
              className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all duration-150 ${
                errors.pickupTimeEnd && touched.pickupTimeEnd
                  ? 'border-red-500'
                  : 'border-white/10 focus:border-orange-600/50'
              }`}
            />
          </InputWrapper>
        </div>
      </div>

      {/* Delivery Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-orange-500" />
          <span>Delivery Details</span>
        </h3>

        <InputWrapper 
          label="Delivery Location *" 
          htmlFor="deliveryLocation"
          error={errors.deliveryLocation}
          touched={touched.deliveryLocation}
        >
          <NominatimAddressInput
            id="deliveryLocation"
            value={formData.deliveryLocation}
            onPlaceSelected={handleDeliveryPlaceSelected}
            placeholder="Search delivery address..."
          />
        </InputWrapper>

        <div className="space-y-2">
          <label htmlFor="deliveryContact" className="text-xs uppercase tracking-wide text-gray-400 font-medium">
            Delivery Contact (Optional)
          </label>
          <input
            id="deliveryContact"
            name="deliveryContact"
            type="number"
            value={formData.deliveryContact}
            onChange={(e) => handleChange('deliveryContact', e.target.value)}
            placeholder="Contact phone..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWrapper 
            label="Delivery Time Start" 
            htmlFor="deliveryTimeStart"
            icon={Clock}
            error={errors.deliveryTimeStart}
            touched={touched.deliveryTimeStart}
          >
            <input
              id="deliveryTimeStart"
              name="deliveryTimeStart"
              type="datetime-local"
              value={formData.deliveryTimeStart}
              onChange={(e) => handleChange('deliveryTimeStart', e.target.value)}
              onBlur={() => handleBlur('deliveryTimeStart')}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150"
            />
          </InputWrapper>

          <InputWrapper 
            label="Delivery Time End" 
            htmlFor="deliveryTimeEnd"
            icon={Clock}
            error={errors.deliveryTimeEnd}
            touched={touched.deliveryTimeEnd}
          >
            <input
              id="deliveryTimeEnd"
              name="deliveryTimeEnd"
              type="datetime-local"
              value={formData.deliveryTimeEnd}
              onChange={(e) => handleChange('deliveryTimeEnd', e.target.value)}
              onBlur={() => handleBlur('deliveryTimeEnd')}
              className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all duration-150 ${
                errors.deliveryTimeEnd && touched.deliveryTimeEnd
                  ? 'border-red-500'
                  : 'border-white/10 focus:border-orange-600/50'
              }`}
            />
          </InputWrapper>
        </div>
      </div>

      {/* Package Specifications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Box className="w-5 h-5 text-orange-500" />
          <span>Package Specifications</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputWrapper 
            label="Weight (kg)" 
            htmlFor="weight"
            icon={Weight}
            error={errors.weight}
            touched={touched.weight}
          >
            <input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              min="0"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              onBlur={() => handleBlur('weight')}
              placeholder="0.0"
              className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all duration-150 ${
                errors.weight && touched.weight
                  ? 'border-red-500'
                  : 'border-white/10 focus:border-orange-600/50'
              }`}
            />
          </InputWrapper>

          <InputWrapper 
            label="Volume (m³)" 
            htmlFor="volume"
            icon={Box}
            error={errors.volume}
            touched={touched.volume}
          >
            <input
              id="volume"
              name="volume"
              type="number"
              step="0.01"
              min="0"
              value={formData.volume}
              onChange={(e) => handleChange('volume', e.target.value)}
              onBlur={() => handleBlur('volume')}
              placeholder="0.00"
              className={`w-full pl-10 pr-12 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all duration-150 ${
                errors.volume && touched.volume
                  ? 'border-red-500'
                  : 'border-white/10 focus:border-orange-600/50'
              }`}
            />
          </InputWrapper>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-6 rounded-full transition-all duration-200 cursor-pointer ${
              formData.urgent ? 'bg-orange-600' : 'bg-white/10'
            }`}
            onClick={() => handleChange('urgent', !formData.urgent)}
            >
              <div className={`w-4 h-4 bg-white rounded-full shadow-lg transition-all duration-200 transform ${
                formData.urgent ? 'translate-x-5 mt-1 ml-1' : 'translate-x-1 mt-1'
              }`} />
            </div>
            <label className="text-white font-medium cursor-pointer" onClick={() => handleChange('urgent', !formData.urgent)}>
              Mark as Urgent
            </label>
            <input 
              id="urgent" 
              name="urgent" 
              type="checkbox" 
              checked={formData.urgent} 
              onChange={(e) => handleChange('urgent', e.target.checked)}
              className="hidden" 
            />
          </div>
          {formData.urgent && (
            <span className="text-orange-500 text-sm font-semibold">⚡ Priority Delivery</span>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="specialInstructions" className="text-xs uppercase tracking-wide text-gray-400 font-medium">
            Special Instructions (Optional)
          </label>
          <textarea
            id="specialInstructions"
            name="specialInstructions"
            value={formData.specialInstructions}
            onChange={(e) => handleChange('specialInstructions', e.target.value)}
            placeholder="Any special handling instructions..."
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-600/50 focus:border-orange-600/50 transition-all duration-150 resize-none"
          />
        </div>
      </div>
    </form>
  );
}
