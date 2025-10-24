import React, { useState } from 'react';
import { XIcon, MapPinIcon } from './IconComponents';

interface TravelModeModalProps {
  onClose: () => void;
  onSelectDestination: (destination: string) => void;
}

const COUNTRIES = ["Japan", "USA", "Spain", "France", "Italy", "China"];

const TravelModeModal: React.FC<TravelModeModalProps> = ({ onClose, onSelectDestination }) => {
  const [customDestination, setCustomDestination] = useState('');

  const handleSelect = (destination: string) => {
    if (destination.trim()) {
      onSelectDestination(destination.trim());
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="travel-mode-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
               <div className="text-emerald-500">
                <i className="fa-solid fa-plane-departure text-2xl"></i>
              </div>
              <div>
                <h2 id="travel-mode-title" className="text-xl font-bold text-gray-900 dark:text-white">Travel Destination Mode</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Select a country to tailor scenarios for your trip.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <XIcon />
            </button>
          </div>
          
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {COUNTRIES.map((country) => (
              <button 
                key={country}
                onClick={() => handleSelect(country)}
                className="text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-2">{country}</p>
              </button>
            ))}
          </div>

          <div className="mt-6">
            <label htmlFor="custom-destination" className="text-sm font-medium text-gray-700 dark:text-gray-300">Or enter another destination:</label>
            <div className="flex gap-2 mt-2">
                <input
                    id="custom-destination"
                    type="text"
                    value={customDestination}
                    onChange={(e) => setCustomDestination(e.target.value)}
                    placeholder="e.g., Brazil"
                    className="flex-grow p-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white"
                />
                <button
                    onClick={() => handleSelect(customDestination)}
                    disabled={!customDestination.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                    Set
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TravelModeModal;