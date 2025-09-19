'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface EmailContact {
  email: string;
  name?: string;
  lastContacted?: string | Date;
}

interface EmailMultiSelectProps {
  label: string;
  selectedEmails: string[];
  onSelectionChange: (emails: string[]) => void;
  placeholder?: string;
  availableContacts?: EmailContact[];
  className?: string;
}

export default function EmailMultiSelect({
  label,
  selectedEmails,
  onSelectionChange,
  placeholder = "Enter email addresses...",
  availableContacts = [],
  className = "",
}: EmailMultiSelectProps) {
  const [inputValue, setInputValue] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<EmailContact[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter contacts based on input
  useEffect(() => {
    if (inputValue.trim() === '') {
      setFilteredContacts(availableContacts.slice(0, 10)); // Show recent contacts
    } else {
      const filtered = availableContacts.filter(contact => 
        contact.email.toLowerCase().includes(inputValue.toLowerCase()) ||
        (contact.name && contact.name.toLowerCase().includes(inputValue.toLowerCase()))
      ).slice(0, 10);
      setFilteredContacts(filtered);
    }
    setHighlightedIndex(-1);
  }, [inputValue, availableContacts]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmail = (email: string, name?: string) => {
    if (!email || selectedEmails.includes(email)) return;
    
    if (isValidEmail(email)) {
      onSelectionChange([...selectedEmails, email]);
      setInputValue('');
      setShowDropdown(false);
    }
  };

  const removeEmail = (emailToRemove: string) => {
    onSelectionChange(selectedEmails.filter(email => email !== emailToRemove));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case 'Tab':
      case ',':
      case ';':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredContacts[highlightedIndex]) {
          addEmail(filteredContacts[highlightedIndex].email, filteredContacts[highlightedIndex].name);
        } else if (inputValue.trim()) {
          addEmail(inputValue.trim());
        }
        break;
      case 'Backspace':
        if (inputValue === '' && selectedEmails.length > 0) {
          removeEmail(selectedEmails[selectedEmails.length - 1]);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredContacts.length - 1 ? prev + 1 : 0
        );
        setShowDropdown(true);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredContacts.length - 1
        );
        setShowDropdown(true);
        break;
      case 'Escape':
        setShowDropdown(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowDropdown(true);
  };

  const handleContactClick = (contact: EmailContact, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    addEmail(contact.email, contact.name);
  };

  const formatContactDisplay = (contact: EmailContact) => {
    if (contact.name) {
      return `${contact.name} <${contact.email}>`;
    }
    return contact.email;
  };

  const getContactInitials = (contact: EmailContact) => {
    if (contact.name) {
      return contact.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return contact.email[0].toUpperCase();
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-neutral-700 mb-2">
        {label}
      </label>
      
      <div 
        className="min-h-[42px] w-full border border-neutral-300 rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white p-2 flex flex-wrap gap-1 items-center cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected Email Tags */}
        {selectedEmails.map((email, index) => (
          <div
            key={index}
            className="inline-flex items-center bg-primary-100 text-primary-800 px-2 py-1 rounded-md text-sm font-medium"
          >
            <span className="max-w-[200px] truncate">{email}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              className="ml-1 text-primary-600 hover:text-primary-800 focus:outline-none"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowDropdown(true)}
          placeholder={selectedEmails.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm"
        />

        {/* Dropdown Indicator */}
        <ChevronDown 
          className={`w-4 h-4 text-neutral-400 transform transition-transform ${
            showDropdown ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-[60] max-h-60 overflow-y-auto"
        >
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact, index) => (
              <div
                key={`${contact.email}-${index}`}
                className={`p-3 cursor-pointer border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 flex items-center space-x-3 ${
                  index === highlightedIndex ? 'bg-primary-50' : ''
                }`}
                onClick={(e) => handleContactClick(contact, e)}
              >
                {/* Avatar */}
                <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-semibold">
                  {getContactInitials(contact)}
                </div>
                
                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-neutral-900 truncate">
                    {contact.name || contact.email}
                  </div>
                  {contact.name && (
                    <div className="text-xs text-neutral-500 truncate">
                      {contact.email}
                    </div>
                  )}
                  {contact.lastContacted && (
                    <div className="text-xs text-neutral-400">
                      Last contacted: {new Date(contact.lastContacted).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : inputValue.trim() ? (
            <div className="p-3 text-sm text-neutral-500">
              {isValidEmail(inputValue.trim()) ? (
                <div 
                  className="cursor-pointer hover:bg-neutral-50 p-2 rounded"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addEmail(inputValue.trim());
                  }}
                >
                  Add "{inputValue.trim()}"
                </div>
              ) : (
                'Enter a valid email address'
              )}
            </div>
          ) : (
            <div className="p-3 text-sm text-neutral-500">
              Start typing to search contacts...
            </div>
          )}
        </div>
      )}
    </div>
  );
}