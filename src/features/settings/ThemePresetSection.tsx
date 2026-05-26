import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../app/components/ui/card';
import { Button } from '../../app/components/ui/button';
import { useAuthStore } from '../../stores/useAuthStore';
import { rbacService } from '../../services/rbacService';
import { toast } from 'sonner';
import { Check, Loader2, Sparkles, Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../../app/components/ui/utils';

interface PresetTheme {
  id: 'default' | 'ocean-breeze' | 'turquoise-harmony' | 'silent-waters';
  name: string;
  description: string;
  light: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
  dark: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    border: string;
  };
}

const PRESETS: PresetTheme[] = [
  {
    id: 'default',
    name: 'Invitro Classic',
    description: 'The standard premium LIMS console theme with deep navy and rich steel blue accents.',
    light: {
      background: '#f8fafc',
      foreground: '#0f172a',
      primary: '#0c2e5a',
      secondary: '#f1f5f9',
      accent: '#f0f4f9',
      border: '#e2e8f0',
    },
    dark: {
      background: '#0b0f19',
      foreground: '#f8fafc',
      primary: '#3b82f6',
      secondary: '#1e293b',
      accent: '#1e293b',
      border: '#1e293b',
    }
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    description: 'A vibrant marine-inspired theme featuring ocean blues, rich cyans, and aquamarine tints.',
    light: {
      background: '#f0f7fc',
      foreground: '#031b33',
      primary: '#0284c7',
      secondary: '#e0f2fe',
      accent: '#e0f7fa',
      border: '#bae6fd',
    },
    dark: {
      background: '#020813',
      foreground: '#f0f9ff',
      primary: '#38bdf8',
      secondary: '#07284b',
      accent: '#0b3a6b',
      border: '#0d3663',
    }
  },
  {
    id: 'turquoise-harmony',
    name: 'Turquoise Harmony',
    description: 'A calm, organic theme balancing emerald greens, deep teals, and warm sand accents.',
    light: {
      background: '#f2f7f4',
      foreground: '#052c24',
      primary: '#0d9488',
      secondary: '#d1e7dd',
      accent: '#faf6e8',
      border: '#a3e2d3',
    },
    dark: {
      background: '#02120e',
      foreground: '#e6f4ea',
      primary: '#2dd4bf',
      secondary: '#0a3d32',
      accent: '#1e2825',
      border: '#0d4d3f',
    }
  },
  {
    id: 'silent-waters',
    name: 'Silent Waters',
    description: 'A calm minimalist slate theme, crafted with soft icy grays, grays, and silver steel tones.',
    light: {
      background: '#f1f5f9',
      foreground: '#1e293b',
      primary: '#475569',
      secondary: '#e2e8f0',
      accent: '#cbd5e1',
      border: '#cbd5e1',
    },
    dark: {
      background: '#090d16',
      foreground: '#f1f5f9',
      primary: '#94a3b8',
      secondary: '#1e293b',
      accent: '#273549',
      border: '#273549',
    }
  }
];

export default function ThemePresetSection() {
  const { user, updateThemePreset } = useAuthStore();
  const [savingPreset, setSavingPreset] = useState<string | null>(null);

  const currentPreset = user?.themePreset || 'default';

  const handleApplyPreset = async (presetId: 'default' | 'ocean-breeze' | 'turquoise-harmony' | 'silent-waters') => {
    if (!user) {
      toast.error('You must be logged in to change your settings.');
      return;
    }
    
    if (presetId === currentPreset) return;

    try {
      setSavingPreset(presetId);
      
      // Update in database (dual-save method: try column first, fall back to JSONB overrides)
      await rbacService.updateThemePreset(user.id, presetId);
      
      // Update in auth store session
      updateThemePreset(presetId);
      
      toast.success(`Theme set to ${PRESETS.find(p => p.id === presetId)?.name}!`, {
        description: 'Your preference is saved and synchronized across all your devices.'
      });
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to persist theme preset: ${err.message || 'Unknown error'}`);
    } finally {
      setSavingPreset(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Console Theme Presets</CardTitle>
          </div>
          <CardDescription>
            Choose a premium console aesthetic. Each preset features custom tuned Light and Dark themes that sync across your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PRESETS.map((preset) => {
              const isActive = currentPreset === preset.id;
              const isSaving = savingPreset === preset.id;
              
              return (
                <div
                  key={preset.id}
                  onClick={() => !isSaving && handleApplyPreset(preset.id)}
                  className={cn(
                    "group relative flex flex-col rounded-xl border-2 bg-card text-card-foreground p-4 cursor-pointer transition-all duration-300 hover:scale-[1.015] hover:shadow-lg focus:outline-none select-none",
                    isActive 
                      ? "border-primary shadow-md shadow-primary/5" 
                      : "border-border/50 hover:border-border"
                  )}
                >
                  {/* Selector Badge */}
                  {isActive && (
                    <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1 shadow-sm shrink-0 flex items-center justify-center">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  )}

                  {/* Header */}
                  <div className="pr-8 mb-2">
                    <h3 className="font-semibold text-base tracking-tight text-foreground flex items-center gap-2">
                      {preset.name}
                      {preset.id === 'default' && (
                        <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase">Default</span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5 min-h-[32px]">
                      {preset.description}
                    </p>
                  </div>

                  {/* Dual Mode Palette Previews */}
                  <div className="grid grid-cols-2 gap-3 mt-2 mb-3">
                    
                    {/* Light Preview Panel */}
                    <div 
                      className="rounded-lg p-3 border overflow-hidden flex flex-col gap-2 relative shadow-sm"
                      style={{ 
                        backgroundColor: preset.light.background, 
                        borderColor: preset.light.border,
                        color: preset.light.foreground
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1">
                          <Sun className="h-2.5 w-2.5" /> Light
                        </span>
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.light.primary }} />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-full rounded" style={{ backgroundColor: preset.light.secondary }} />
                        <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: preset.light.accent }} />
                      </div>
                      <div className="flex gap-1 mt-1">
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: preset.light.primary }} />
                        <div className="h-3 w-6 rounded-sm opacity-20" style={{ backgroundColor: preset.light.foreground }} />
                      </div>
                    </div>

                    {/* Dark Preview Panel */}
                    <div 
                      className="rounded-lg p-3 border overflow-hidden flex flex-col gap-2 relative shadow-sm"
                      style={{ 
                        backgroundColor: preset.dark.background, 
                        borderColor: preset.dark.border,
                        color: preset.dark.foreground
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider opacity-60 flex items-center gap-1">
                          <Moon className="h-2.5 w-2.5 text-yellow-400" /> Dark
                        </span>
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: preset.dark.primary }} />
                      </div>
                      <div className="space-y-1">
                        <div className="h-1.5 w-full rounded" style={{ backgroundColor: preset.dark.secondary }} />
                        <div className="h-1.5 w-3/4 rounded" style={{ backgroundColor: preset.dark.accent }} />
                      </div>
                      <div className="flex gap-1 mt-1">
                        <div className="h-3 w-6 rounded-sm" style={{ backgroundColor: preset.dark.primary }} />
                        <div className="h-3 w-6 rounded-sm opacity-20" style={{ backgroundColor: preset.dark.foreground }} />
                      </div>
                    </div>

                  </div>

                  {/* Actions / Info footer */}
                  <div className="mt-auto pt-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: preset.light.primary }} />
                      <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: preset.light.accent }} />
                      <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: preset.dark.primary }} />
                      <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: preset.dark.accent }} />
                    </div>
                    <span className={cn(
                      "font-semibold transition-colors duration-200 group-hover:text-primary",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {isSaving ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> Saving...
                        </span>
                      ) : isActive ? (
                        'Active theme'
                      ) : (
                        'Apply theme ↗'
                      )}
                    </span>
                  </div>

                </div>
              );
            })}
          </div>
        </CardContent>
        <CardFooter className="border-t border-border/50 bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-b-xl">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Monitor className="h-4 w-4 text-muted-foreground/70" />
            <span>Theme settings are linked directly to user ID <strong>{user?.id ? `${user.id.substring(0, 8)}...` : 'N/A'}</strong>.</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">Supabase Connected</span>
        </CardFooter>
      </Card>
    </div>
  );
}
