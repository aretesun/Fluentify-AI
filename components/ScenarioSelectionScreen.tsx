import React, { useState } from 'react';
import { SCENARIOS } from '../constants';
import { Scenario } from '../types';
import ScenarioCard from './ScenarioCard';
import Header from './Header';
import FreeChatModal from './FreeChatModal';
import TravelModeModal from './TravelModeModal';
import { MapPinIcon, XIcon } from './IconComponents';

interface ScenarioSelectionScreenProps {
  onSelectScenario: (scenario: Scenario) => void;
  onSelectRandom: () => void;
  onSelectCreate: () => void;
  onSelectFreeChat: (topic: string) => void;
  travelDestination: string | null;
  onSelectDestination: (destination: string) => void;
  onClearDestination: () => void;
}

const CATEGORIES: { key: Scenario['category']; title: string; description: string; }[] = [
    { key: '일상', title: '일상 대화', description: '카페 주문, 길 찾기 등 매일 마주치는 상황을 연습하세요.' },
    { key: '여행', title: '여행 영어', description: '호텔, 공항, 택시 등 여행지에서 자신있게 대화하세요.' },
    { key: '비즈니스', title: '비즈니스 영어', description: '회의, 네트워킹 등 직장에서 필요한 전문적인 대화를 익히세요.' },
];

const ActionCard = ({ title, emoji, description, buttonText, imageUrl, buttonClassName, onClick }: {
    title: string;
    emoji: string;
    description: string;
    buttonText: string;
    imageUrl: string;
    buttonClassName: string;
    onClick: () => void;
}) => (
    <div 
      className="relative group flex flex-col bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={onClick}
    >
      <div className="w-full aspect-video bg-center bg-no-repeat bg-cover" style={{backgroundImage: `url("${imageUrl}")`}}></div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex-grow">{description}</p>
        <button className={`mt-4 w-full text-white font-semibold py-2 rounded-lg text-sm transition-colors ${buttonClassName}`}>{buttonText}</button>
      </div>
    </div>
);

const ScenarioSelectionScreen: React.FC<ScenarioSelectionScreenProps> = ({
  onSelectScenario,
  onSelectRandom,
  onSelectCreate,
  onSelectFreeChat,
  travelDestination,
  onSelectDestination,
  onClearDestination,
}) => {
  const [isFreeChatModalOpen, setIsFreeChatModalOpen] = useState(false);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  
  const listeningScenario = SCENARIOS.find(s => s.category === '듣기');

  const handleSelectTravelDestination = (destination: string) => {
    onSelectDestination(destination);
    setIsTravelModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full h-full">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {travelDestination && (
            <div className="mb-12 p-4 bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-500 rounded-r-lg flex justify-between items-center">
              <div>
                <h3 className="font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <MapPinIcon />
                  Travel Mode: {travelDestination}
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Scenarios are now tailored for your trip. Enjoy your practice!
                </p>
              </div>
              <button
                onClick={onClearDestination}
                className="p-2 rounded-full text-emerald-600 hover:bg-emerald-100 dark:text-emerald-300 dark:hover:bg-emerald-800"
                aria-label="Clear travel destination"
              >
                <XIcon />
              </button>
            </div>
          )}

          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              영어 회화 연습 시작하기
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              AI 튜터와 대화 연습을 시작할 시나리오를 선택하세요. 여행 준비, 비즈니스 미팅 준비, 또는 단순히 유창함 향상을 원하신다면, 당신을 위한 시나리오가 준비되어 있습니다.
            </p>
          </div>

          <div className="mt-12 md:mt-16 space-y-12">
            {CATEGORIES.map(category => {
                const categoryScenarios = SCENARIOS.filter(s => s.category === category.key);
                return (
                    <div key={category.key}>
                        <div className="mb-6">
                           <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{category.title}</h2>
                           <p className="text-md text-gray-500 dark:text-gray-400 mt-1">{category.description}</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categoryScenarios.map(s => (
                                <ScenarioCard key={s.id} scenario={s} onSelect={onSelectScenario} />
                            ))}
                        </div>
                    </div>
                );
            })}
             <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">다른 연습 방법</h2>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    <ActionCard 
                        title="여행지 특화 모드"
                        emoji="✈️"
                        description="여행할 국가를 선택하고 현지 맞춤형으로 시나리오를 연습하세요."
                        buttonText="국가 선택"
                        buttonClassName="bg-emerald-600 hover:bg-emerald-700"
                        imageUrl="https://images.unsplash.com/photo-1528543606781-2f6e6857f318?q=80&w=800"
                        onClick={() => setIsTravelModalOpen(true)}
                    />
                    <ActionCard 
                        title="직접 만들기"
                        emoji="🪄"
                        description="연습하고 싶은 상황을 설명하여 자신만의 시나리오를 만드세요."
                        buttonText="만들기"
                        buttonClassName="bg-green-600 hover:bg-green-700"
                        imageUrl="https://images.unsplash.com/photo-1456324504439-367cee3b3c32?q=80&w=800&auto=format&fit=crop"
                        onClick={onSelectCreate}
                    />
                    <ActionCard 
                        title="무작위 선택"
                        emoji="🔀"
                        description="어떤 것을 연습할지 모르겠나요? 무작위 시나리오로 도전해보세요."
                        buttonText="선택"
                        buttonClassName="bg-purple-600 hover:bg-purple-700"
                        imageUrl="https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?q=80&w=800&auto=format&fit=crop"
                        onClick={onSelectRandom}
                    />
                    {listeningScenario && (
                        <ScenarioCard scenario={listeningScenario} onSelect={onSelectScenario} />
                    )}
                    <ActionCard 
                        title="주제별 자유 대화"
                        emoji="💬"
                        description="정해진 시나리오 없이 관심 있는 주제에 대해 자유롭게 대화하세요."
                        buttonText="시작"
                        buttonClassName="bg-rose-600 hover:bg-rose-700"
                        imageUrl="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=800&auto=format&fit=crop"
                        onClick={() => setIsFreeChatModalOpen(true)}
                    />
                </div>
            </div>
          </div>
        </div>
      </main>
      {isFreeChatModalOpen && (
        <FreeChatModal 
            onClose={() => setIsFreeChatModalOpen(false)}
            onSelectTopic={(topic) => {
                onSelectFreeChat(topic);
                setIsFreeChatModalOpen(false);
            }}
        />
      )}
      {isTravelModalOpen && (
        <TravelModeModal 
          onClose={() => setIsTravelModalOpen(false)}
          onSelectDestination={handleSelectTravelDestination}
        />
      )}
    </div>
  );
};

export default ScenarioSelectionScreen;