import React, { useState } from 'react';
import Button from './ui/Button';

interface HomeProps {
    onNavigate: (path: string) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    const [examCode, setExamCode] = useState('');

    const handleStudentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (examCode.trim()) {
            onNavigate(`student/exam/${examCode.trim()}`);
        } else {
            alert("Vui lòng nhập mã đề thi.");
        }
    };
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
            <header className="text-center mb-12">
                <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-4">
                    Trình Tạo Đề Thi Thông Minh
                </h1>
                <p className="text-xl text-gray-600">
                    Công cụ hỗ trợ giáo viên tạo và quản lý bài kiểm tra một cách hiệu quả
                </p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                <div 
                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
                    onClick={() => onNavigate('teacher')}
                >
                    <div className="bg-blue-100 p-6 rounded-full mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-5.747-8.247h11.494M12 4.75a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-4.5 0V7a2.25 2.25 0 012.25-2.25z" />
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Dành cho Giáo viên</h2>
                    <p className="text-gray-600">Tạo đề, quản lý bài thi và xem kết quả của học sinh.</p>
                </div>

                <div 
                    className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
                >
                    <div className="bg-green-100 p-6 rounded-full mb-6">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Dành cho Học sinh</h2>
                    <p className="text-gray-600 mb-4">Nhập mã đề thi do giáo viên cung cấp để bắt đầu.</p>
                     <form onSubmit={handleStudentSubmit} className="w-full flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            placeholder="Nhập mã đề thi..."
                            aria-label="Mã đề thi"
                            value={examCode}
                            onChange={(e) => setExamCode(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 transition"
                        />
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white focus:ring-green-500">
                            Vào thi
                        </Button>
                    </form>
                </div>
            </main>

            <footer className="mt-16 text-center text-gray-500">
                <p>Phát triển bởi <strong>Thầy. Võ Châu Thanh</strong></p>
                <p>&copy; {new Date().getFullYear()} - All rights reserved.</p>
            </footer>
        </div>
    );
};

export default Home;