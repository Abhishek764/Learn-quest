const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

let client = null;
function getModel() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  if (!client) client = new GoogleGenerativeAI(API_KEY);
  return client.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  });
}

const QUESTION_SCHEMA_HINT = `Return a JSON object: {
  "questions": [
    {
      "prompt": string,
      "choices": [string, string, string, string],
      "answerIndex": integer (0-3),
      "explanation": string,
      "difficulty": "easy" | "medium" | "hard",
      "topic": string
    }
  ]
}`;

function buildPrompt({ topic, count, difficulty, gradeLevel, style }) {
  const hints = [];
  if (gradeLevel) hints.push(`Target grade level: ${gradeLevel}.`);
  if (style) hints.push(`Style: ${style}.`);
  return [
    `Generate ${count} multiple-choice quiz questions about "${topic}".`,
    `Difficulty: ${difficulty}.`,
    'Each question must have exactly 4 distinct choices and one correct answer.',
    'Include a brief explanation for the correct answer.',
    ...hints,
    QUESTION_SCHEMA_HINT,
    'Output ONLY valid JSON. No markdown fences, no commentary.',
  ].join('\n');
}

async function generateQuestions(opts) {
  const model = getModel();
  const prompt = buildPrompt(opts);
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini returned non-JSON output');
  }
  if (!parsed || !Array.isArray(parsed.questions)) {
    throw new Error('Gemini response missing questions array');
  }
  return parsed.questions;
}

module.exports = { generateQuestions };
