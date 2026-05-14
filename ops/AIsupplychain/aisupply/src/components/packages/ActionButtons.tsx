import { Save, PlusCircle, X, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onCancel: () => void;
  loading?: boolean;
  formId: string;
}

export function ActionButtons({ onCancel, loading = false, formId }: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mt-8">
      {/* Primary: Save & Add Another */}
      <button
        type="submit"
        form={formId}
        name="action"
        value="saveAndAdd"
        disabled={loading}
        className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5" />
            <span>Save & Add Another</span>
          </>
        )}
      </button>

      {/* Secondary: Save & Allocate */}
      <button
        type="submit"
        form={formId}
        name="action"
        value="save"
        disabled={loading}
        className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-transparent border-2 border-orange-600 text-orange-500 hover:bg-orange-600/10 font-semibold rounded-lg hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        <Save className="w-5 h-5" />
        <span>Save & Allocate Routes</span>
      </button>

      {/* Tertiary: Cancel */}
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="px-6 py-3 bg-transparent text-gray-400 hover:text-white hover:bg-white/5 font-semibold rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X className="w-5 h-5 inline mr-2" />
        Cancel
      </button>
    </div>
  );
}
