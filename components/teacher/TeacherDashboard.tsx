import React, { useState } from 'react';
import CreateExam from './CreateExam';
import ManageExams from './ManageExams';
import QuestionBank from './QuestionBank';
import { Exam, StudentSubmission, Question, mergeExams, mergeQuestionBank } from '../../types';

interface TeacherDashboardProps {
    exams: Exam[];
    setExams: React.Dispatch<React.SetStateAction<Exam[]>>;
    submissions: StudentSubmission[];
    addExam: (exam: Exam) => void;
    questionBank: Question[];
    setQuestionBank: React.Dispatch<React.SetStateAction<Question[]>>;
    onNavigateHome: () => void;
}

type Tab = 'create' | 'manage' | 'bank';

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ exams, setExams, submissions, addExam, questionBank, setQuestionBank, onNavigateHome }) => {
    const [activeTab, setActiveTab] = useState<Tab>('manage');

    const tabs: { id: Tab, name: string }[] = [
        { id: 'manage', name: 'Quản lý đề thi' },
        { id: 'create', name: 'Tạo đề thi mới' },
        { id: 'bank', name: 'Ngân hàng câu hỏi' },
    ];

    const handleAddExam = (exam: Exam) => {
        addExam(exam);
        setActiveTab('manage');
    };

    const handleExportData = () => {
        try {
            const dataToExport = {
                exams,
                questionBank,
            };
            const jsonString = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `smart_exam_backup_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert("Đã xuất dữ liệu thành công! Hãy lưu tệp này cẩn thận.");
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Đã xảy ra lỗi khi xuất dữ liệu.");
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("Không thể đọc tệp.");
                
                const data = JSON.parse(text);

                // Case 1: Full backup file (contains 'exams' or 'questionBank')
                if (data.exams || data.questionBank) {
                    const { exams: importedExams, questionBank: importedQuestions } = data;

                     if (!data || (!Array.isArray(importedExams) && !Array.isArray(importedQuestions))) {
                         throw new Error("Định dạng tệp sao lưu không hợp lệ.");
                    }

                    if (window.confirm("Bạn có muốn hợp nhất dữ liệu từ tệp sao lưu không? Các mục trùng lặp sẽ được bỏ qua.")) {
                        const currentExams = exams;
                        const currentQuestionBank = questionBank;
                        const finalExams = importedExams ? mergeExams(currentExams, importedExams) : currentExams;
                        const finalBank = importedQuestions ? mergeQuestionBank(currentQuestionBank, importedQuestions) : currentQuestionBank;
                        
                        const newExamsCount = finalExams.length - currentExams.length;
                        const newQuestionsCount = finalBank.length - currentQuestionBank.length;
        
                        setExams(finalExams);
                        setQuestionBank(finalBank);
        
                        alert(`Đã nhập thành công!\n- ${newExamsCount} đề thi mới\n- ${newQuestionsCount} câu hỏi mới vào ngân hàng.`);
                    }
                // Case 2: Single exam file
                } else if (data.id && data.title && data.questions) {
                    const importedExam = data as Exam;
                    if (window.confirm(`Bạn có muốn nhập đề thi "${importedExam.title}" không?`)) {
                        const currentExams = exams;
                        const finalExams = mergeExams(currentExams, [importedExam]);
                        const newExamsCount = finalExams.length - currentExams.length;

                        if (newExamsCount > 0) {
                            setExams(finalExams);
                            alert(`Đã nhập thành công 1 đề thi mới: "${importedExam.title}".`);
                        } else {
                            alert(`Đề thi "${importedExam.title}" (ID: ${importedExam.id}) đã tồn tại. Không có gì được thêm vào.`);
                        }
                    }
                } else {
                    throw new Error("Định dạng tệp không hợp lệ. Tệp phải là tệp sao lưu đầy đủ hoặc tệp chứa một đề thi duy nhất.");
                }
            } catch (error: any) {
                console.error("Error importing data:", error);
                alert(`Đã xảy ra lỗi khi nhập dữ liệu: ${error.message}`);
            } finally {
                event.target.value = ''; // Reset file input
            }
        };
        reader.readAsText(file);
    };
    
    const triggerImport = () => {
        document.getElementById('import-file-input')?.click();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-white shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Trang giáo viên</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                        <input type="file" id="import-file-input" accept=".json" className="hidden" onChange={handleImportData} />
                        <button onClick={triggerImport} className="text-sm font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 py-1.5 px-3 rounded-md transition-colors">
                           📥 Nhập/Khôi phục
                        </button>
                        <button onClick={handleExportData} className="text-sm font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 py-1.5 px-3 rounded-md transition-colors">
                           📤 Export Toàn bộ
                        </button>
                         <button onClick={onNavigateHome} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                            Về trang chủ
                        </button>
                    </div>
                </div>
                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
                    <div className="bg-gray-200 p-1 rounded-lg flex space-x-1" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    ${activeTab === tab.id
                                        ? 'bg-white text-blue-600 shadow'
                                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-800'
                                    }
                                    w-full py-2.5 text-sm sm:text-base font-medium leading-5 rounded-md
                                    focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-200 ring-blue-500 ring-opacity-60
                                    transition-all
                                `}
                            >
                                {tab.name}
                            </button>
                        ))}
                    </div>
                </nav>
            </header>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {activeTab === 'create' && <CreateExam addExam={handleAddExam} questionBank={questionBank} />}
                    {activeTab === 'manage' && <ManageExams exams={exams} submissions={submissions} onTriggerImport={triggerImport} />}
                    {activeTab === 'bank' && <QuestionBank questionBank={questionBank} setQuestionBank={setQuestionBank} />}
                </div>
            </main>
             <footer className="text-center py-4 text-gray-500">
                <p>Phát triển bởi <strong>Thầy. Võ Châu Thanh</strong></p>
            </footer>

        </div>
    );
};

export default TeacherDashboard;