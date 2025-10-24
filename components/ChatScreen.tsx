// Fix: Added full content for ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Scenario, Message, Role, ListeningState } from '../types';
import { startChat, sendMessage, getCorrection, getListeningStory, evaluateAnswerAndContinueListeningScenario, getContextualHints } from '../services/geminiService';
import ChatBubble from './ChatBubble';
import HintPill from './HintPill';
import { BackIcon, SendIcon, BookOpenIcon, CheckCircleIcon, LightbulbIcon, Spinner, MicrophoneIcon, StopCircleIcon, SpeakerWaveIcon, XIcon, HistoryIcon, DownloadIcon, RefreshIcon, WrenchScrewdriverIcon } from './IconComponents';
import KeyPhrasesModal from './KeyPhrasesModal';
import SentenceBuilderModal from './SentenceBuilderModal';

// Extend window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Helper component for the microphone permission modal
const MicrophonePermissionModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-permission-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
            <div className="text-red-500 mb-4">
                <i className="fa-solid fa-microphone-slash text-5xl"></i>
            </div>
            <h2 id="mic-permission-title" className="text-xl font-bold text-gray-900 dark:text-white">마이크 접근이 차단됨</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                음성 입력을 사용하려면 마이크 접근 권한이 필요합니다. 브라우저 설정에서 이 사이트에 대한 마이크 접근을 허용해주세요.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                주소창의 자물쇠 <i className="fa-solid fa-lock text-xs"></i> 아이콘을 클릭하여 사이트 설정에서 권한을 변경할 수 있습니다.
            </p>
          <div className="mt-6">
            <button
              onClick={onClose}
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
            >
              알겠습니다
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExitConfirmationModal: React.FC<{ onConfirm: () => void; onCancel: () => void }> = ({ onConfirm, onCancel }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-confirm-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
            <div className="text-amber-500 mb-4">
                <i className="fa-solid fa-triangle-exclamation text-5xl"></i>
            </div>
            <h2 id="exit-confirm-title" className="text-xl font-bold text-gray-900 dark:text-white">대화 종료 확인</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                시나리오 선택 화면으로 돌아가시겠습니까? 현재 대화 내용은 저장되지 않습니다.
            </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={onCancel}
              className="w-full bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="w-full bg-red-600 text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


interface HistoryModalProps {
  scenario: Scenario;
  messages: Message[];
  isLoading: boolean;
  onClose: () => void;
  onPlayAudio: (messageId: number, text: string) => void;
  currentlyPlayingAudioId: number | null;
  aiTutorName: string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ scenario, messages, isLoading, onClose, onPlayAudio, currentlyPlayingAudioId, aiTutorName }) => {
  const historyEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleDownload = () => {
    const conversationText = messages.map(msg => {
      const prefix = msg.role === Role.USER ? 'You' : aiTutorName;
      return `${prefix}: ${msg.text}`;
    }).join('\n\n');

    const blob = new Blob([conversationText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fluentify-conversation-${scenario.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl h-[80vh] flex flex-col transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h2 id="history-title" className="text-xl font-bold text-gray-900 dark:text-white">Conversation History</h2>
              <button
                  onClick={handleDownload}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Download conversation"
                  title="Download conversation"
                >
                  <DownloadIcon />
                </button>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <XIcon />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map(msg => (
            <ChatBubble key={msg.id} message={msg} aiTutorName={aiTutorName} onPlayAudio={onPlayAudio} currentlyPlayingAudioId={currentlyPlayingAudioId} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200/50 dark:border-gray-700/50 rounded-lg p-4 max-w-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url("https://picsum.photos/seed/ai-avatar/100/100")` }}></div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Spinner />
                    <span>{aiTutorName} is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={historyEndRef} />
        </div>
      </div>
    </div>
  );
};

interface ChatScreenProps {
  scenario: Scenario;
  isRoleReversed: boolean;
  onBack: () => void;
  onFinish: (conversation: Message[]) => void;
  travelDestination: string | null;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ scenario, isRoleReversed, onBack, onFinish, travelDestination }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isKeyPhrasesModalOpen, setIsKeyPhrasesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [listeningState, setListeningState] = useState<ListeningState>(
    scenario.scenarioType === 'listening' ? ListeningState.READY_TO_LISTEN : ListeningState.FINISHED // Use FINISHED to bypass for non-listening
  );
  
  const [isListening, setIsListening] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [isAwaitingRetry, setIsAwaitingRetry] = useState(false);
  
  const [contextualHints, setContextualHints] = useState<string[]>(() => scenario.keyPhrases.map(kp => kp.phrase));
  const [isFetchingHints, setIsFetchingHints] = useState(false);

  const recognitionRef = useRef<any | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [currentlyPlayingAudioId, setCurrentlyPlayingAudioId] = useState<number | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const [dynamicAiTutorName, setDynamicAiTutorName] = useState(scenario.aiTutorName);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);
  
  const playSsmlText = (ssml: string, onEnd: () => void) => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
  
    // Simple handling for emphasis tags by just removing them, focusing on prosody.
    let textToParse = ssml.replace(/<\/?speak>/g, '').replace(/<\/?emphasis>/g, '');
    const segments: { text: string; rate?: string; pitch?: string }[] = [];
  
    while (textToParse.length > 0) {
      const prosodyStart = textToParse.indexOf('<prosody');
      if (prosodyStart === 0) {
        const prosodyEndTag = '</prosody>';
        const prosodyEnd = textToParse.indexOf(prosodyEndTag);
        if (prosodyEnd === -1) { // Malformed SSML, treat rest as plain text
            if (textToParse.trim()) segments.push({ text: textToParse });
            break;
        }
        const tagPart = textToParse.substring(0, prosodyEnd + prosodyEndTag.length);
        const contentMatch = tagPart.match(/<prosody[^>]*>(.*?)<\/prosody>/s);
        if (contentMatch) {
          const text = contentMatch[1].trim();
          if (text) {
              const rateMatch = tagPart.match(/rate=['"]([^'"]*)['"]/);
              const pitchMatch = tagPart.match(/pitch=['"]([^'"]*)['"]/);
              segments.push({
                text,
                rate: rateMatch ? rateMatch[1] : undefined,
                pitch: pitchMatch ? pitchMatch[1] : undefined
              });
          }
        }
        textToParse = textToParse.substring(prosodyEnd + prosodyEndTag.length);
      } else {
        const nextTagIndex = prosodyStart > -1 ? prosodyStart : textToParse.length;
        const textPart = textToParse.substring(0, nextTagIndex);
        if (textPart.trim()) {
            segments.push({ text: textPart });
        }
        textToParse = textToParse.substring(nextTagIndex);
      }
    }
  
    const utterances = segments.map((segment, index) => {
      const utterance = new SpeechSynthesisUtterance(segment.text);
      if (selectedVoice) utterance.voice = selectedVoice;
      if (segment.rate) {
        switch(segment.rate) {
          case 'slow': utterance.rate = 0.8; break;
          case 'fast': utterance.rate = 1.3; break;
          default: utterance.rate = 1;
        }
      }
      if (segment.pitch) {
        switch(segment.pitch) {
          case 'low': utterance.pitch = 0.8; break;
          case 'high': utterance.pitch = 1.2; break;
          default: utterance.pitch = 1;
        }
      }
      if (index === segments.length - 1) {
        utterance.onend = onEnd;
      }
      return utterance;
    });

    if (utterances.length > 0) {
        utterances.forEach(utt => speechSynthesis.speak(utt));
    } else {
        // If parsing fails, fall back to playing the cleaned text
        const cleanText = ssml.replace(/<[^>]+>/g, '');
        const fallbackUtterance = new SpeechSynthesisUtterance(cleanText);
        if (selectedVoice) fallbackUtterance.voice = selectedVoice;
        fallbackUtterance.onend = onEnd;
        speechSynthesis.speak(fallbackUtterance);
    }
  };

  const handlePlayAudio = (messageId: number, text: string, forcePlay = false) => {
    if (!forcePlay && currentlyPlayingAudioId === messageId) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        setCurrentlyPlayingAudioId(null);
    } else {
      if ('speechSynthesis' in window) {
        setCurrentlyPlayingAudioId(messageId);
        const onEndCallback = () => setCurrentlyPlayingAudioId(null);
        
        if (text.includes('<speak>')) {
          playSsmlText(text, onEndCallback);
        } else {
          speechSynthesis.cancel();
          const simpleUtterance = new SpeechSynthesisUtterance(text);
          if (selectedVoice) simpleUtterance.voice = selectedVoice;
          simpleUtterance.onend = onEndCallback;
          speechSynthesis.speak(simpleUtterance);
        }
      } else {
        alert("Your browser does not support text-to-speech.");
        setCurrentlyPlayingAudioId(null);
      }
    }
  };

  useEffect(() => {
    const initializeChat = async () => {
      setIsInitializing(true);
      try {
        const initialMessage = await startChat(scenario, isRoleReversed, travelDestination);
        setMessages([initialMessage]);
        
        if (initialMessage.extractedName) {
          setDynamicAiTutorName(initialMessage.extractedName);
        }
        
        handlePlayAudio(initialMessage.id, initialMessage.text, true);

      } catch (error) {
        console.error("Failed to start chat:", error);
        setMessages([{
          id: Date.now(),
          role: Role.AI,
          text: "죄송합니다, 대화를 시작하는 중 오류가 발생했습니다. 뒤로 가서 다시 시도해 주세요.",
        }]);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeChat();
    // This effect should only run when the scenario changes, not when other state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario, isRoleReversed, travelDestination]);

  useEffect(() => {
    const scoreVoice = (voice: SpeechSynthesisVoice) => {
      let score = 0;
      if (voice.lang === 'en-US') {
        score += 10;
        if (!voice.localService) score += 5; // Prefer network voices
        if (voice.name.toLowerCase().includes('google')) score += 5; // Prefer Google voices
      } else if (voice.lang.startsWith('en-')) {
        score += 1; // Lower score for other English variants
      }
      return score;
    };

    const loadAndSelectVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const bestVoice = voices
          .filter(v => v.lang.startsWith('en-'))
          .reduce((best, current) => {
            return scoreVoice(current) > scoreVoice(best) ? current : best;
          }, voices[0]);

        setSelectedVoice(bestVoice || null);
      }
    };
    
    loadAndSelectVoice();
    if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = loadAndSelectVoice;
    }
  }, []);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setUserInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        if(event.error === 'not-allowed') {
            setMicPermissionDenied(true);
            setShowPermissionModal(true);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);
  
  const handleMicClick = () => {
    if (micPermissionDenied) {
      setShowPermissionModal(true);
      return;
    }
    
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      setUserInput('');
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const handleStartListening = async () => {
    setIsLoading(true);
    setListeningState(ListeningState.LISTENING);
    try {
        const storyText = await getListeningStory();
        const storyMessage: Message = {
            id: Date.now(),
            role: Role.AI,
            text: `(Story) ${storyText}`,
        };
        const firstQuestion = await sendMessage("Please ask the first question now.");
        const questionMessage: Message = {
            id: Date.now() + 1,
            role: Role.AI,
            text: firstQuestion,
        };
        setMessages(prev => [...prev, storyMessage, questionMessage]);
        setListeningState(ListeningState.WAITING_FOR_ANSWER);
    } catch (error) {
        console.error("Error starting listening mode:", error);
        // Handle error state
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendListeningAnswer = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading) return;

    const userMessage: Message = { id: Date.now(), role: Role.USER, text: trimmedInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setListeningState(ListeningState.EVALUATING);
    
    try {
        const result = await evaluateAnswerAndContinueListeningScenario(messages, trimmedInput);
        
        const feedbackMessage: Message = {
            id: Date.now() + 1,
            role: Role.AI,
            text: result.feedback,
        };
        const nextQuestionMessage: Message = {
            id: Date.now() + 2,
            role: Role.AI,
            text: result.next_question,
        };

        setMessages(prev => [...prev, feedbackMessage, nextQuestionMessage]);

        if (result.is_finished) {
            setListeningState(ListeningState.FINISHED);
        } else {
            setListeningState(ListeningState.WAITING_FOR_ANSWER);
        }
    } catch (error) {
        console.error("Error evaluating answer:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSendConversationMessage = async () => {
    const trimmedInput = userInput.trim();
    if (!trimmedInput || isLoading || isInitializing) return;
  
    const userMessage: Message = { id: Date.now(), role: Role.USER, text: trimmedInput };
    const messagesWithUser = [...messages, userMessage];
    setMessages(messagesWithUser);
    setUserInput('');
    setIsLoading(true);
  
    try {
      const correction = await getCorrection(trimmedInput);
  
      // If a correction is found (for either Korean input or incorrect English),
      // update the message bubble with feedback and wait for the user to try again.
      if (correction) {
        setMessages(prev => prev.map(msg => (msg.id === userMessage.id ? { ...msg, correction } : msg)));
        setIsAwaitingRetry(true);
        setIsLoading(false);
        return; // Stop here and wait for corrected input.
      }
      
      // If no correction was needed, or if this is the user's retry, reset the flag and proceed.
      if (isAwaitingRetry) {
        setIsAwaitingRetry(false);
      }
      
      const aiResponse = await sendMessage(trimmedInput);
      const aiMessage: Message = { id: Date.now() + 1, role: Role.AI, text: aiResponse };
      const updatedConversation = [...messagesWithUser, aiMessage];
      setMessages(updatedConversation);

    } catch (error) {
      console.error("Error sending message:", error);
      setIsAwaitingRetry(false);
      const errorMessage: Message = { id: Date.now() + 1, role: Role.AI, text: "I'm sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestHints = async () => {
    setIsFetchingHints(true);
    try {
        const hints = await getContextualHints(messages, scenario);
        if (hints && hints.length > 0) {
            setContextualHints(hints);
        }
    } catch (hintError) {
        console.error("Failed to fetch hints:", hintError);
        // On error, do not change the hints to avoid a jarring user experience.
    } finally {
        setIsFetchingHints(false);
    }
  };


  const handleSendMessage = () => {
    if (scenario.scenarioType === 'listening') {
      handleSendListeningAnswer();
    } else {
      handleSendConversationMessage();
    }
  };
  
  const handleHintClick = (hint: string) => {
    setUserInput(prev => prev ? `${prev} ${hint}` : hint);
  };
  
  const handleSentenceBuilt = (sentence: string) => {
    setUserInput(sentence);
    setIsBuilderModalOpen(false);
  };

  const renderConversationFooter = () => (
     <div className="max-w-4xl mx-auto">
        {isAwaitingRetry && (
            <div className="mb-2 text-center p-2 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm font-semibold">
                피드백을 참고하여 영어로 다시 말해보세요!
            </div>
        )}
        {!isAwaitingRetry && (
            <div className="mb-3 flex items-center gap-2 flex-wrap min-h-[28px]">
                <LightbulbIcon/>
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Hints:</span>
                {contextualHints.map(hint => (
                    <HintPill key={hint} hint={hint} onClick={handleHintClick} />
                ))}
                <button 
                    onClick={handleRequestHints} 
                    disabled={isFetchingHints || isLoading || isInitializing}
                    className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Get new hints"
                    title="Get new hints"
                >
                    {isFetchingHints ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div> : <RefreshIcon />}
                </button>
            </div>
        )}
        <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <button
                onClick={() => setIsBuilderModalOpen(true)}
                disabled={isLoading || isInitializing}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0 disabled:opacity-50"
                aria-label="Sentence Builder"
                title="Sentence Builder"
            >
                <WrenchScrewdriverIcon />
            </button>
            <textarea
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                    }
                }}
                placeholder={isAwaitingRetry ? "추천 표현을 영어로 입력해보세요..." : (isListening ? "Listening..." : "Type or use the mic to talk...")}
                className="w-full bg-transparent focus:outline-none resize-none px-2 py-1 text-gray-900 dark:text-white"
                rows={1}
                disabled={isLoading || isInitializing}
            />
             <button
                onClick={handleMicClick}
                disabled={isLoading || isInitializing || !recognitionRef.current}
                className={`p-2 rounded-full text-white transition-colors shrink-0 ${
                    isListening ? 'bg-red-500 animate-pulse' : micPermissionDenied ? 'bg-gray-500 cursor-help' : 'bg-blue-600'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                aria-label={micPermissionDenied ? "Microphone permission denied" : (isListening ? "Stop recording" : "Start recording")}
                title={micPermissionDenied ? "마이크 접근이 차단되었습니다. 클릭하여 도움말을 보세요." : (isListening ? "녹음 중지" : "음성으로 입력")}
            >
                {isListening ? <StopCircleIcon /> : <MicrophoneIcon />}
            </button>
            <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading || isInitializing} className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shrink-0">
                {isLoading ? <Spinner /> : <SendIcon />}
            </button>
        </div>
    </div>
  );

  const renderListeningFooter = () => {
    switch(listeningState) {
        case ListeningState.READY_TO_LISTEN:
            return (
                <div className="max-w-4xl mx-auto text-center">
                    <button onClick={handleStartListening} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors">
                        이야기 듣기 시작
                    </button>
                </div>
            );
        case ListeningState.LISTENING:
            return (
                <div className="max-w-4xl mx-auto text-center text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3">
                    <SpeakerWaveIcon />
                    <span>이야기를 듣는 중...</span>
                </div>
            );
        case ListeningState.WAITING_FOR_ANSWER:
        case ListeningState.EVALUATING:
             return (
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                        <textarea
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="들은 내용에 대해 답변하세요..."
                            className="w-full bg-transparent focus:outline-none resize-none px-2 py-1 text-gray-900 dark:text-white"
                            rows={1}
                            disabled={isLoading || listeningState === ListeningState.EVALUATING}
                        />
                        <button onClick={handleSendMessage} disabled={!userInput.trim() || isLoading || listeningState === ListeningState.EVALUATING} className="p-2 rounded-full bg-blue-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shrink-0">
                            {isLoading ? <Spinner /> : <SendIcon />}
                        </button>
                    </div>
                </div>
             );
        case ListeningState.FINISHED:
             return (
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">듣기 연습이 끝났습니다! 결과를 분석해보세요.</p>
                    <button onClick={() => onFinish(messages)} className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-colors">
                        세션 분석하기
                    </button>
                </div>
             );
    }
  };
  
  return (
    <div 
      className="relative h-full w-full bg-center bg-no-repeat bg-cover" 
      style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${scenario.chatBackgroundImageUrl || scenario.imageUrl})` }}
    >
      <div className="absolute inset-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md"></div>
      <div className="relative h-full w-full flex flex-col">
        <header className="flex-shrink-0 z-10 w-full bg-background-light/70 dark:bg-background-dark/70 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
                <button onClick={() => setShowExitConfirmModal(true)} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:white">
                    <BackIcon />
                    뒤로
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">{scenario.title}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{scenario.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setIsKeyPhrasesModalOpen(true)}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="View key phrases"
                        title="View key phrases"
                    >
                        <BookOpenIcon />
                    </button>
                    <button 
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        aria-label="View full conversation"
                        title="View full conversation"
                    >
                        <HistoryIcon />
                    </button>
                </div>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
                {isInitializing ? (
                    <div className="flex flex-col items-center justify-center pt-20 text-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                        <p className="mt-4 text-gray-600 dark:text-gray-300">
                            AI 튜터가 인사를 준비하고 있습니다...
                        </p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} aiTutorName={dynamicAiTutorName} onPlayAudio={(id, text) => handlePlayAudio(id, text, false)} currentlyPlayingAudioId={currentlyPlayingAudioId} />
                    ))
                )}
                {isLoading && (
                   <div className="flex justify-start">
                        <div className="bg-background-light dark:bg-background-dark border border-background-dark/10 dark:border-background-light/10 rounded-lg p-4 max-w-2xl">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url("https://picsum.photos/seed/ai-avatar/100/100")` }}></div>
                                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                    <Spinner />
                                    <span>{dynamicAiTutorName} is thinking...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
        </main>
        
        <footer className="flex-shrink-0 z-10 w-full bg-background-light/70 dark:bg-background-dark/70 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 p-4">
            {scenario.scenarioType === 'listening' ? renderListeningFooter() : renderConversationFooter()}
        </footer>

        {isKeyPhrasesModalOpen && <KeyPhrasesModal scenario={scenario} onClose={() => setIsKeyPhrasesModalOpen(false)} />}
        {isHistoryModalOpen && <HistoryModal scenario={scenario} messages={messages} isLoading={isLoading} onClose={() => setIsHistoryModalOpen(false)} onPlayAudio={(id, text) => handlePlayAudio(id, text, false)} currentlyPlayingAudioId={currentlyPlayingAudioId} aiTutorName={dynamicAiTutorName} />}
        {isBuilderModalOpen && <SentenceBuilderModal onClose={() => setIsBuilderModalOpen(false)} onComplete={handleSentenceBuilt}/>}
        {showPermissionModal && <MicrophonePermissionModal onClose={() => setShowPermissionModal(false)} />}
        {showExitConfirmModal && <ExitConfirmationModal onConfirm={onBack} onCancel={() => setShowExitConfirmModal(false)} />}
        
        {scenario.scenarioType !== 'listening' && listeningState === ListeningState.FINISHED && !isInitializing && (
          <div className="absolute bottom-24 right-4 z-20">
            <button onClick={() => onFinish(messages)} className="bg-green-500 text-white font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-600 transition-transform hover:scale-105 flex items-center gap-3">
              <CheckCircleIcon />
              세션 분석하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatScreen;