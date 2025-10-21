
import React from 'react';

interface HintPillProps {
  hint: string;
  onClick: (hint: string) => void;
}

const HintPill: React.FC<HintPillProps> = ({ hint, onClick }) => {
  return (
    <button
      onClick={() => onClick(hint)}
      className="bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 text-sm font-medium px-3 py-1 rounded-full hover:bg-violet-200 dark:hover:bg-violet-900 transition-colors duration-200"
    >
      {hint}
    </button>
  );
};

export default HintPill;
