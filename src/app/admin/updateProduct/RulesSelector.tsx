import React, { useState, useEffect, useRef } from 'react';
import { CheckIcon, ChevronDownIcon, XIcon } from 'lucide-react';

interface Rule {
  _id: string;
  rule: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface RulesSelectorProps {
  rules: Rule[];
  selectedRules: Rule[];
  onChange: (selectedRules: Rule[]) => void;
}

const RulesSelector: React.FC<RulesSelectorProps> = ({ rules, selectedRules, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleRule = (rule: Rule) => {
    const isSelected = selectedRules.some(r => r._id === rule._id);
    const updatedRules = isSelected
      ? selectedRules.filter(r => r._id !== rule._id)
      : [...selectedRules, rule];
    onChange(updatedRules);
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedRules.length ? `${selectedRules.length} rules selected` : 'Select rules'}</span>
        <ChevronDownIcon className="h-5 w-5" />
      </div>
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {rules.map((rule) => (
            <div
              key={rule._id}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleRule(rule)}
            >
              <div className={`w-5 h-5 border rounded-sm mr-2 flex items-center justify-center ${
                selectedRules.some(r => r._id === rule._id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
              }`}>
                {selectedRules.some(r => r._id === rule._id) && <CheckIcon className="h-4 w-4 text-white" />}
              </div>
              <span>{rule.rule}</span>
            </div>
          ))}
        </div>
      )}
      {selectedRules.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedRules.map(rule => (
            <div key={rule._id} className="bg-gray-200 rounded-full px-3 py-1 text-sm flex items-center">
              {rule.rule}
              <XIcon
                className="h-4 w-4 ml-2 cursor-pointer"
                onClick={() => toggleRule(rule)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RulesSelector;