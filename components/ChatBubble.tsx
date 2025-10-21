import React from 'react';
import { Message, Role } from '../types';
import { SpeakerIcon, SpeakerWaveIcon } from './IconComponents';

interface ChatBubbleProps {
  message: Message;
  aiTutorName: string;
  onPlayAudio: (messageId: number, text: string) => void;
  currentlyPlayingAudioId: number | null;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, aiTutorName, onPlayAudio, currentlyPlayingAudioId }) => {
  const isUser = message.role === Role.USER;

  // Helper to remove SSML tags for display
  const cleanTextForDisplay = (text: string) => {
    return text.replace(/<[^>]+>/g, '');
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-4 max-w-2xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url("https://picsum.photos/seed/user-avatar/100/100")`}}></div>
            <div className="flex-grow">
              <p className="font-bold text-background-dark dark:text-background-light">You</p>
              <p className="text-lg text-background-dark/80 dark:text-background-light/80">{message.text}</p>
            </div>
          </div>
          {message.correction && (
            <div className="mt-4 pt-4 border-t border-primary/20">
              <h4 className="font-bold text-sm text-green-600 dark:text-green-400 mb-2">피드백</h4>
              {message.correction.isTranslationSuggestion ? (
                <>
                  <p className="text-sm text-background-dark/80 dark:text-background-light/80">
                    <span className="font-semibold text-gray-500 dark:text-gray-400">나의 한국어 입력:</span> "{message.correction.original}"
                  </p>
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">추천 표현 및 문장 만들기 가이드:</p>
                    <div className="text-base font-medium text-green-700 dark:text-green-300 p-3 bg-green-50 dark:bg-green-900/30 rounded-md mt-1">
                        <p>"{message.correction.suggestions[0].suggestion}"</p>
                        <p className="mt-2 text-xs text-background-dark/60 dark:text-background-light/60 whitespace-pre-wrap font-normal">
                            {message.correction.suggestions[0].explanation}
                        </p>
                    </div>
                  </div>
                   {message.correction.suggestions.length > 1 && (
                    <div className="mt-3">
                        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">다른 자연스러운 표현:</p>
                        {message.correction.suggestions.slice(1).map((sugg, index) => (
                            <p key={index} className="text-base font-medium text-blue-700 dark:text-blue-300 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-md mt-1">
                                "{sugg.suggestion}"
                            </p>
                        ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {message.correction.suggestions.length > 0 && (
                    <>
                      <p className="text-sm text-background-dark/80 dark:text-background-light/80">
                        <span className="line-through text-red-500">{message.correction.original}</span><br/>
                        <span className="text-green-600 dark:text-green-400">{message.correction.suggestions[0].suggestion}</span>
                      </p>
                      <p className="mt-2 text-xs text-background-dark/60 dark:text-background-light/60 whitespace-pre-wrap">
                        {message.correction.suggestions[0].explanation}
                      </p>
                    </>
                  )}
                  {(message.correction.toneFeedback || message.correction.formalityFeedback || message.correction.culturalNote || message.correction.idiomSuggestion) && (
                    <div className="mt-3 space-y-2">
                      {message.correction.toneFeedback && (
                        <div className="text-xs flex items-start">
                          <span className="font-semibold text-sky-600 dark:text-sky-400 shrink-0"><i className="fa-solid fa-comments mr-2"></i>어조 피드백:</span>
                          <span className="ml-1 text-background-dark/70 dark:text-background-light/70">{message.correction.toneFeedback}</span>
                        </div>
                      )}
                      {message.correction.formalityFeedback && (
                         <div className="text-xs flex items-start">
                            <span className="font-semibold text-amber-600 dark:text-amber-400 shrink-0"><i className="fa-solid fa-handshake mr-2"></i>격식 피드백:</span>
                            <span className="ml-1 text-background-dark/70 dark:text-background-light/70">{message.correction.formalityFeedback}</span>
                        </div>
                      )}
                      {message.correction.culturalNote && (
                        <div className="text-xs flex items-start">
                            <span className="font-semibold text-teal-600 dark:text-teal-400 shrink-0"><i className="fa-solid fa-earth-americas mr-2"></i>문화 노트:</span>
                            <span className="ml-1 text-background-dark/70 dark:text-background-light/70">{message.correction.culturalNote}</span>
                        </div>
                      )}
                      {message.correction.idiomSuggestion && (
                        <div className="text-xs flex items-start">
                            <span className="font-semibold text-purple-600 dark:text-purple-400 shrink-0"><i className="fa-solid fa-wand-magic-sparkles mr-2"></i>원어민처럼:</span>
                            <div className="ml-1 text-background-dark/70 dark:text-background-light/70">
                                <p className="font-medium">"{message.correction.idiomSuggestion.phrase}"</p>
                                <p className="text-xs">({message.correction.idiomSuggestion.meaning})</p>
                            </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // AI Bubble
  const isPlaying = currentlyPlayingAudioId === message.id;
  return (
    <div className="flex justify-start">
        <div className="bg-background-light dark:bg-background-dark border border-background-dark/10 dark:border-background-light/10 rounded-lg p-4 max-w-2xl">
             <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-cover bg-center shrink-0" style={{ backgroundImage: `url("https://picsum.photos/seed/ai-avatar/100/100")` }}></div>
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-background-dark dark:text-background-light">{aiTutorName}</p>
                      {message.text && (
                          <button
                          onClick={() => onPlayAudio(message.id, message.text)}
                          className={`p-1 rounded-full transition-colors ${
                            isPlaying 
                            ? 'text-primary' 
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          aria-label={isPlaying ? "Stop audio" : "Play audio for this message"}
                          >
                          {isPlaying ? <SpeakerWaveIcon /> : <SpeakerIcon />}
                          </button>
                      )}
                    </div>
                    <p className="mt-1 text-lg text-background-dark/80 dark:text-background-light/80 whitespace-pre-wrap">{cleanTextForDisplay(message.text)}</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ChatBubble;