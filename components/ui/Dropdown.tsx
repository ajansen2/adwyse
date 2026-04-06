'use client';

import { useState, useRef, useEffect, ReactNode, Fragment } from 'react';

interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  description?: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

interface DropdownSection {
  title?: string;
  items: DropdownItem[];
}

interface DropdownProps {
  trigger: ReactNode;
  sections: DropdownSection[];
  align?: 'left' | 'right';
  width?: 'auto' | 'sm' | 'md' | 'lg';
  className?: string;
}

const widthClasses = {
  auto: 'min-w-48',
  sm: 'w-48',
  md: 'w-56',
  lg: 'w-72'
};

export function Dropdown({
  trigger,
  sections,
  align = 'right',
  width = 'auto',
  className = ''
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 mt-2 ${widthClasses[width]} py-1
            bg-white rounded-lg shadow-lg border border-gray-200
            ${align === 'right' ? 'right-0' : 'left-0'}
            animate-in fade-in slide-in-from-top-2 duration-200
          `}
        >
          {sections.map((section, sectionIndex) => (
            <Fragment key={sectionIndex}>
              {sectionIndex > 0 && <div className="my-1 border-t border-gray-200" />}

              {section.title && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {section.title}
                </div>
              )}

              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 text-sm text-left
                    ${item.disabled
                      ? 'text-gray-300 cursor-not-allowed'
                      : item.danger
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                    transition-colors
                  `}
                >
                  {item.icon && (
                    <span className={`flex-shrink-0 w-4 h-4 ${item.danger ? 'text-red-500' : 'text-gray-400'}`}>
                      {item.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <p className="text-xs text-gray-500 truncate">{item.description}</p>
                    )}
                  </div>
                </button>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

// Simple select dropdown
interface SelectOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface SelectDropdownProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className = ''
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2
          bg-white border border-gray-300 rounded-lg text-sm
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
        `}
      >
        <span className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 w-4 h-4">{selectedOption.icon}</span>
          )}
          <span className={`truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
            {selectedOption?.label || placeholder}
          </span>
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Options */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left
                ${option.value === value
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
                }
                transition-colors
              `}
            >
              {option.icon && (
                <span className="flex-shrink-0 w-4 h-4">{option.icon}</span>
              )}
              <span className="truncate">{option.label}</span>
              {option.value === value && (
                <svg className="ml-auto w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
