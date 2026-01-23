export type Lesson = {
  id: string;
  title: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration_seconds: number;
  body: string;
  key_idea: string;
  example: string;
  code_snippet: string | null;
  quiz_question: string;
  quiz_choices: string[];
  quiz_answer_index: number;
  deep_dive: string;
  created_at: string;
};

export type LessonAction = "saved" | "learned" | "skipped";
