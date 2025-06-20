import { supabase } from './supabase';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('Missing OpenAI API key');
}

interface Question {
  content: string;
  correctAnswer: string;
  options: string[];
}

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function generateQuestions(
  subjectTitle: string,
  subSubjectTitle: string,
  difficulty: 'fácil' | 'médio' | 'difícil',
  subSubjectId: string
): Promise<Question[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Você é um professor especialista em medicina, com vasta experiência em criar questões de múltipla escolha para provas de residência médica no Brasil.

IMPORTANTE: Todas as questões e respostas DEVEM ser em português do Brasil, utilizando a terminologia médica brasileira.

Gere 5 questões sobre o assunto médico fornecido, seguindo estas diretrizes:

1. Distribuição das Questões:
   - 2 questões de nível básico/fundamentos (adequadas para estudo inicial)
   - 2 questões de nível intermediário (padrão de prova de residência)
   - 1 questão de nível avançado (cenários clínicos complexos)

2. Estilo das Questões:
   - Siga o padrão das provas de residência médica brasileiras
   - Baseie-se em diretrizes clínicas atualizadas e literatura médica
   - Inclua casos clínicos e cenários práticos quando apropriado
   - Foque em conhecimento clínico prático e tomada de decisão
   - Use terminologia médica brasileira

3. Requisitos Técnicos:
   - Cada questão deve ter exatamente 4 alternativas com apenas uma correta
   - Questões devem ser concisas (máx. 300 caracteres)
   - Alternativas devem ser claras e distintas (máx. 150 caracteres)
   - Use terminologia médica apropriada em português
   - Evite respostas ambíguas ou controversas

4. Formato da Resposta:
   Retorne APENAS um objeto JSON válido com esta estrutura exata:
   {
     "questions": [
       {
         "content": "Texto da questão em português",
         "correctAnswer": "Alternativa correta em português",
         "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"]
       }
     ]
   }

CRÍTICO:
1. SEMPRE retorne JSON completo e válido
2. NUNCA truncar respostas
3. SEMPRE inclua 5 questões
4. SEMPRE inclua 4 opções por questão
5. SEMPRE inclua a resposta correta nas opções
6. Use formatação JSON adequada com aspas duplas
7. Evite caracteres especiais que possam quebrar o JSON
8. Sem quebras de linha nas strings
9. Sem tabulações ou múltiplos espaços nas strings
10. TODAS as questões e respostas DEVEM ser em português do Brasil`
          },
          {
            role: 'user',
            content: `Gere 5 questões de prova de residência médica sobre ${subjectTitle} - ${subSubjectTitle}.

Lembre-se:
1. Misture os níveis de dificuldade (2 básicas, 2 intermediárias, 1 avançada)
2. Siga o padrão das provas de residência brasileiras
3. Use diretrizes clínicas atuais
4. Inclua casos clínicos
5. Foque em conhecimento prático
6. Garanta respostas claras e inequívocas
7. Use terminologia médica brasileira
8. Retorne JSON completo com 5 questões
9. Cada questão deve ter 4 opções
10. A resposta correta deve estar entre as opções
11. TODAS as questões e respostas em português do Brasil`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
        top_p: 1,
        frequency_penalty: 0.5,
        presence_penalty: 0.5,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from OpenAI: missing content');
    }

    let parsedQuestions;
    try {
      // Clean the response content
      const content = data.choices[0].message.content
        .trim()
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/\\([^"\/bfnrtu])/g, '$1') // Remove invalid escapes
        .replace(/\s+/g, ' '); // Normalize whitespace

      parsedQuestions = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse OpenAI response:', e);
      console.error('Response content:', data.choices[0].message.content);
      throw new Error('Failed to parse questions from OpenAI response');
    }

    if (!Array.isArray(parsedQuestions?.questions)) {
      throw new Error('Invalid response format: questions array not found');
    }

    if (parsedQuestions.questions.length !== 5) {
      throw new Error(`Expected 5 questions, but got ${parsedQuestions.questions.length}`);
    }

    // Validate each question
    const questions = parsedQuestions.questions.map((q, index) => {
      if (!q.content || typeof q.content !== 'string') {
        throw new Error(`Question ${index + 1}: Invalid or missing content`);
      }

      if (!q.correctAnswer || typeof q.correctAnswer !== 'string') {
        throw new Error(`Question ${index + 1}: Invalid or missing correct answer`);
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(`Question ${index + 1}: Must have exactly 4 options`);
      }

      if (q.options.some(opt => typeof opt !== 'string' || !opt.trim())) {
        throw new Error(`Question ${index + 1}: All options must be non-empty strings`);
      }

      // Clean the correct answer and options
      const cleanCorrectAnswer = q.correctAnswer.trim();
      let cleanOptions = q.options.map(opt => opt.trim().replace(/\s+/g, ' '));

      // Ensure the correct answer is in the options array
      if (!cleanOptions.includes(cleanCorrectAnswer)) {
        // Replace a random option with the correct answer
        const randomIndex = Math.floor(Math.random() * cleanOptions.length);
        cleanOptions[randomIndex] = cleanCorrectAnswer;
        console.warn(`Question ${index + 1}: Correct answer was not in options, replaced option at index ${randomIndex}`);
      }

      // Shuffle the options to randomize the position of the correct answer
      cleanOptions = shuffleArray(cleanOptions);

      // Clean and validate content length
      const cleanContent = q.content.trim().replace(/\s+/g, ' ');
      if (cleanContent.length > 300) {
        throw new Error(`Question ${index + 1}: Content exceeds 300 characters`);
      }

      // Validate options length
      if (cleanOptions.some(opt => opt.length > 150)) {
        throw new Error(`Question ${index + 1}: One or more options exceed 150 characters`);
      }

      return {
        content: cleanContent,
        correctAnswer: cleanCorrectAnswer,
        options: cleanOptions,
      };
    });

    // Save questions in a transaction
    const { data: savedQuestions, error: transactionError } = await supabase.rpc(
      'create_questions_transaction',
      {
        p_sub_subject_id: subSubjectId,
        p_questions: questions
      }
    );

    if (transactionError) {
      throw new Error(`Database error: ${transactionError.message}`);
    }

    if (!savedQuestions || !Array.isArray(savedQuestions) || savedQuestions.length !== 5) {
      throw new Error('Failed to save all questions');
    }

    return savedQuestions.map(q => ({
      id: q.id,
      content: q.content,
      correctAnswer: q.correct_answer,
      options: q.options
    }));
  } catch (error) {
    console.error('Error generating questions:', error);
    throw new Error(
      error instanceof Error 
        ? `Falha ao gerar questões: ${error.message}`
        : 'Falha ao gerar questões'
    );
  }
}