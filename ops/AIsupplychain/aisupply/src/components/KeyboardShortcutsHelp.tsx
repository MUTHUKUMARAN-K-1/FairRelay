import React, { useEffect } from "react";
import { Keyboard, X } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { label: "Navigate to screen 1-6", keys: ["1-6"] },
    { label: "Toggle quick actions menu", keys: ["Ctrl", "Q"] },
    { label: "Focus search bar", keys: ["Ctrl", "K"] },
    { label: "Show keyboard shortcuts", keys: ["?"] },
    { label: "Close modals/panels", keys: ["Esc"] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0F1115] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center space-x-2 text-white font-semibold">
            <Keyboard className="w-5 h-5 text-eco-brand-orange" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
            >
              <span className="text-sm text-gray-300">{shortcut.label}</span>
              <div className="flex items-center space-x-1">
                {shortcut.keys.map((key, kIndex) => (
                  <React.Fragment key={kIndex}>
                    <span className="px-2 py-1 text-xs font-mono font-medium text-eco-brand-orange bg-eco-brand-orange/10 border border-eco-brand-orange/20 rounded-md shadow-sm">
                      {key}
                    </span>
                    {kIndex < shortcut.keys.length - 1 && (
                      <span className="text-xs text-gray-500 font-medium px-0.5">
                        +
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/5 text-center">
          <p className="text-xs text-gray-500">
            Press <span className="bg-white/10 px-1 rounded text-gray-400">Esc</span> to close
          </p>
        </div>
      </div>
    </div>
  );
}
