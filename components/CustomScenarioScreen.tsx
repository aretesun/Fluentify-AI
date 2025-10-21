import React from 'react';
import { BackIcon, Spinner } from './IconComponents';

interface CustomScenarioScreenProps {
    prompt: string;
    setPrompt: (value: string) => void;
    isCreating: boolean;
    onCreate: () => void;
    onBack: () => void;
}

const CustomScenarioScreen: React.FC<CustomScenarioScreenProps> = ({ prompt, setPrompt, isCreating, onCreate, onBack}) => {
    return (
        <div className="w-full max-w-2xl mx-auto p-4 md:p-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                <div className="text-center">
                    <div className="text-green-500 dark:text-green-400 mb-4">
                    <i className="fa-solid fa-wand-magic-sparkles text-5xl"></i>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">사용자 시나리오 만들기</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">연습하고 싶은 상황을 설명하세요. 예: "가게에 불량품을 반품하는 상황을 연습하고 싶어요."</p>
                </div>
                <div className="mt-8">
                    <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="여기에 시나리오를 설명하세요..."
                    className="w-full h-32 p-4 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-white resize-none"
                    disabled={isCreating}
                    aria-label="Custom scenario description"
                    />
                </div>
                <div className="mt-6 flex justify-between items-center">
                    <button 
                        onClick={onBack} 
                        className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"
                        disabled={isCreating}
                    >
                        <BackIcon />
                        시나리오로 돌아가기
                    </button>
                    <button
                        onClick={onCreate}
                        disabled={isCreating || !prompt.trim()}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {isCreating ? <Spinner /> : '생성 및 시작'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomScenarioScreen;