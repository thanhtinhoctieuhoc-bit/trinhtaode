
import React, { useState } from 'react';
import { Exam, StudentSubmission } from '../../types';
import Button from '../ui/Button';

interface StudentFlowProps {
    exam: Exam;
    addSubmission: (submission: StudentSubmission) => void;
}

const StudentFlow: React.FC<StudentFlowProps> = ({ exam, addSubmission }) => {
    const [step, setStep] = useState('info'); // info, exam, result
    const [studentName, setStudentName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [answers, setAnswers] = useState<(number | string)[]>(new Array(exam.questions.length).fill(-1));
    const [finalScore, setFinalScore] = useState(0);
    const [totalPoints, setTotalPoints] = useState(0);

    const handleStartExam = () => {
        if (studentName.trim() && studentClass.trim()) {
            setStep('exam');
        } else {
            alert('Vui lòng nhập đầy đủ Họ tên và Lớp.');
        }
    };

    const handleAnswerChange = (qIndex: number, answer: number | string) => {
        const newAnswers = [...answers];
        newAnswers[qIndex] = answer;
        setAnswers(newAnswers);
    };

    const handleSubmitExam = () => {
        let score = 0;
        const total = exam.questions.reduce((sum, q) => sum + q.points, 0);

        exam.questions.forEach((q, i) => {
            if (q.type === 'multiple-choice' && answers[i] === q.correctAnswerIndex) {
                score += q.points;
            }
        });
        
        const scoreOutOf10 = total > 0 ? (score / total) * 10 : 0;

        const submission: StudentSubmission = {
            id: `sub-${Date.now()}`,
            examId: exam.id,
            studentName,
            studentClass,
            answers,
            score: scoreOutOf10,
            submittedAt: new Date().toISOString(),
            totalPoints: total,
        };

        addSubmission(submission);
        setFinalScore(scoreOutOf10);
        setTotalPoints(total);
        setStep('result');
    };

    if (step === 'info') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-200 p-4">
                <div className="w-full max-w-lg bg-white p-8 md:p-12 rounded-2xl shadow-lg text-center transform transition-all duration-500">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">{exam.title}</h1>
                    <p className="text-gray-600 text-lg mb-8">Lớp: {exam.className}</p>
                    <div className="space-y-6">
                        <input
                            type="text"
                            placeholder="Họ và tên của em"
                            value={studentName}
                            onChange={(e) => setStudentName(e.target.value)}
                            className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all"
                            aria-label="Họ và tên của em"
                        />
                        <input
                            type="text"
                            placeholder="Lớp của em"
                            value={studentClass}
                            onChange={(e) => setStudentClass(e.target.value)}
                            className="w-full p-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 transition-all"
                            aria-label="Lớp của em"
                        />
                    </div>
                    <Button onClick={handleStartExam} className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white text-xl py-4 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                        Bắt đầu làm bài
                    </Button>
                </div>
            </div>
        );
    }

    if (step === 'exam') {
        return (
            <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-2xl">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 text-center">{exam.title}</h1>
                    <p className="text-gray-600 mb-10 text-center">Học sinh: {studentName} - Lớp: {studentClass}</p>
                    
                    <div className="space-y-10">
                        {exam.questions.map((q, i) => (
                            <div key={q.id}>
                                <p className="font-bold text-xl md:text-2xl mb-5 text-slate-800"><span className="text-blue-600">Câu {i + 1}:</span> {q.questionText}</p>
                                {q.image && <img src={q.image} alt="minh họa" className="my-4 rounded-lg max-w-sm mx-auto" />}
                                <div className="space-y-4">
                                    {q.options.map((opt, oIndex) => (
                                        <label key={oIndex} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${answers[i] === oIndex ? 'bg-blue-100 border-blue-500 shadow-md' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300'}`}>
                                            <input
                                                type="radio"
                                                name={`question_${i}`}
                                                className="hidden"
                                                onChange={() => handleAnswerChange(i, oIndex)}
                                                checked={answers[i] === oIndex}
                                            />
                                            <span className={`w-6 h-6 mt-1 mr-4 rounded-full border-2 flex items-center justify-center shrink-0 ${answers[i] === oIndex ? 'border-blue-600 bg-blue-600' : 'border-gray-400'}`}>
                                                {answers[i] === oIndex && <span className="w-2 h-2 rounded-full bg-white"></span>}
                                            </span>
                                            <div className="flex-1">
                                                <span className="text-lg text-gray-700">{opt.text}</span>
                                                {opt.image && <img src={opt.image} alt={`Lựa chọn ${oIndex+1}`} className="mt-3 rounded-lg max-w-full h-auto max-h-60" />}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Button onClick={handleSubmitExam} className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 text-xl rounded-xl shadow-lg transform hover:scale-105 transition-transform">
                            Nộp bài
                        </Button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (step === 'result') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-200 p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <h1 className="text-3xl font-bold text-gray-800 mt-4 mb-2">Hoàn thành bài thi!</h1>
                    <p className="text-lg text-gray-600 mb-6">Chúc mừng {studentName} đã hoàn thành bài kiểm tra.</p>
                    <div className="bg-blue-100 p-6 rounded-lg">
                        <p className="text-xl text-blue-800 font-semibold">Điểm của em là:</p>
                        <p className="text-8xl md:text-9xl font-bold text-blue-600 my-2">{finalScore.toFixed(2)}</p>
                    </div>
                     <button onClick={() => window.location.hash = ''} className="mt-8 text-blue-600 font-semibold hover:underline">
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default StudentFlow;