const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const logger = require('../utils/logger');

// Rule-based keyword dictionaries
const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift',
  'react', 'angular', 'vue', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'jenkins', 'ci/cd',
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
  'html', 'css', 'sass', 'tailwind', 'bootstrap',
  'git', 'linux', 'agile', 'scrum', 'jira',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
  'rest', 'graphql', 'microservices', 'api', 'oauth',
  'figma', 'photoshop', 'illustrator',
  'excel', 'power bi', 'tableau',
  'communication', 'leadership', 'problem solving', 'teamwork',
];

const DEGREE_PATTERNS = [
  { pattern: /\b(ph\.?d|doctorate|doctoral)\b/i, level: 'phd', rank: 4 },
  { pattern: /\b(master'?s?|m\.?s\.?|m\.?b\.?a\.?|m\.?tech|m\.?e\.?)\b/i, level: 'masters', rank: 3 },
  { pattern: /\b(bachelor'?s?|b\.?s\.?|b\.?tech|b\.?e\.?|b\.?a\.?|b\.?com|b\.?sc)\b/i, level: 'bachelors', rank: 2 },
  { pattern: /\b(diploma|associate'?s?)\b/i, level: 'diploma', rank: 1 },
];

const EDUCATION_RANK = {
  phd: 4, doctorate: 4, doctoral: 4,
  masters: 3, mtech: 3, mba: 3, me: 3, ms: 3,
  bachelors: 2, btech: 2, be: 2, bsc: 2, ba: 2, bcom: 2,
  diploma: 1, associate: 1,
};

function extractEmail(text) {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const match = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  return match ? match[0].trim() : null;
}

function extractName(text) {
  // Take the first non-empty line as name (common resume format)
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const firstLine = lines[0];
  // Only return if it looks like a name (2-4 words, no special chars)
  if (/^[A-Za-z\s.]{2,60}$/.test(firstLine) && firstLine.split(/\s+/).length <= 5) {
    return firstLine;
  }
  return null;
}

function extractSkills(text) {
  const lowerText = text.toLowerCase();
  return SKILL_KEYWORDS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText);
  });
}

function extractEducation(text) {
  const found = [];
  for (const { pattern, level } of DEGREE_PATTERNS) {
    if (pattern.test(text)) {
      found.push(level);
    }
  }
  return [...new Set(found)];
}

function extractExperienceYears(text) {
  // Look for patterns like "5 years", "5+ years of experience"
  const patterns = [
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i,
    /experience\s*:?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/i,
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:in|of)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  // Fallback: count year ranges (e.g., 2018-2023)
  const yearRanges = text.matchAll(/\b(20\d{2})\s*[-–]\s*(20\d{2}|present|current)\b/gi);
  let totalYears = 0;
  for (const m of yearRanges) {
    const start = parseInt(m[1], 10);
    const end = m[2].toLowerCase() === 'present' || m[2].toLowerCase() === 'current'
      ? new Date().getFullYear()
      : parseInt(m[2], 10);
    totalYears += end - start;
  }

  return totalYears || 0;
}

async function parseResume(filePath) {
  logger.debug('parseResume started', { filePath });
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result?.text ?? '';
    logger.debug('PDF text extracted', { charCount: text?.length ?? 0 });

    if (!text || text.trim().length < 20) {
      logger.warn('Insufficient resume text', { charCount: text?.length ?? 0 });
      return { error: 'Insufficient data to evaluate this candidate.', raw_text: text };
    }

    const parsed = {
      name: extractName(text),
      email: extractEmail(text),
      phone: extractPhone(text),
      skills: extractSkills(text),
      education: extractEducation(text),
      experience_years: extractExperienceYears(text),
      raw_text: text,
    };
    logger.debug('Resume parsed successfully', {
      name: parsed.name,
      skillsCount: parsed.skills?.length ?? 0,
      education: parsed.education,
    });
    return parsed;
  } finally {
    await parser.destroy();
  }
}

module.exports = { parseResume, EDUCATION_RANK };
