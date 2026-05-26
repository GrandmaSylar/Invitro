import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, Users, Building2, Stethoscope, FlaskConical, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { cn } from './ui/utils';

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { results, isLoading, debouncedTerm } = useGlobalSearch(query);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (url: string) => {
    navigate(url);
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'patient': return <Users size={16} className="text-blue-500" />;
      case 'hospital': return <Building2 size={16} className="text-emerald-500" />;
      case 'doctor': return <Stethoscope size={16} className="text-purple-500" />;
      case 'test': return <FlaskConical size={16} className="text-amber-500" />;
      default: return <Search size={16} className="text-muted-foreground" />;
    }
  };

  const getLabel = (type: string) => {
    switch (type) {
      case 'patient': return 'Patient';
      case 'hospital': return 'Hospital';
      case 'doctor': return 'Doctor';
      case 'test': return 'Test';
      default: return 'Result';
    }
  };

  return (
    <div ref={containerRef} className="hidden md:flex items-center relative max-w-[360px] w-full mx-4">
      <Search size={14} className="absolute left-3.5 text-muted-foreground z-10" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.trim().length >= 2) {
            setIsOpen(true);
          } else {
            setIsOpen(false);
          }
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
        placeholder="Search patients, hospitals, doctors..."
        className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-border/85 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
      />
      
      {isLoading && (
        <Loader2 size={14} className="absolute right-3.5 text-muted-foreground animate-spin z-10" />
      )}

      {isOpen && (debouncedTerm.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[400px]">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="overflow-y-auto p-2 space-y-1">
              {results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result.url)}
                  className="w-full flex items-center gap-3 p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{result.title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground">
                      <span className="uppercase tracking-wider opacity-70">{getLabel(result.type)}</span>
                      {result.subtitle && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <span className="truncate">{result.subtitle}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <Search size={24} className="text-muted-foreground/30" />
              <div>
                <p className="text-sm font-semibold">No results found</p>
                <p className="text-xs text-muted-foreground">We couldn't find anything for "{debouncedTerm}"</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
