const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const client = new Groq(); // reads GROQ_API_KEY from env

const RESUME_PARSE_PROMPT = `You are a resume parsing assistant. Extract the following structured data from this resume text. Return ONLY valid JSON, no other text.

{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+1-xxx-xxx-xxxx or null",
  "skills": ["skill1", "skill2"],
  "education": [{"degree": "bachelors|masters|phd|diploma", "field": "Computer Science", "institution": "University Name", "year": 2020}],
  "experience_years": 5,
  "experience": [{"title": "Job Title", "company": "Company Name", "start_year": 2020, "end_year": 2023, "description": "brief summary"}],
  "summary": "2-3 sentence professional summary",
  "certifications": ["cert1", "cert2"]
}

Rules:
- For skills, list ALL technical and soft skills mentioned, using canonical names (e.g., "React" not "ReactJS", "Node.js" not "NodeJS")
- For experience_years, calculate total professional years from work history
- For education, map to standard levels: diploma, bachelors, masters, phd
- If a field cannot be determined, use null (for strings) or [] (for arrays) or 0 (for numbers)

Resume text:
`;

/**
 * Parse a resume using Groq API with llama-3.3-70b-versatile.
 * Returns structured data in the same shape as rule-based parser, or null on failure.
 */
async function parseResumeWithLLM(rawText) {
  logger.info('LLM resume parsing started', { textLength: rawText.length });

  try {
    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      temperature: 0.1,
      messages: [
        { role: 'system', content: 'You are a precise resume parser. Always respond with valid JSON only.' },
        { role: 'user', content: RESUME_PARSE_PROMPT + rawText },
      ],
    });

    const content = response.choices?.[0]?.message?.content || '';

    // Extract JSON from response (handle potential markdown wrapping)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('LLM returned non-JSON response', { content: content.slice(0, 200) });
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Normalize to match rule-based output shape
    return {
      name: parsed.name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      skills: (parsed.skills || []).map(s => s.toLowerCase()),
      education: normalizeEducation(parsed.education),
      experience_years: parsed.experience_years || 0,
      raw_text: rawText,
      // Enriched fields from LLM
      experience_detail: parsed.experience || [],
      summary: parsed.summary || null,
      certifications: parsed.certifications || [],
      parser_version: 'llm-v1',
    };
  } catch (err) {
    logger.error('LLM parsing failed', { message: err.message });
    return null;
  }
}

function normalizeEducation(eduArray) {
  if (!Array.isArray(eduArray)) return [];
  const levels = new Set();
  for (const edu of eduArray) {
    const degree = (edu.degree || '').toLowerCase();
    if (['phd', 'doctorate'].includes(degree)) levels.add('phd');
    else if (['masters', 'master'].includes(degree)) levels.add('masters');
    else if (['bachelors', 'bachelor'].includes(degree)) levels.add('bachelors');
    else if (['diploma', 'associate'].includes(degree)) levels.add('diploma');
  }
  return Array.from(levels);
}

module.exports = { parseResumeWithLLM };
