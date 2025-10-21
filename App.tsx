// Fix: Added full content for App.tsx
import React, { useState, useEffect } from 'react';
import ScenarioSelectionScreen from './components/ScenarioSelectionScreen';
import ChatScreen from './components/ChatScreen';
import CustomScenarioScreen from './components/CustomScenarioScreen';
import ReportScreen from './components/ReportScreen';
import { Scenario, Message, LearningReport } from './types';
import { SCENARIOS } from './constants';
import { createCustomScenario, startChat, generateReport } from './services/geminiService';
import RoleSelectionModal from './components/RoleSelectionModal';

type AppState = 'SELECT_SCENARIO' | 'CREATE_SCENARIO' | 'CHATTING' | 'REPORT';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('SELECT_SCENARIO');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCreatingScenario, setIsCreatingScenario] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [roleSelectionScenario, setRoleSelectionScenario] = useState<Scenario | null>(null);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [report, setReport] = useState<LearningReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const handleStartChat = async (scenario: Scenario, isReversed: boolean) => {
    setRoleSelectionScenario(null);
    setCurrentScenario(scenario);
    try {
        const initialMessage = await startChat(scenario, isReversed);
        setMessages([initialMessage]);
        setAppState('CHATTING');
    } catch (error) {
        console.error("Failed to start chat:", error);
        alert("Sorry, there was an error starting the chat. Please try again.");
        handleBackToSelection();
    }
  }

  const handleSelectScenario = (scenario: Scenario) => {
    if (scenario.scenarioType === 'listening' || scenario.category === '커스텀') {
      // Listening mode and custom scenarios start directly without role selection
      handleStartChat(scenario, false);
    } else {
      setRoleSelectionScenario(scenario);
    }
  };
  
  const handleSelectRandom = () => {
    // Filter out listening scenarios for random selection
    const conversationScenarios = SCENARIOS.filter(s => s.scenarioType === 'conversation');
    const randomIndex = Math.floor(Math.random() * conversationScenarios.length);
    handleSelectScenario(conversationScenarios[randomIndex]);
  };

  const handleSelectCreate = () => {
    setAppState('CREATE_SCENARIO');
  };
  
  const handleSelectFreeChat = async (topic: string) => {
    const prompt = `I want to have a free conversation about "${topic}". The AI should act as a friendly conversation partner.`;
    setIsCreatingScenario(true);
    try {
      const newScenarioData = await createCustomScenario(prompt);
      const newScenario: Scenario = {
        ...newScenarioData,
        scenarioType: 'conversation',
      };
      // Free chat starts directly without role selection
      await handleStartChat(newScenario, false);
    } catch (error) {
      console.error("Failed to create free chat scenario", error);
      alert("Sorry, there was an error starting the free chat. Please try again.");
    } finally {
      setIsCreatingScenario(false);
    }
  };

  const handleCreateScenario = async () => {
    if (!customPrompt.trim()) return;
    setIsCreatingScenario(true);
    try {
      const newScenarioData = await createCustomScenario(customPrompt);
      const newScenario: Scenario = {
        ...newScenarioData,
        scenarioType: 'conversation',
      };
      await handleStartChat(newScenario, false);
    } catch (error) {
      console.error("Failed to create custom scenario", error);
      alert("Sorry, there was an error creating your scenario. Please try again.");
    } finally {
      setIsCreatingScenario(false);
      setCustomPrompt('');
    }
  };
  
  const handleBackToSelection = () => {
    setAppState('SELECT_SCENARIO');
    setCurrentScenario(null);
    setMessages([]);
    setReport(null);
    setReportError(null);
    setRoleSelectionScenario(null);
  };

  const handleFinishSession = async (conversation: Message[]) => {
    setAppState('REPORT');
    setIsGeneratingReport(true);
    setReport(null);
    setReportError(null);
    try {
        if(conversation.length <= 1) {
            throw new Error("The conversation was too short to generate a report.");
        }
        const generatedReport = await generateReport(conversation);
        setReport(generatedReport);
    } catch (error) {
        console.error("Failed to generate report:", error);
        setReportError((error as Error).message || "An unknown error occurred.");
    } finally {
        setIsGeneratingReport(false);
    }
  };

  const renderContent = () => {
    switch (appState) {
      case 'CREATE_SCENARIO':
        return (
          <CustomScenarioScreen
            prompt={customPrompt}
            setPrompt={setCustomPrompt}
            isCreating={isCreatingScenario}
            onCreate={handleCreateScenario}
            onBack={handleBackToSelection}
          />
        );
      case 'CHATTING':
        if (!currentScenario) return null;
        return <ChatScreen scenario={currentScenario} initialMessages={messages} onBack={handleBackToSelection} onFinish={handleFinishSession} />;
      case 'REPORT':
        return <ReportScreen 
                    isGenerating={isGeneratingReport} 
                    report={report}
                    reportError={reportError}
                    onFinish={handleBackToSelection} 
                />;
      case 'SELECT_SCENARIO':
      default:
        return (
          <ScenarioSelectionScreen
            onSelectScenario={handleSelectScenario}
            onSelectRandom={handleSelectRandom}
            onSelectCreate={handleSelectCreate}
            onSelectFreeChat={handleSelectFreeChat}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center font-sans">
      {renderContent()}
      {roleSelectionScenario && (
        <RoleSelectionModal
          scenario={roleSelectionScenario}
          onClose={() => setRoleSelectionScenario(null)}
          onStartChat={handleStartChat}
        />
      )}
    </div>
  );
};

export default App;