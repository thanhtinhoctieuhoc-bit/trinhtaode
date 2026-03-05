
import React, { useState, useEffect, useCallback } from 'react';
import Home from './components/Home';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import StudentFlow from './components/student/StudentFlow';
import { Exam, StudentSubmission, Question, decodeData } from './types';

const App: React.FC = () => {
    const [view, setView] = useState('home');
    const [examId, setExamId] = useState<string | null>(null);
    const [directExam, setDirectExam] = useState<Exam | null>(null); // State to hold directly imported exam

    const [exams, setExams] = useState<Exam[]>(() => {
        try {
            const savedExams = localStorage.getItem('exams');
            return savedExams ? JSON.parse(savedExams) : [];
        } catch (error) {
            console.error("Error loading exams from localStorage", error);
            return [];
        }
    });

    const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
         try {
            const savedSubmissions = localStorage.getItem('submissions');
            return savedSubmissions ? JSON.parse(savedSubmissions) : [];
        } catch (error) {
            console.error("Error loading submissions from localStorage", error);
            return [];
        }
    });

    const [questionBank, setQuestionBank] = useState<Question[]>(() => {
        try {
           const savedBank = localStorage.getItem('questionBank');
           return savedBank ? JSON.parse(savedBank) : [];
       } catch (error) {
           console.error("Error loading question bank from localStorage", error);
           return [];
       }
   });

    useEffect(() => {
        try {
            localStorage.setItem('exams', JSON.stringify(exams));
        } catch (error) {
            console.error("Error saving exams to localStorage", error);
        }
    }, [exams]);

    useEffect(() => {
        try {
            localStorage.setItem('submissions', JSON.stringify(submissions));
        } catch (error) {
            console.error("Error saving submissions to localStorage", error);
        }
    }, [submissions]);

    useEffect(() => {
        try {
            localStorage.setItem('questionBank', JSON.stringify(questionBank));
        } catch (error) {
            console.error("Error saving question bank to localStorage", error);
        }
    }, [questionBank]);

    const navigate = useCallback((path: string) => {
        window.location.hash = path;
    }, []);

    const handleHashChange = useCallback(async () => {
        const hash = window.location.hash.slice(1);
        const parts = hash.split('/');
        
        if (parts[0] === 'student' && parts[1] === 'import' && parts[2]) {
            const importedExam = await decodeData<Exam>(parts[2]);
            if (importedExam) {
                setExams(prevExams => {
                    const examExists = prevExams.some(e => e.id === importedExam.id);
                    return examExists ? prevExams : [...prevExams, importedExam];
                });
                setDirectExam(importedExam); // Set exam for immediate use
                setView('student');
                // Navigate to clean the URL, but view is already set. The next hashchange will be handled, but we have directExam to render the UI correctly.
                navigate(`student/exam/${importedExam.id}`);
            } else {
                alert("Đường link bài thi không hợp lệ hoặc đã bị hỏng. Đang quay về trang chủ.");
                navigate('');
            }
        } else if (parts[0] === 'student' && parts[1] === 'exam' && parts[2]) {
            setExamId(parts[2]);
            setView('student');
        } else if (parts[0] === 'teacher') {
            setView('teacher');
            setDirectExam(null);
            setExamId(null);
        } else {
            setView('home');
            setDirectExam(null);
            setExamId(null);
        }
    }, [navigate]);

    useEffect(() => {
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange(); // Initial check

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [handleHashChange]);

    const addExam = (exam: Exam) => {
        setExams(prev => [...prev, exam]);
    };

    const addSubmission = (submission: StudentSubmission) => {
        setSubmissions(prev => [...prev, submission]);
    };

    const renderContent = () => {
        switch (view) {
            case 'teacher':
                return <TeacherDashboard 
                            exams={exams} 
                            setExams={setExams}
                            submissions={submissions}
                            addExam={addExam}
                            questionBank={questionBank}
                            setQuestionBank={setQuestionBank}
                            onNavigateHome={() => navigate('')} />;
            case 'student':
                // Prioritize the directly loaded exam, then fall back to finding by ID
                const examToTake = directExam || exams.find(e => e.id === examId);
                if (examToTake) {
                    return <StudentFlow exam={examToTake} addSubmission={addSubmission} />;
                }
                return (
                    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
                        <h2 className="text-3xl font-bold text-red-500 mb-4">Không tìm thấy bài thi</h2>
                        <p className="text-lg">Mã bài thi không hợp lệ hoặc đã bị xoá.</p>
                        <p className="text-sm text-gray-600">Vui lòng kiểm tra lại mã hoặc yêu cầu giáo viên gửi lại link làm bài.</p>
                        <button onClick={() => navigate('')} className="mt-6 bg-blue-500 text-white font-semibold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">
                            Trở về trang chủ
                        </button>
                    </div>
                );
            case 'home':
            default:
                return <Home onNavigate={navigate} />;
        }
    };

    return <div className="min-h-screen bg-slate-50">{renderContent()}</div>;
};

export default App;