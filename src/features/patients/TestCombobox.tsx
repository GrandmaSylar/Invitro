import React, { useState, useMemo, KeyboardEvent } from 'react';
import { Test } from '../../lib/types';
import { Input } from '../../app/components/ui/input';
import { Button } from '../../app/components/ui/button';

interface TestComboboxProps {
  tests: Test[];
  onAdd: (test: Test) => void;
  alreadyAdded: string[];
  disabled?: boolean;
}

export function TestCombobox({ tests, onAdd, alreadyAdded, disabled }: TestComboboxProps) {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [pendingTest, setPendingTest] = useState<Test | null>(null);

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
      setPendingTest(test);
      setIsOpen(false);
    } else {
      onAdd(test);
      setInputValue('');
      setIsOpen(false);
      setPendingTest(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (pendingTest) {
        onAdd(pendingTest);
        setInputValue('');
        setPendingTest(null);
      } else if (isOpen && filteredTests.length > 0) {
        handleSelect(filteredTests[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setInputValue('');
      setPendingTest(null);
    }
  };

  return (
    <div className="relative w-full">
      <Input
        type="text"
        placeholder="Search for a test..."
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
          setPendingTest(null);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {isOpen && filteredTests.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-60 overflow-y-auto">
          {filteredTests.map((test) => (
            <div
              key={test.id}
              className="px-4 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground flex justify-between items-center"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(test);
              }}
            >
              <div>
                <span className="font-bold block">{test.testName}</span>
                <span className="text-xs text-muted-foreground">{test.department}</span>
              </div>
              <span className="text-sm font-medium">${test.testCost?.toFixed(2) ?? '0.00'}</span>
            </div>
          ))}
        </div>
      )}

      {pendingTest && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <p className="text-yellow-800 mb-2">
            <strong>{pendingTest.testName}</strong> is already in the list. Do you want to add it again?
          </p>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                onAdd(pendingTest);
                setInputValue('');
                setPendingTest(null);
              }}
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPendingTest(null);
                setInputValue('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
