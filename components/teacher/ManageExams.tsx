import React, { useState } from 'react';
import { Exam, StudentSubmission, encodeData } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface ManageExamsProps {
    exams: Exam[];
    submissions: StudentSubmission[];
    onTriggerImport: () => void;
}

const ManageExams: React.FC<ManageExamsProps> = ({ exams, submissions, onTriggerImport }) => {
    const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
    const [isShareModalOpen, setShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    const getSubmissionsForExam = (examId: string) => {
        return submissions.filter(s => s.examId === examId);
    };

    const handleViewResults = (exam: Exam) => {
        setSelectedExam(exam);
    };

    const handleShareExam = async (exam: Exam) => {
        setSelectedExam(exam);
        setShareModalOpen(true);
        setIsGeneratingLink(true);
        setShareUrl('');
        try {
            const encodedData = await encodeData(exam);
            if (encodedData) {
                const baseUrl = window.location.href.split('#')[0];
                const url = `${baseUrl}#/student/import/${encodedData}`;
                setShareUrl(url);
            }
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const handleExportSingleExam = (exam: Exam) => {
        try {
            const jsonString = JSON.stringify(exam, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safeTitle = exam.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            a.download = `de_thi_${safeTitle}_${exam.id}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting single exam:", error);
            alert("Đã xảy ra lỗi khi xuất đề thi.");
        }
    };

    const closeResults = () => {
        setSelectedExam(null);
    };

    const exportToCSV = (examSubmissions: StudentSubmission[], examTitle: string) => {
        const headers = ["Họ và tên", "Lớp", "Điểm", "Thời gian nộp"];

        const escapeField = (field: any) => {
            const stringField = String(field);
            return `"${stringField.replace(/"/g, '""')}"`;
        };

        const rows = examSubmissions.map(s => {
            const studentName = escapeField(s.studentName);
            const studentClass = `="${s.studentClass.replace(/"/g, '""')}"`;
            const score = escapeField(`${s.score.toFixed(2)}/10`);
            const submittedAt = escapeField(new Date(s.submittedAt).toLocaleString('vi-VN'));

            return [studentName, studentClass, score, submittedAt].join(',');
        });

        let csvContent = "\uFEFF"
            + headers.join(",") + "\n" 
            + rows.join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ket_qua_${examTitle.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (selectedExam && !isShareModalOpen) {
        const examSubmissions = getSubmissionsForExam(selectedExam.id);
        return (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">{selectedExam.title}</h2>
                        <p className="text-gray-500 mt-1">Lớp: {selectedExam.className}</p>
                    </div>
                    <button onClick={closeResults} className="flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Quay lại danh sách
                    </button>
                </div>
    
                {examSubmissions.length > 0 ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-700">Kết quả của học sinh</h3>
                            <button 
                                onClick={() => exportToCSV(examSubmissions, selectedExam.title)} 
                                className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                                Xuất Excel
                            </button>
                        </div>
                        <div className="relative overflow-x-auto shadow-md sm:rounded-lg border">
                            <table className="w-full text-sm text-left text-gray-700">
                                <thead className="text-xs text-gray-800 uppercase bg-gray-100">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">Họ và tên</th>
                                        <th scope="col" className="px-6 py-3">Lớp</th>
                                        <th scope="col" className="px-6 py-3">Điểm</th>
                                        <th scope="col" className="px-6 py-3">Thời gian nộp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {examSubmissions.map((sub, index) => (
                                        <tr key={sub.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b hover:bg-blue-50`}>
                                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                                {sub.studentName}
                                            </th>
                                            <td className="px-6 py-4">{sub.studentClass}</td>
                                            <td className="px-6 py-4 font-bold text-blue-600">{sub.score.toFixed(2)}/10</td>
                                            <td className="px-6 py-4">{new Date(sub.submittedAt).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-500 py-16 border-2 border-dashed rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="mt-2 font-semibold">Chưa có học sinh nào nộp bài.</p>
                        <p className="text-sm">Hãy chia sẻ đề thi để bắt đầu nhận bài làm.</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                 <h2 className="text-3xl font-bold text-gray-800">Danh sách đề thi</h2>
                 <Button onClick={onTriggerImport} variant="secondary">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                       <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                     </svg>
                     Tải lên đề thi
                 </Button>
            </div>
            {exams.length > 0 ? (
                <div className="space-y-4">
                    {exams.map(exam => (
                        <div key={exam.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                             <div>
                                <h3 className="font-bold text-lg text-gray-800">{exam.title}</h3>
                                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                    <span>Lớp: <strong>{exam.className}</strong></span>
                                    <span>{exam.questions.length} câu hỏi</span>
                                    <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">Mã: {exam.id}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                                <button onClick={() => handleViewResults(exam)} className="flex items-center gap-1.5 bg-blue-100 text-blue-800 font-semibold py-1.5 px-3 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /> <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /> </svg>
                                    Kết quả ({getSubmissionsForExam(exam.id).length})
                                </button>
                                <button onClick={() => handleShareExam(exam)} className="flex items-center gap-1.5 bg-green-100 text-green-800 font-semibold py-1.5 px-3 rounded-lg text-sm hover:bg-green-200 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"> <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /> </svg>
                                    Chia sẻ
                                </button>
                                 <button onClick={() => handleExportSingleExam(exam)} title="Tải xuống đề thi" className="flex items-center gap-1.5 bg-gray-100 text-gray-800 font-semibold py-1.5 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                    Tải xuống
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center text-gray-500 py-12 border-2 border-dashed rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                    <p className="mt-2 font-semibold">Chưa có đề thi nào được tạo.</p>
                    <p className="text-sm">Hãy chuyển sang tab "Tạo đề thi mới" để bắt đầu.</p>
                </div>
            )}

            <Modal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} title={`Chia sẻ đề thi: ${selectedExam?.title}`}>
                 <div className="space-y-6">
                    {isGeneratingLink ? (
                        <div className="flex flex-col items-center justify-center p-8 text-center">
                            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-lg font-semibold text-gray-700">Đang tạo link chia sẻ...</p>
                            <p className="text-sm text-gray-500">Quá trình này có thể mất vài giây nếu đề thi có nhiều hình ảnh.</p>
                        </div>
                    ) : shareUrl ? (
                        <>
                            <div>
                                <label className="font-semibold text-gray-700 block mb-2">Đường link làm bài:</label>
                                <p className="text-sm text-gray-500 mb-2">Gửi link này cho học sinh để các em có thể bắt đầu làm bài ngay lập tức.</p>
                                <div className="flex items-center space-x-2">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={shareUrl} 
                                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-blue-500" 
                                        onClick={(e) => (e.target as HTMLInputElement).select()} 
                                    />
                                    <button 
                                        onClick={() => {navigator.clipboard.writeText(shareUrl); alert('Đã sao chép đường link!');}} 
                                        className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors shrink-0"
                                        aria-label="Sao chép đường link"
                                        title="Sao chép đường link"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                                            <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                             <div>
                                <label className="font-semibold text-gray-700 block mb-2">Mã QR:</label>
                                <div className="flex justify-center p-4 bg-white rounded-md border">
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl)}&size=200x200&qzone=1`} alt="QR Code" />
                                </div>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-sm">
                                <p><strong>Lưu ý:</strong> Mã đề <strong>({selectedExam?.id})</strong> chỉ có thể sử dụng bởi những học sinh đã truy cập vào link làm bài ít nhất một lần.</p>
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-8">
                             <p className="text-red-600 font-semibold">Không thể tạo link chia sẻ. Vui lòng thử lại.</p>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ManageExams;