import React, { useState } from 'react';
import { ShieldAlert, RotateCcw, LogOut, Loader2 } from 'lucide-react';

interface TrainingBannerProps {
  onExit: () => void;
}

export const TrainingBanner: React.FC<TrainingBannerProps> = ({ onExit }) => {
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      if (window.electronAPI?.resetSandboxDatabase) {
        const res = await window.electronAPI.resetSandboxDatabase();
        if (res.success) {
          window.location.reload();
        } else {
          alert(`Failed to reset training ground: ${res.error}`);
        }
      }
    } catch (err: any) {
      alert(`Reset error: ${err.message}`);
    } finally {
      setIsResetting(false);
      setShowConfirmReset(false);
    }
  };

  return (
    <>
      <div className="w-full bg-amber-500/10 dark:bg-amber-900/30 border-b border-amber-500/30 backdrop-blur-md px-4 py-2 flex items-center justify-between shadow-sm z-30 transition-all">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                Training Ground Mode Active
              </span>
              <span className="text-xs text-amber-700/80 dark:text-amber-300/80 hidden sm:inline">
                • Temporary DB (<code className="font-mono text-amber-600 dark:text-amber-400">invitro_sandbox</code>)
              </span>
            </div>
            <p className="text-xs text-amber-900/90 dark:text-amber-200/90 font-medium">
              Actions in training mode will not affect live production data. All test data can be wiped at any time.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfirmReset(true)}
            disabled={isResetting}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-md transition-all active:scale-95 disabled:opacity-50"
            title="Reset training ground data back to original preset defaults"
          >
            {isResetting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5" />
            )}
            <span>Reset Data</span>
          </button>

          <button
            onClick={onExit}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm rounded-md transition-all active:scale-95"
            title="Exit Training Ground and return to Live Production Database"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Training Ground</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-amber-500/40 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <ShieldAlert className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold text-white">Reset Training Ground Data?</h3>
            </div>
            <p className="text-sm text-zinc-300">
              This will clear all patient registrations, test orders, and results entered during this training session, and restore the database back to clean preset defaults.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-all"
              >
                {isResetting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Yes, Reset Training DB</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
