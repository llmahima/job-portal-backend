const fs = require('fs');
const { PDFParse } = require('pdf-parse');
const logger = require('../utils/logger');
const { getCanonical } = require('./skillSynonyms');

// Expanded skill keywords (~120 entries)
const SKILL_KEYWORDS = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift',
  'kotlin', 'php', 'scala', 'r', 'dart', 'elixir', 'perl', 'lua', 'haskell', 'clojure',
  // Frontend
  'react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt.js', 'html', 'css', 'sass', 'scss',
  'tailwind', 'bootstrap', 'jquery', 'redux', 'webpack', 'vite',
  // Backend
  'node.js', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'spring boot',
  'rails', 'ruby on rails', '.net', 'asp.net', 'nestjs', 'fastify', 'laravel', 'gin',
  // Databases
  'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra',
  'sqlite', 'firebase', 'supabase', 'prisma', 'sequelize', 'typeorm', 'knex',
  // DevOps & Cloud
  'docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions',
  'gitlab ci', 'aws', 'azure', 'gcp', 'nginx', 'linux', 'bash',
  // Data Science & ML
  'machine learning', 'deep learning', 'nlp', 'natural language processing', 'computer vision',
  'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'data science', 'spark',
  // APIs & Architecture
  'rest', 'graphql', 'microservices', 'api', 'oauth', 'grpc', 'websocket', 'rabbitmq', 'kafka',
  // Mobile
  'react native', 'flutter', 'ios', 'android',
  // Testing
  'jest', 'mocha', 'cypress', 'playwright', 'selenium',
  // Tools
  'git', 'jira', 'figma', 'photoshop', 'illustrator',
  // BI & Analytics
  'excel', 'power bi', 'tableau', 'looker',
  // Soft Skills
  'communication', 'leadership', 'problem solving', 'teamwork', 'project management',
  'agile', 'scrum',
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

// Section header patterns for splitting resume into sections
const SECTION_HEADERS = [
  { name: 'experience', patterns: [/\b(work\s+)?experience\b/i, /\bemployment\s+history\b/i, /\bprofessional\s+experience\b/i, /\bwork\s+history\b/i, /\bcareer\s+history\b/i] },
  { name: 'education', patterns: [/\beducation\b/i, /\bacademic\b/i, /\bqualifications?\b/i] },
  { name: 'skills', patterns: [/\bskills?\b/i, /\btechnical\s+skills?\b/i, /\bcore\s+competenc/i, /\bproficienc/i, /\btechnologies\b/i, /\btools?\s*&?\s*technologies\b/i] },
  { name: 'summary', patterns: [/\bsummary\b/i, /\bobjective\b/i, /\bprofile\b/i, /\babout\s+me\b/i, /\bprofessional\s+summary\b/i] },
  { name: 'projects', patterns: [/\bprojects?\b/i] },
  { name: 'certifications', patterns: [/\bcertifications?\b/i, /\blicenses?\b/i] },
];

/**
 * Split resume text into detected sections.
 * Returns an object with section names as keys and section text as values.
 * The 'header' key contains text before the first recognized section.
 */
function splitIntoSections(text) {
  const lines = text.split('\n');
  const sections = { _full: text };
  let currentSection = 'header';
  sections[currentSection] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    let matched = false;

    // A section header is typically a short line (< 60 chars)
    if (trimmed.length > 0 && trimmed.length < 60) {
      for (const { name, patterns } of SECTION_HEADERS) {
        if (patterns.some(p => p.test(trimmed))) {
          currentSection = name;
          sections[currentSection] = sections[currentSection] || [];
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      sections[currentSection] = sections[currentSection] || [];
      sections[currentSection].push(line);
    }
  }

  // Join arrays into strings
  for (const key of Object.keys(sections)) {
    if (Array.isArray(sections[key])) {
      sections[key] = sections[key].join('\n');
    }
  }
  return sections;
}

function extractEmail(text) {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0] : null;
}

function extractPhone(text) {
  const match = text.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  return match ? match[0].trim() : null;
}

function extractName(text, sections) {
  const headerText = sections?.header || '';
  const lines = headerText.split('\n').map(l => l.trim()).filter(Boolean);

  // Strategy 1: find a name-like line in the header (skip email/phone lines)
  for (const line of lines.slice(0, 5)) {
    if (/[@\d]/.test(line)) continue;
    if (/^[A-Za-z\s.'-]{2,60}$/.test(line) && line.split(/\s+/).length >= 2 && line.split(/\s+/).length <= 5) {
      return line;
    }
  }

  // Strategy 2: line before email
  const allLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const emailIdx = allLines.findIndex(l => /[\w.-]+@[\w.-]+\.\w+/.test(l));
  if (emailIdx > 0) {
    const candidate = allLines[emailIdx - 1];
    if (/^[A-Za-z\s.'-]{2,60}$/.test(candidate) && candidate.split(/\s+/).length <= 5) {
      return candidate;
    }
  }

  // Fallback: original first-line approach on full text
  if (allLines.length > 0 && /^[A-Za-z\s.]{2,60}$/.test(allLines[0]) && allLines[0].split(/\s+/).length <= 5) {
    return allLines[0];
  }
  return null;
}

function extractSkills(text, sections) {
  const lowerText = text.toLowerCase();

  // Step 1: match against SKILL_KEYWORDS in full text
  const keywordMatches = SKILL_KEYWORDS.filter(skill => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(lowerText);
  });

  // Step 2: extract items from skills section (comma/pipe/bullet separated)
  const sectionSkills = [];
  const skillSectionText = sections?.skills || '';
  if (skillSectionText) {
    const tokens = skillSectionText
      .split(/[,|•·\n]/)
      .map(t => t.replace(/^[-:*]\s*/, '').trim().toLowerCase())
      .filter(t => t.length >= 2 && t.length <= 40 && !/^\d+$/.test(t));
    sectionSkills.push(...tokens);
  }

  // Step 3: canonicalize all found skills and deduplicate
  const allFound = new Set();
  for (const s of [...keywordMatches, ...sectionSkills]) {
    allFound.add(getCanonical(s));
  }

  return Array.from(allFound);
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

function extractExperienceYears(text, sections) {
  // Primary: explicit "X years" patterns (search full text)
  const patterns = [
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|exp)/i,
    /experience\s*:?\s*(\d{1,2})\+?\s*(?:years?|yrs?)/i,
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:in|of|total)/i,
    /(?:over|more than|at least)\s+(\d{1,2})\+?\s*(?:years?|yrs?)/i,
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:professional|industry|relevant)/i,
    /(\d{1,2})\s*(?:years?|yrs?)\s*experience/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return parseInt(match[1], 10);
  }

  // Fallback: count year ranges — prefer experience section to avoid education dates
  const expText = sections?.experience || text;
  const yearRanges = expText.matchAll(/\b(20\d{2}|19\d{2})\s*[-–—]\s*(20\d{2}|19\d{2}|present|current|now)\b/gi);
  let totalYears = 0;
  for (const m of yearRanges) {
    const start = parseInt(m[1], 10);
    const endStr = m[2].toLowerCase();
    const end = endStr === 'present' || endStr === 'current' || endStr === 'now'
      ? new Date().getFullYear()
      : parseInt(m[2], 10);
    totalYears += end - start;
  }
  if (totalYears > 0) return totalYears;

  // Fallback: "since YYYY"
  const sinceMatch = text.match(/\bsince\s+(20\d{2})\b/i);
  if (sinceMatch) {
    const start = parseInt(sinceMatch[1], 10);
    return Math.max(0, new Date().getFullYear() - start);
  }

  return 0;
}

async function parseResume(filePath, options = {}) {
  logger.debug('parseResume started', { filePath, options });
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

    // Try LLM parsing if enabled
    if (options.useLLM) {
      try {
        const { parseResumeWithLLM } = require('./llmParser');
        const llmResult = await parseResumeWithLLM(text);
        if (llmResult && !llmResult.error) {
          logger.info('LLM parsing succeeded, using LLM result');
          return llmResult;
        }
        logger.warn('LLM parsing returned null, falling back to rule-based');
      } catch (err) {
        logger.warn('LLM parsing unavailable, falling back to rule-based', { message: err.message });
      }
    }

    // Section-aware rule-based parsing
    const sections = splitIntoSections(text);

    const parsed = {
      name: extractName(text, sections),
      email: extractEmail(text),
      phone: extractPhone(text),
      skills: extractSkills(text, sections),
      education: extractEducation(sections?.education || text),
      experience_years: extractExperienceYears(text, sections),
      raw_text: text,
      sections_detected: Object.keys(sections).filter(k => k !== '_full'),
      parser_version: 'rule-v2',
    };
    logger.debug('Resume parsed successfully', {
      name: parsed.name,
      skillsCount: parsed.skills?.length ?? 0,
      education: parsed.education,
      sectionsDetected: parsed.sections_detected,
    });
    return parsed;
  } finally {
    await parser.destroy();
  }
}

module.exports = { parseResume, EDUCATION_RANK };
