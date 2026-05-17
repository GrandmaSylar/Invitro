import React, { useState, useMemo, KeyboardEvent } from 'react';
import { Test } from '../../lib/types';
import { Input } from '../../app/components/ui/input';
import { Button } from '../../app/components/ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../../app/components/ui/popover';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '../../app/components/ui/utils';

interface TestComboboxProps {
  tests: Test[];
  onAdd: (test: Test) => void;
  alreadyAdded: string[];
  disabled?: boolean;
}

export function TestCombobox({ tests, onAdd, alreadyAdded, disabled }: TestComboboxProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredTests = useMemo(() => {
    if (inputValue.length < 1) return tests;
    const lowerInput = inputValue.toLowerCase();
    return tests.filter(
      (test) =>
        test.testName.toLowerCase().includes(lowerInput) ||
        (test.department && test.department.toLowerCase().includes(lowerInput))
    );
  }, [tests, inputValue]);

  const handleSelect = (test: Test) => {
    if (alreadyAdded.includes(test.id)) {
      return; // Do nothing if already added
    }
    onAdd(test);
    setInputValue('');
    setIsOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const firstAvailable = filteredTests.find(t => !alreadyAdded.includes(t.id));
      if (firstAvailable) {
        handleSelect(firstAvailable);
      }
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between font-normal text-left h-12"
          disabled={disabled}
        >
          <span>Select tests to add...</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search tests..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border-0 focus-visible:ring-0 shadow-none h-11"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredTests.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No tests found.
            </div>
          ) : (
            filteredTests.map((test) => {
              const isAdded = alreadyAdded.includes(test.id);
              return (
                <div
                  key={test.id}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center justify-between rounded-sm px-3 py-2 text-sm outline-none transition-colors",
                    isAdded 
                      ? "opacity-50 cursor-not-allowed bg-muted/50" 
                      : "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                  )}
                  onClick={() => handleSelect(test)}
                >
                  <div>
                    <span className="font-semibold block">{test.testName}</span>
                    <span className="text-xs text-muted-foreground">{test.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">₵{test.testCost?.toFixed(2) ?? '0.00'}</span>
                    {isAdded && <span className="text-[10px] bg-muted-foreground/20 px-1.5 py-0.5 rounded text-muted-foreground font-semibold uppercase tracking-wider">Added</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
