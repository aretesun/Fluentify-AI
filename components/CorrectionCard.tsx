
import React from 'react';
import { Correction } from '../types';

interface CorrectionCardProps {
  correction: Correction;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ correction }) => {
  return (
    <div className="my-2 self-center w-full max-w-2xl">
      <div className="bg-yellow-100 dark:bg-yellow-900/50 border-l-4 border-yellow-500 text-yellow-800 dark:text-yellow-200 p-4 rounded-r-lg" role="alert">
        <p className="font-bold text-sm mb-2 flex items-center">
            <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
            Correction Suggestion
        </p>
        <p className="text-sm italic text-red-600 dark:text-red-400 line-through mb-2">You wrote: "{correction.original}"</p>
        {correction.suggestions.map((s, index) => (
          <div key={index} className="mb-2 last:mb-0">
            <p className="text-sm">
                <span className="font-semibold text-green-700 dark:text-green-400">More natural:</span> 
                <span className="italic"> "{s.suggestion}"</span>
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 pl-4 border-l-2 border-yellow-500/50">
              {s.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CorrectionCard;
