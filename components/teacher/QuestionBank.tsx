
import React, { useState } from 'react';
import { Question } from '../../types';
import { generateQuestions } from '../../services/geminiService';
import Button from '../ui/Button';

interface QuestionBankProps {
    questionBank: Question[];
    setQuestionBank: React.Dispatch<React.SetStateAction<Question[]>>;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questionBank, setQuestionBank }) => {
    const [topic, setTopic] = useState('');
    const [grade, setGrade] = useState('5');
    const [count, setCount] = useState(5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGenerator, setShowGenerator] = useState(false);

    const handleGenerate = async () => {
        if (!topic) {
            setError("Vui lòng nhập chủ đề.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const newQuestions = await generateQuestions(topic, grade, count);
            const fullNewQuestions = newQuestions.map((q, index) => ({
                ...q,
                id: `qb-${Date.now()}-${index}`,
            })) as Question[];
            setQuestionBank(prev => [...prev, ...fullNewQuestions]);
            alert('Tạo câu hỏi thành công!');
            setShowGenerator(false); // Hide form on success
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const removeQuestion = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) {
            setQuestionBank(prev => prev.filter(q => q.id !== id));
        }
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Ngân hàng câu hỏi</h2>
                <Button onClick={() => setShowGenerator(!showGenerator)}>
                    {showGenerator ? 'Đóng' : 'Tạo câu hỏi mới bằng AI'}
                </Button>
            </div>

            {showGenerator && (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-8 transition-all duration-500 ease-in-out">
                    <h3 className="text-xl font-semibold text-blue-800 mb-4">Tạo câu hỏi bằng AI</h3>
                    {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" placeholder="Chủ đề (ví dụ: Lịch sử Việt Nam)" value={topic} onChange={e => setTopic(e.target.value)} className="p-2 border rounded-md bg-white text-gray-900" />
                        <input type="text" placeholder="Lớp (ví dụ: 5)" value={grade} onChange={e => setGrade(e.target.value)} className="p-2 border rounded-md bg-white text-gray-900" />
                        <input type="number" placeholder="Số lượng câu hỏi" value={count} onChange={e => setCount(parseInt(e.target.value))} className="p-2 border rounded-md bg-white text-gray-900" />
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleGenerate} isLoading={isLoading}>Tạo câu hỏi</Button>
                        <Button onClick={() => setShowGenerator(false)} variant="secondary">Hủy</Button>
                    </div>
                </div>
            )}

            <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Danh sách câu hỏi đã lưu ({questionBank.length})</h3>
                {questionBank.length > 0 ? (
                    <ul className="space-y-4">
                        {questionBank.map((q, index) => (
                            <li key={q.id} className="bg-white border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="pr-4">
                                        <p className="font-semibold text-lg text-gray-800">
                                           <span className="text-blue-600">Câu {index + 1}:</span> {q.questionText}
                                        </p>
                                         {q.image && <img src={q.image} alt="Minh họa câu hỏi" className="mt-2 rounded-md max-h-40 border" />}
                                    </div>
                                    <Button onClick={() => removeQuestion(q.id)} variant="danger" className="py-1 px-3 text-sm shrink-0">
                                        Xóa
                                    </Button>
                                </div>
                                <ul className="mt-4 space-y-2 text-gray-700">
                                    {q.options.map((opt, i) => (
                                        <li key={i} className={`flex items-start gap-4 p-2 rounded-md ${i === q.correctAnswerIndex ? 'bg-green-50' : ''}`}>
                                            <span className={`font-semibold ${i === q.correctAnswerIndex ? 'text-green-800' : ''}`}>
                                                {String.fromCharCode(65 + i)}.
                                            </span>
                                            <div className="flex-1">
                                                <p className={`${i === q.correctAnswerIndex ? 'font-bold text-green-800' : ''}`}>
                                                    {opt.text}
                                                </p>
                                                {opt.image && (
                                                    <img src={opt.image} alt="Minh họa" className="mt-2 rounded-md max-h-32 border" />
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        </svg>
                        <p className="mt-2 font-semibold">Chưa có câu hỏi nào trong ngân hàng.</p>
                        <p className="text-sm">Hãy bắt đầu bằng cách tạo câu hỏi mới bằng AI.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionBank;