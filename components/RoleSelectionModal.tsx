// Fix: Added full content for RoleSelectionModal.tsx
import React from 'react';
import { Scenario } from '../types';
import { XIcon } from './IconComponents';

interface RoleSelectionModalProps {
  scenario: Scenario;
  onClose: () => void;
  onStartChat: (scenario: Scenario, isReversed: boolean) => void;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({ scenario, onClose, onStartChat }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-selection-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 id="role-selection-title" className="text-xl font-bold text-gray-900 dark:text-white">역할 선택</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">"{scenario.title}" 시나리오에서 연습할 역할을 선택하세요.</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <XIcon />
            </button>
          </div>
          
          <div className="mt-6 space-y-4">
            <button 
              onClick={() => onStartChat(scenario, false)}
              className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{scenario.userRole}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">기본 역할로 대화를 시작합니다. AI 튜터 '{scenario.aiTutorName}'({scenario.aiRole}) 역할을 맡습니다.</p>
            </button>
            <button 
              onClick={() => onStartChat(scenario, true)}
              className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{scenario.aiRole}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">역할을 바꿔서 연습합니다. AI 튜터는 '{scenario.userRole}' 역할을 맡습니다.</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionModal;