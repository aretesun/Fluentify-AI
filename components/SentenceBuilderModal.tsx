import React, { useState, useMemo } from 'react';
import { SentenceBuildingPlan, SentencePartValidation } from '../types';
import { getSentenceBuildingPlan, validateSentencePart } from '../services/geminiService';
import { XIcon, Spinner } from './IconComponents';

interface SentenceBuilderModalProps {
  onClose: () => void;
  onComplete: (sentence: string) => void;
}

type BuilderState = 'IDLE' | 'LOADING_PLAN' | 'VALIDATING' | 'BUILDING' | 'COMPLETE';

const SentenceBuilderModal: React.FC<SentenceBuilderModalProps> = ({ onClose, onComplete }) => {
  const [builderState, setBuilderState] = useState<BuilderState>('IDLE');
  const [koreanPrompt, setKoreanPrompt] = useState('');
  const [plan, setPlan] = useState<SentenceBuildingPlan | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [parts, setParts] = useState<{ [key: string]: string }>({});
  const [currentPartInput, setCurrentPartInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationFeedback, setValidationFeedback] = useState<SentencePartValidation | null>(null);


  const handleStartBuilding = async () => {
    if (!koreanPrompt.trim()) return;
    setBuilderState('LOADING_PLAN');
    setError(null);
    try {
      const newPlan = await getSentenceBuildingPlan(koreanPrompt);
      setPlan(newPlan);
      setBuilderState('BUILDING');
      setCurrentStep(0);
      setParts({});
    } catch (err) {
      console.error("Failed to get sentence building plan:", err);
      setError("문장 계획을 생성하는 데 실패했습니다. 다시 시도해 주세요.");
      setBuilderState('IDLE');
    }
  };
  
  const handleNextStep = async () => {
    if (!plan || !currentPartInput.trim() || builderState === 'VALIDATING') return;
    
    setBuilderState('VALIDATING');
    setValidationFeedback(null);
    const currentBlock = plan.blocks[currentStep];

    try {
        const validation = await validateSentencePart(koreanPrompt, currentBlock, currentPartInput.trim());
        
        if (validation.isValid) {
            const newParts = { ...parts, [currentBlock.part]: validation.suggestion };
            setParts(newParts);
            setCurrentPartInput('');
            
            if (currentStep < plan.blocks.length - 1) {
                setCurrentStep(currentStep + 1);
                setBuilderState('BUILDING');
            } else {
                setBuilderState('COMPLETE');
            }
        } else {
            setValidationFeedback(validation);
            setBuilderState('BUILDING'); // Go back to building state to show feedback
        }

    } catch (err) {
        console.error("Failed to validate sentence part:", err);
        setValidationFeedback({
            isValid: false,
            suggestion: '',
            feedback: "입력을 확인하는 중 오류가 발생했습니다. 다시 시도해 주세요."
        });
        setBuilderState('BUILDING');
    }
  };

  const assembledSentence = useMemo(() => {
    if (!plan || builderState !== 'COMPLETE') return '';
    let sentence = plan.finalSentenceStructure;
    Object.entries(parts).forEach(([key, value]) => {
      sentence = sentence.replace(`{${key}}`, value);
    });
    // Capitalize first letter and add period.
    sentence = sentence.trim();
    if (sentence.length === 0) return '';
    return sentence.charAt(0).toUpperCase() + sentence.slice(1) + '.';
  }, [plan, parts, builderState]);
  
  const handleUseSentence = (sentence: string) => {
    onComplete(sentence);
  };

  const renderContent = () => {
    switch (builderState) {
      case 'IDLE':
      case 'LOADING_PLAN':
        return (
          <>
            <h3 id="sentence-builder-title" className="text-lg font-semibold text-gray-900 dark:text-white">무엇을 말하고 싶으신가요?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">영어로 만들고 싶은 문장을 한국어로 입력해주세요.</p>
            <textarea
              value={koreanPrompt}
              onChange={(e) => setKoreanPrompt(e.target.value)}
              placeholder="예: 카페라떼 한 잔 주세요."
              className="w-full h-24 p-3 mt-4 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white resize-none"
              disabled={builderState === 'LOADING_PLAN'}
              aria-label="Korean sentence prompt"
            />
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleStartBuilding}
                disabled={builderState === 'LOADING_PLAN' || !koreanPrompt.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {builderState === 'LOADING_PLAN' ? <Spinner /> : '시작하기'}
              </button>
            </div>
          </>
        );
      
      case 'VALIDATING':
      case 'BUILDING':
        if (!plan) return null;
        const block = plan.blocks[currentStep];
        return (
          <>
            <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">"{koreanPrompt}"</p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${((currentStep + 1) / plan.blocks.length) * 100}%` }}></div>
                </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{block.question}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">예: "{block.example}"</p>
            <input
              type="text"
              value={currentPartInput}
              onChange={(e) => {
                setCurrentPartInput(e.target.value);
                if (validationFeedback) {
                    setValidationFeedback(null);
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
              placeholder="영어로 입력..."
              className="w-full p-3 mt-4 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              autoFocus
              disabled={builderState === 'VALIDATING'}
            />
            {builderState === 'VALIDATING' && (
                <div className="mt-2 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                    <Spinner /> <span className="ml-2">확인 중...</span>
                </div>
            )}
            {validationFeedback && !validationFeedback.isValid && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded-r-lg">
                    <p className="text-sm text-red-700 dark:text-red-300">{validationFeedback.feedback}</p>
                    {validationFeedback.suggestion && (
                      <p className="text-sm mt-1">
                          <span className="font-semibold">제안:</span> "{validationFeedback.suggestion}"
                      </p>
                    )}
                </div>
            )}
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">만들어지는 문장:</p>
                <p className="text-lg font-mono text-gray-800 dark:text-gray-200 mt-1 min-h-[2rem] flex flex-wrap items-center justify-center">
                    {plan.finalSentenceStructure.split(' ').map((part, index) => {
                       const key = part.replace(/[{}]/g, '');
                       const value = parts[key] || (key === block.part ? `[${currentPartInput || '...'}]` : '[...]');
                       return <span key={index} className="mx-1 inline-block break-words">{value}</span>
                    })}
                </p>
            </div>
             <div className="mt-6 flex justify-end">
                <button
                    onClick={handleNextStep}
                    disabled={!currentPartInput.trim() || builderState === 'VALIDATING'}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {builderState === 'VALIDATING' ? <Spinner/> : (currentStep === plan.blocks.length - 1 ? '완성하기' : '다음')}
                </button>
             </div>
          </>
        );
        
      case 'COMPLETE':
        if (!plan) return null;
        return (
           <>
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400">문장이 완성되었어요!</h3>
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <p className="text-xl font-bold text-green-800 dark:text-green-200 text-center">"{assembledSentence}"</p>
            </div>

            {plan.alternativeSentences && plan.alternativeSentences.length > 0 && (
                 <div className="mt-4">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">다른 표현들:</h4>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                    {plan.alternativeSentences.map((alt, index) => (
                        <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                           "{alt}"
                           <button onClick={() => handleUseSentence(alt)} className="ml-2 text-xs text-blue-500 hover:underline">사용하기</button>
                        </li>
                    ))}
                    </ul>
                 </div>
            )}
            
            <div className="mt-6 flex justify-end gap-3">
                <button
                    onClick={() => handleUseSentence(assembledSentence)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    채팅창에 사용하기
                </button>
             </div>
           </>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sentence-builder-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="text-blue-500">
                <i className="fa-solid fa-hammer text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">문장 조립 도우미</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <XIcon />
            </button>
          </div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default SentenceBuilderModal;