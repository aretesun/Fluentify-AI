import React from 'react';
import { XIcon } from './IconComponents';

interface FreeChatModalProps {
  onClose: () => void;
  onSelectTopic: (topic: string) => void;
}

const TOPICS = [
    { name: "Weekend Plans", emoji: "🎉" },
    { name: "Hobbies", emoji: "🎨" },
    { name: "Recent Movie or Show", emoji: "🎬" },
    { name: "Favorite Foods", emoji: "🍕" },
    { name: "Dream Vacation", emoji: "🏝️" },
    { name: "Work or School", emoji: "💼" },
];

const FreeChatModal: React.FC<FreeChatModalProps> = ({ onClose, onSelectTopic }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="free-chat-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 id="free-chat-title" className="text-xl font-bold text-gray-900 dark:text-white">Choose a Topic</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">What would you like to talk about?</p>
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
            {TOPICS.map((topic) => (
              <button 
                key={topic.name}
                onClick={() => onSelectTopic(topic.name)}
                className="text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <span className="text-2xl">{topic.emoji}</span>
                <p className="font-semibold text-gray-800 dark:text-gray-200 mt-2">{topic.name}</p>
              </button>
            ))}
          {/* Fix: Changed closing </ul> tag to </div> to correctly close the grid container. */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FreeChatModal;
