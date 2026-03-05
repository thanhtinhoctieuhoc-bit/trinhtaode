
import React, { useState } from 'react';
import { Exam, Question, Option } from '../../types';
import { parseQuestionsFromText, extractTextFromFile } from '../../services/geminiService';
import Button from '../ui/Button';

interface CreateExamProps {
    addExam: (exam: Exam) => void;
    questionBank: Question[];
}

const generateShortId = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};


const CreateExam: React.FC<CreateExamProps> = ({ addExam, questionBank }) => {
    const [title, setTitle] = useState('');
    const [className, setClassName] = useState('');
    const [questions, setQuestions] = useState<Partial<Question>[]>([]);
    const [pastedText, setPastedText] = useState('');
    const [fileToParse, setFileToParse] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

     const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileToParse(file);
        }
    };

    const handleFileParse = async () => {
        if (!fileToParse) {
            setError("Vui lòng chọn một tệp để phân tích.");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(fileToParse);
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = error => reject(error);
            });

            const filePart = {
                inlineData: {
                    mimeType: fileToParse.type,
                    data: base64,
                },
            };
            
            const extractedText = await extractTextFromFile(filePart);
            
            if (!extractedText.trim()) {
                throw new Error("Không thể trích xuất văn bản từ tệp hoặc tệp trống.");
            }

            const parsedQuestions = await parseQuestionsFromText(extractedText);
            if (parsedQuestions.length === 0) {
                 setError("Không tìm thấy câu hỏi trắc nghiệm nào trong tệp. Vui lòng kiểm tra lại định dạng.");
            } else {
                setQuestions(prev => [...prev, ...parsedQuestions]);
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi khi xử lý tệp.");
        } finally {
            setIsLoading(false);
            setFileToParse(null);
            const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const handlePasteParse = async () => {
        if (!pastedText.trim()) {
            setError("Vui lòng dán văn bản vào ô.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const parsedQuestions = await parseQuestionsFromText(pastedText);
             if (parsedQuestions.length === 0) {
                 setError("Không tìm thấy câu hỏi trắc nghiệm nào trong văn bản. Vui lòng kiểm tra lại định dạng.");
            } else {
                setQuestions(prev => [...prev, ...parsedQuestions]);
                setPastedText('');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    const addQuestion = () => {
        setQuestions([...questions, { 
            questionText: '', 
            options: [{text:''}, {text:''}, {text:''}, {text:''}], 
            correctAnswerIndex: 0, 
            points: 1, 
            type: 'multiple-choice' 
        }]);
    };

    const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
        const newQuestions = [...questions];
        const question = newQuestions[index] as any;
        if(question) {
            question[field] = value;
            setQuestions(newQuestions);
        }
    };
    
    const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
        const newQuestions = [...questions];
        const question = newQuestions[qIndex];
        if (question && question.options && question.options[oIndex]) {
            question.options[oIndex].text = value;
            setQuestions(newQuestions);
        }
    };

    const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleQuestionChange(index, 'image', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

     const handleOptionImageUpload = (qIndex: number, oIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newQuestions = [...questions];
                const question = newQuestions[qIndex];
                if (question && question.options && question.options[oIndex]) {
                    question.options[oIndex].image = reader.result as string;
                    setQuestions(newQuestions);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!title || !className || questions.length === 0) {
            setError("Vui lòng nhập đầy đủ thông tin: Tiêu đề, Lớp và ít nhất một câu hỏi.");
            return;
        }

        const finalQuestions: Question[] = questions.map((q, index) => ({
            id: `${Date.now()}-${index}`,
            questionText: q.questionText || '',
            options: q.options?.map(opt => ({ text: opt.text || '', image: opt.image })) || [],
            correctAnswerIndex: q.correctAnswerIndex ?? 0,
            points: q.points || 1,
            image: q.image,
            type: q.type || 'multiple-choice',
        }));

        const newExam: Exam = {
            id: generateShortId(),
            title,
            className,
            createdAt: new Date().toISOString(),
            questions: finalQuestions,
        };
        addExam(newExam);
        alert('Tạo đề thi thành công!');
        setTitle('');
        setClassName('');
        setQuestions([]);
        setError(null);
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Tạo đề thi mới</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <input
                    type="text"
                    placeholder="Tiêu đề bài thi (ví dụ: Kiểm tra giữa kỳ 1)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
                <input
                    type="text"
                    placeholder="Lớp (ví dụ: 5A)"
                    value={className}
                    onChange={e => setClassName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">{error}</div>}

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-8">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Thêm câu hỏi nhanh bằng AI</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="flex flex-col h-full">
                        <label htmlFor="pasted-text" className="block text-md font-semibold text-gray-700 mb-2">1. Dán văn bản</label>
                        <p className="text-sm text-gray-500 mb-3">Sao chép nội dung từ Word/PDF và dán vào đây.</p>
                        <textarea
                            id="pasted-text"
                            className="w-full flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition bg-white text-gray-900"
                            placeholder="Dán nội dung câu hỏi và các lựa chọn vào đây..."
                            value={pastedText}
                            onChange={e => setPastedText(e.target.value)}
                            disabled={isLoading}
                            rows={10}
                        />
                        <Button onClick={handlePasteParse} isLoading={isLoading} disabled={!pastedText.trim() || isLoading} className="mt-3 w-full">
                            Phân tích văn bản
                        </Button>
                    </div>

                    <div className="flex flex-col h-full">
                         <label className="block text-md font-semibold text-gray-700 mb-2">2. Hoặc tải lên tệp</label>
                         <p className="text-sm text-gray-500 mb-3">Hỗ trợ tệp .txt, .docx, .pdf.</p>
                         <div className="flex-grow p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-center bg-white h-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                             </svg>
                             <p className="text-sm text-gray-600 mb-3 font-semibold min-h-[20px]">
                                {fileToParse ? fileToParse.name : "Chọn một tệp"}
                             </p>
                             <input
                                 id="file-upload-input"
                                 type="file"
                                 accept=".txt,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                 onChange={handleFileChange}
                                 className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                                 disabled={isLoading}
                             />
                         </div>
                          <Button onClick={handleFileParse} isLoading={isLoading} disabled={!fileToParse || isLoading} className="mt-3 w-full">
                            Phân tích tệp
                        </Button>
                     </div>
                </div>
                 {isLoading && <p className="text-blue-600 mt-4 text-center">AI đang phân tích, vui lòng chờ trong giây lát...</p>}
            </div>

            <h3 className="text-xl font-bold text-gray-800 mb-4">Danh sách câu hỏi</h3>
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-slate-50 border border-gray-200 p-6 rounded-xl shadow-sm relative">
                         <button onClick={() => removeQuestion(qIndex)} className="absolute top-4 right-4 text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-lg text-gray-700">Câu hỏi {qIndex + 1}</h4>
                            <div className="flex items-center gap-2">
                                <label htmlFor={`points-${qIndex}`} className="text-sm font-semibold text-gray-600">Điểm:</label>
                                <input
                                    id={`points-${qIndex}`}
                                    type="number"
                                    value={q.points || 1}
                                    min="0.1"
                                    step="0.1"
                                    onChange={e => handleQuestionChange(qIndex, 'points', parseFloat(e.target.value) || 1)}
                                    className="w-24 p-2 border border-gray-300 rounded-lg text-center bg-white text-gray-900 focus:ring-2 focus:ring-blue-500"
                                    aria-label={`Điểm cho câu hỏi ${qIndex + 1}`}
                                />
                            </div>
                        </div>
                        
                        <textarea
                            placeholder="Nội dung câu hỏi"
                            value={q.questionText}
                            onChange={e => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md mb-4 bg-white text-gray-900"
                            rows={3}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {q.options?.map((opt, oIndex) => (
                                <div key={oIndex} className="flex items-start gap-3">
                                    <input
                                        type="radio"
                                        name={`correct_answer_${qIndex}`}
                                        checked={q.correctAnswerIndex === oIndex}
                                        onChange={() => handleQuestionChange(qIndex, 'correctAnswerIndex', oIndex)}
                                        className="mt-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 shrink-0"
                                        aria-label={`Chọn đáp án ${oIndex + 1} là đúng`}
                                    />
                                    <div className={`w-full p-3 border rounded-lg transition-all ${q.correctAnswerIndex === oIndex ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                                        <input
                                            type="text"
                                            placeholder={`Lựa chọn ${oIndex + 1}`}
                                            value={opt.text}
                                            onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500"
                                        />
                                        <div className="mt-2">
                                            {opt.image && <img src={opt.image} alt={`Minh họa cho lựa chọn ${oIndex + 1}`} className="max-h-24 rounded border mb-2" />}
                                            <label className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                                                {opt.image ? 'Thay đổi ảnh' : 'Thêm ảnh'}
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleOptionImageUpload(qIndex, oIndex, e)} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                         <div className="mt-4 border-t pt-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">Ảnh minh hoạ cho câu hỏi (nếu có):</label>
                            {q.image && <img src={q.image} alt="Question illustration" className="max-w-xs max-h-40 my-2 rounded-md border" />}
                             <input type="file" accept="image/*" onChange={(e) => handleImageUpload(qIndex, e)} className="text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
                        </div>

                    </div>
                ))}
            </div>

            <div className="mt-8 flex items-center justify-between flex-wrap gap-4">
                <Button onClick={addQuestion} variant="secondary">Thêm câu hỏi thủ công</Button>
                <Button onClick={handleSubmit} isLoading={isLoading}>Lưu đề thi</Button>
            </div>
        </div>
    );
};

export default CreateExam;