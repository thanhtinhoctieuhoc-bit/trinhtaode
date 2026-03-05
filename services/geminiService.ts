import { GoogleGenAI, Type } from "@google/genai";
import { Question } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

const questionSchema = {
    type: Type.OBJECT,
    properties: {
        questionText: { type: Type.STRING, description: "Nội dung câu hỏi." },
        options: {
            type: Type.ARRAY,
            description: "Danh sách các lựa chọn trả lời, thường là 4 lựa chọn.",
            items: { type: Type.STRING }
        },
        correctAnswerIndex: { type: Type.INTEGER, description: "Chỉ số (bắt đầu từ 0) của câu trả lời đúng trong mảng lựa chọn." }
    },
    required: ["questionText", "options", "correctAnswerIndex"]
};

export const extractTextFromFile = async (filePart: { inlineData: { mimeType: string, data: string } }): Promise<string> => {
    try {
        const textPart = { text: "Trích xuất toàn bộ nội dung văn bản từ tệp này. Chỉ trả về nội dung text thuần túy, không thêm bất kỳ lời giải thích nào và giữ nguyên định dạng các câu hỏi trắc nghiệm nếu có." };
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [filePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error extracting text with Gemini:", error);
        throw new Error("Không thể trích xuất văn bản từ tệp.");
    }
};


export const parseQuestionsFromText = async (text: string): Promise<Partial<Question>[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Phân tích văn bản sau và trích xuất CHÍNH XÁC TẤT CẢ các câu hỏi trắc nghiệm có trong đó. Giữ nguyên số lượng câu hỏi. Mỗi câu hỏi phải bao gồm nội dung câu hỏi, các lựa chọn và xác định đáp án đúng. Không bỏ sót câu nào. Văn bản: "${text}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: questionSchema
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        
        if (Array.isArray(jsonResponse)) {
            return jsonResponse.map(q => ({
                ...q,
                options: q.options.map((opt: string) => ({ text: opt })),
                type: 'multiple-choice',
                points: 1
            }));
        }
        return [];

    } catch (error) {
        console.error("Error parsing questions with Gemini:", error);
        throw new Error("Không thể phân tích câu hỏi từ văn bản. Vui lòng thử lại.");
    }
};

export const generateQuestions = async (topic: string, grade: string, count: number): Promise<Partial<Question>[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" cho học sinh lớp ${grade}. Mỗi câu hỏi phải có 4 lựa chọn và một đáp án đúng.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: questionSchema
                }
            }
        });

        const jsonResponse = JSON.parse(response.text);
        if (Array.isArray(jsonResponse)) {
             return jsonResponse.map(q => ({
                ...q,
                options: q.options.map((opt: string) => ({ text: opt })),
                type: 'multiple-choice',
                points: 1
            }));
        }
        return [];
    } catch (error) {
        console.error("Error generating questions with Gemini:", error);
        throw new Error("Không thể tạo câu hỏi. Vui lòng thử lại.");
    }
};
