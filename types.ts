
export interface Option {
    text: string;
    image?: string; // base64 encoded image
}

export interface Question {
    id: string;
    questionText: string;
    options: Option[];
    correctAnswerIndex: number;
    points: number;
    image?: string; // base64 encoded image
    type: 'multiple-choice' | 'essay';
}

export interface Exam {
    id: string;
    title: string;
    className: string;
    createdAt: string;
    questions: Question[];
}

export interface StudentSubmission {
    id: string;
    examId: string;
    studentName: string;
    studentClass: string;
    answers: (number | string)[];
    score: number;
    submittedAt: string;
    totalPoints: number;
}

// --- DATA UTILS ---

export const mergeExams = (existingExams: Exam[], newExams: Exam[]): Exam[] => {
    if (!Array.isArray(newExams)) return existingExams;

    const existingExamIds = new Set(existingExams.map(e => e.id));
    const uniqueNewExams = newExams.filter((exam: Exam) => exam.id && !existingExamIds.has(exam.id));
    
    return [...existingExams, ...uniqueNewExams];
};

export const mergeQuestionBank = (existingBank: Question[], newQuestions: Question[]): Question[] => {
    if (!Array.isArray(newQuestions)) return existingBank;

    const existingQuestionIds = new Set(existingBank.map(q => q.id));
    const uniqueNewQuestions = newQuestions.filter((q: Question) => q.id && !existingQuestionIds.has(q.id));
    
    return [...existingBank, ...uniqueNewQuestions];
};


// --- ENCODING/DECODING UTILS ---

const toUrlSafeBase64 = (base64: string): string => {
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromUrlSafeBase64 = (urlSafeBase64: string): string => {
    let base64 = urlSafeBase64.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return base64;
};

async function bufferToBase64(buffer: Uint8Array): Promise<string> {
    const blob = new Blob([buffer], {type: 'application/octet-stream'});
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
            resolve(base64);
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
}

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const buffer = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        buffer.set(chunk, offset);
        offset += chunk.length;
    }
    return buffer;
}

export async function encodeData(data: unknown): Promise<string> {
    try {
        const jsonString = JSON.stringify(data);
        const stream = new Response(jsonString).body;
        if (!stream) throw new Error("Could not create stream from string.");

        const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
        const compressedBuffer = await streamToBuffer(compressedStream);
        const base64String = await bufferToBase64(compressedBuffer);
        
        return toUrlSafeBase64(base64String);
    } catch (error) {
        console.error("Error encoding data:", error);
        throw new Error("Không thể tạo link chia sẻ.");
    }
}

export async function decodeData<T>(encodedData: string): Promise<T | null> {
    try {
        const base64String = fromUrlSafeBase64(encodedData);
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const stream = new Response(bytes).body;
        if (!stream) throw new Error("Could not create stream from bytes.");
        
        const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
        const decompressedText = await new Response(decompressedStream).text();

        return JSON.parse(decompressedText) as T;
    } catch (error) {
        console.error("Error decoding data:", error);
        return null;
    }
}
