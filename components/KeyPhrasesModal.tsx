import React from 'react';
import { Scenario } from '../types';
import { XIcon, BookOpenIcon } from './IconComponents';

interface KeyPhrasesModalProps {
  scenario: Scenario;
  onClose: () => void;
}

const KeyPhrasesModal: React.FC<KeyPhrasesModalProps> = ({ scenario, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="key-phrases-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-full text-primary">
                <BookOpenIcon />
              </div>
              <div>
                <h2 id="key-phrases-title" className="text-xl font-bold text-gray-900 dark:text-white">Key Expressions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Useful phrases for "{scenario.title}"</p>
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
          
          <ul className="mt-6 space-y-4">
            {scenario.keyPhrases.map((kp, index) => (
              <li key={index} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="font-semibold text-primary dark:text-primary/90">"{kp.phrase}"</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{kp.meaning}</p>
              </li>
            ))}
          </ul>

        </div>
      </div>
    </div>
  );
};

export default KeyPhrasesModal;