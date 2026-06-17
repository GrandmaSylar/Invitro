import { useState, useEffect } from 'react';
import { ArrowRight, Check, FlaskConical } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

export function WelcomeChangelogModal() {
  const currentVersion = '1.1.7';
  const localStorageKey = `lims-changelog-seen-v${currentVersion}`;
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(localStorageKey);
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [localStorageKey]);

  const handleDismiss = () => {
    localStorage.setItem(localStorageKey, 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#091a2b]/95 backdrop-blur-sm p-6 overflow-hidden select-none animate-in fade-in duration-300">
      
      {/* Background orbs for depth matching login page & splash screen */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-[480px] bg-white border border-gray-100 shadow-[0_25px_50px_rgba(0,0,0,0.25)] rounded-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
        
        {/* Top Header Section */}
        <div className="p-8 pb-3 text-center space-y-4">
          <div className="mx-auto flex items-center justify-center size-14 rounded-2xl bg-[#0c2e5a]/10 text-[#0c2e5a] shadow-[inset_0_2px_4px_rgba(12,46,90,0.05)] border border-[#0c2e5a]/10">
            <FlaskConical className="size-6.5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
              Invitro LIMS Updated
            </h2>
            <span className="inline-block px-3 py-0.5 rounded-full bg-[#0c2e5a]/10 border border-[#0c2e5a]/20 text-[10px] font-extrabold text-[#0c2e5a]">
              Version {currentVersion}
            </span>
          </div>
        </div>

        {/* Changelog Content */}
        <CardContent className="p-8 pt-3 space-y-6">
          <div className="space-y-4">
            <p className="text-xs text-gray-500 text-center leading-normal">
              Here is a summary of the improvements in this stable release:
            </p>
            
            <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
              
              {/* Feature 1 */}
              <div className="flex gap-3 items-start">
                <div className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                  <Check className="size-3.5 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-gray-900">Official Test Catalog Loaded</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Wiped old demo databases and loaded the fresh, official catalog containing 223 tests and 329 laboratory parameters.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex gap-3 items-start">
                <div className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                  <Check className="size-3.5 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-gray-900">New Help & Tutorials Center</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Get step-by-step guides tailored specifically to your role (Receptionist, Technician, or Admin), search FAQs, or take a quick UI tour.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex gap-3 items-start">
                <div className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                  <Check className="size-3.5 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-gray-900">Improved Offline Syncing</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    Upgraded the background connection engine to handle offline-to-cloud database updates much more reliably.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex gap-3 items-start">
                <div className="p-1 bg-emerald-500/10 text-emerald-600 rounded-lg shrink-0 mt-0.5">
                  <Check className="size-3.5 stroke-[2.5]" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-extrabold text-gray-900">Automatic Data Recovery</h4>
                  <p className="text-[11px] text-gray-500 leading-normal">
                    The app now automatically checks for missing files upon login and pulls down cloud data to keep your computer up-to-date.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Action button */}
          <Button 
            onClick={handleDismiss} 
            className="w-full h-11 bg-[#0c2e5a] hover:bg-[#092244] text-white font-bold rounded-xl shadow-md flex items-center justify-center gap-2 border-none cursor-pointer transition-colors"
          >
            Continue to Console <ArrowRight className="size-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
