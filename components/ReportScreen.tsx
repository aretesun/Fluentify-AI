import React from 'react';
import { LearningReport } from '../types';
import { Spinner } from './IconComponents';

interface ReportScreenProps {
    isGenerating: boolean;
    report: LearningReport | null;
    reportError: string | null;
    onFinish: () => void;
}

const ReportScreen: React.FC<ReportScreenProps> = ({ isGenerating, report, reportError, onFinish }) => {
    
    const renderContent = () => {
        if (isGenerating) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <Spinner />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Analyzing your conversation...</p>
                </div>
            );
        }

        if (reportError) {
            return (
                <div className="text-center h-64 flex flex-col justify-center items-center">
                    <i className="fa-solid fa-circle-exclamation text-4xl text-red-500 mb-4"></i>
                    <p className="text-red-500 font-semibold">Could not generate a report.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{reportError}</p>
                </div>
            );
        }

        if (!report) {
            return (
                <div className="text-center h-64 flex flex-col justify-center items-center">
                    <i className="fa-solid fa-circle-exclamation text-4xl text-red-500 mb-4"></i>
                    <p className="text-red-500 font-semibold">Could not generate a report for this session.</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">An error may have occurred, or the conversation was too short.</p>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Progress Summary</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-around text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl gap-6">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Fluency Score</p>
                            <p className="text-5xl font-bold text-blue-500">{report.fluencyScore}<span className="text-2xl text-gray-400">/100</span></p>
                        </div>
                        <div className="w-full sm:w-px h-px sm:h-16 bg-gray-200 dark:bg-gray-600"></div>
                        <div className="max-w-md">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Feedback</p>
                            <p className="text-md font-semibold text-gray-700 dark:text-gray-200 italic">"{report.positiveFeedback}"</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Key Corrections</h3>
                    {report.keyCorrections.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-700 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 rounded-l-lg">Your Sentence</th>
                                        <th scope="col" className="px-6 py-3">Suggestion</th>
                                        <th scope="col" className="px-6 py-3 rounded-r-lg">Explanation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.keyCorrections.map((c, i) => (
                                        <tr key={i} className="border-b border-gray-200 dark:border-gray-700">
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 italic">"{c.original}"</td>
                                            <td className="px-6 py-4 text-gray-900 dark:text-white font-medium italic">"{c.suggestion}"</td>
                                            <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{c.explanation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : <p className="text-sm text-gray-500 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">No key corrections to show. Great job!</p>}
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">New Vocabulary</h3>
                        {report.newVocabulary.length > 0 ? (
                            <ul className="space-y-3">
                                {report.newVocabulary.map((v, i) => (
                                <li key={i} className="text-sm p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                    <span className="font-bold text-indigo-800 dark:text-indigo-300">{v.word}:</span> <span className="text-gray-700 dark:text-gray-300">{v.definition}</span>
                                </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500 dark:text-gray-400">No new vocabulary to show.</p>}
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl border border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Next Steps</h3>
                        <p className="text-gray-600 dark:text-gray-400">{report.nextSteps}</p>
                    </div>
                </div>

            </div>
        );
    }
    
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Session Report</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Here's a summary of your conversation practice.</p>
                    </div>
                    
                    {renderContent()}

                    <div className="mt-10 text-center">
                        <button 
                            onClick={onFinish} 
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                        >
                            Finish & Practice Again
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportScreen;