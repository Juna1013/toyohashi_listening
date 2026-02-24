export interface SubQuestion {
  question: string;
  choices: string[];
}

export interface Question {
  number: number;
  instruction?: string;
  passage: string;
  audioPath: string;
  options?: string[];
  subQuestions?: SubQuestion[];
}

export interface QuestionSet {
  year: number;
  title: string;
  questions: Question[];
}