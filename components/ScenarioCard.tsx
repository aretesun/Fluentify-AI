import React from 'react';
import { Scenario } from '../types';

interface ScenarioCardProps {
  scenario: Scenario;
  onSelect: (scenario: Scenario) => void;
}

const difficultyStyles: { [key in Scenario['difficulty']]: string } = {
  '쉬움': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  '중간': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  '어려움': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const ScenarioCard: React.FC<ScenarioCardProps> = ({ scenario, onSelect }) => {
  return (
    <div 
      className="relative group flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={() => onSelect(scenario)}
    >
      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-semibold z-10 ${difficultyStyles[scenario.difficulty]}`}>
          {scenario.difficulty}
      </div>
      <div className="w-full aspect-video bg-center bg-no-repeat bg-cover" style={{backgroundImage: `url("${scenario.imageUrl}")`}}></div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="text-2xl">{scenario.emoji}</span>
          {scenario.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex-grow">{scenario.description}</p>
        <button className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">시작</button>
      </div>
    </div>
  );
};

export default ScenarioCard;