/**
 * Skill synonyms, canonical groups, categories, and fuzzy matching for ATS.
 */

// Each group has a canonical name and all known variants
const SKILL_GROUPS = [
  // Programming Languages
  { canonical: 'javascript', variants: ['js', 'ecmascript', 'es6', 'es2015', 'es2016', 'es2017'] },
  { canonical: 'typescript', variants: ['ts'] },
  { canonical: 'python', variants: ['python3', 'python2', 'py'] },
  { canonical: 'java', variants: [] },
  { canonical: 'c++', variants: ['cpp', 'cplusplus', 'c plus plus'] },
  { canonical: 'c#', variants: ['csharp', 'c sharp'] },
  { canonical: 'ruby', variants: ['rb'] },
  { canonical: 'go', variants: ['golang'] },
  { canonical: 'rust', variants: [] },
  { canonical: 'swift', variants: [] },
  { canonical: 'kotlin', variants: ['kt'] },
  { canonical: 'php', variants: [] },
  { canonical: 'scala', variants: [] },
  { canonical: 'r', variants: ['rlang', 'r lang'] },
  { canonical: 'dart', variants: [] },
  { canonical: 'elixir', variants: [] },
  { canonical: 'perl', variants: [] },
  { canonical: 'lua', variants: [] },
  { canonical: 'haskell', variants: [] },
  { canonical: 'clojure', variants: [] },

  // Frontend
  { canonical: 'react', variants: ['reactjs', 'react.js', 'react js'] },
  { canonical: 'angular', variants: ['angularjs', 'angular.js', 'angular js'] },
  { canonical: 'vue', variants: ['vuejs', 'vue.js', 'vue js'] },
  { canonical: 'svelte', variants: ['sveltejs', 'svelte.js'] },
  { canonical: 'next.js', variants: ['nextjs', 'next js', 'next'] },
  { canonical: 'nuxt.js', variants: ['nuxtjs', 'nuxt'] },
  { canonical: 'html', variants: ['html5'] },
  { canonical: 'css', variants: ['css3'] },
  { canonical: 'sass', variants: ['scss'] },
  { canonical: 'tailwind', variants: ['tailwindcss', 'tailwind css'] },
  { canonical: 'bootstrap', variants: [] },
  { canonical: 'jquery', variants: [] },
  { canonical: 'redux', variants: [] },
  { canonical: 'webpack', variants: [] },
  { canonical: 'vite', variants: [] },

  // Backend
  { canonical: 'node.js', variants: ['node', 'nodejs', 'node js'] },
  { canonical: 'express', variants: ['expressjs', 'express.js'] },
  { canonical: 'django', variants: [] },
  { canonical: 'flask', variants: [] },
  { canonical: 'fastapi', variants: ['fast api'] },
  { canonical: 'spring', variants: ['spring boot', 'springboot'] },
  { canonical: 'rails', variants: ['ruby on rails', 'ror'] },
  { canonical: '.net', variants: ['dotnet', 'dot net', 'asp.net'] },
  { canonical: 'nestjs', variants: ['nest.js', 'nest js'] },
  { canonical: 'fastify', variants: [] },
  { canonical: 'laravel', variants: [] },
  { canonical: 'gin', variants: [] },
  { canonical: 'fiber', variants: [] },

  // Databases
  { canonical: 'sql', variants: [] },
  { canonical: 'postgresql', variants: ['postgres', 'psql', 'pg'] },
  { canonical: 'mysql', variants: [] },
  { canonical: 'mongodb', variants: ['mongo'] },
  { canonical: 'redis', variants: [] },
  { canonical: 'elasticsearch', variants: ['elastic search', 'elastic'] },
  { canonical: 'dynamodb', variants: ['dynamo db', 'dynamo'] },
  { canonical: 'cassandra', variants: [] },
  { canonical: 'sqlite', variants: [] },
  { canonical: 'firebase', variants: [] },
  { canonical: 'supabase', variants: [] },
  { canonical: 'prisma', variants: [] },
  { canonical: 'sequelize', variants: [] },
  { canonical: 'typeorm', variants: [] },
  { canonical: 'knex', variants: ['knex.js'] },

  // DevOps & Cloud
  { canonical: 'docker', variants: [] },
  { canonical: 'kubernetes', variants: ['k8s', 'kube'] },
  { canonical: 'terraform', variants: [] },
  { canonical: 'ansible', variants: [] },
  { canonical: 'jenkins', variants: [] },
  { canonical: 'ci/cd', variants: ['cicd', 'ci cd', 'ci-cd', 'continuous integration', 'continuous delivery'] },
  { canonical: 'github actions', variants: ['gh actions'] },
  { canonical: 'gitlab ci', variants: ['gitlab-ci'] },
  { canonical: 'aws', variants: ['amazon web services'] },
  { canonical: 'azure', variants: ['microsoft azure'] },
  { canonical: 'gcp', variants: ['google cloud', 'google cloud platform'] },
  { canonical: 'nginx', variants: [] },
  { canonical: 'linux', variants: [] },
  { canonical: 'bash', variants: ['shell', 'shell scripting'] },

  // Data Science & ML
  { canonical: 'machine learning', variants: ['ml', 'machine-learning'] },
  { canonical: 'deep learning', variants: ['dl', 'deep-learning'] },
  { canonical: 'natural language processing', variants: ['nlp'] },
  { canonical: 'computer vision', variants: ['cv'] },
  { canonical: 'tensorflow', variants: ['tf'] },
  { canonical: 'pytorch', variants: ['torch'] },
  { canonical: 'pandas', variants: [] },
  { canonical: 'numpy', variants: [] },
  { canonical: 'scikit-learn', variants: ['sklearn', 'scikit learn'] },
  { canonical: 'data science', variants: ['data-science'] },
  { canonical: 'data engineering', variants: ['data-engineering'] },
  { canonical: 'spark', variants: ['apache spark', 'pyspark'] },

  // APIs & Architecture
  { canonical: 'rest', variants: ['restful', 'rest api', 'restful api'] },
  { canonical: 'graphql', variants: ['graph ql'] },
  { canonical: 'microservices', variants: ['micro services'] },
  { canonical: 'api', variants: [] },
  { canonical: 'oauth', variants: ['oauth2', 'oauth 2.0'] },
  { canonical: 'grpc', variants: [] },
  { canonical: 'websocket', variants: ['websockets', 'web socket', 'socket.io'] },
  { canonical: 'rabbitmq', variants: ['rabbit mq'] },
  { canonical: 'kafka', variants: ['apache kafka'] },

  // Tools & Practices
  { canonical: 'git', variants: ['github', 'gitlab', 'bitbucket'] },
  { canonical: 'agile', variants: [] },
  { canonical: 'scrum', variants: [] },
  { canonical: 'jira', variants: [] },
  { canonical: 'figma', variants: [] },
  { canonical: 'photoshop', variants: ['adobe photoshop'] },
  { canonical: 'illustrator', variants: ['adobe illustrator'] },

  // BI & Analytics
  { canonical: 'excel', variants: ['microsoft excel', 'ms excel'] },
  { canonical: 'power bi', variants: ['powerbi', 'power-bi'] },
  { canonical: 'tableau', variants: [] },
  { canonical: 'looker', variants: [] },

  // Mobile
  { canonical: 'react native', variants: ['react-native', 'reactnative'] },
  { canonical: 'flutter', variants: [] },
  { canonical: 'ios', variants: [] },
  { canonical: 'android', variants: [] },

  // Testing
  { canonical: 'jest', variants: [] },
  { canonical: 'mocha', variants: [] },
  { canonical: 'cypress', variants: [] },
  { canonical: 'playwright', variants: [] },
  { canonical: 'selenium', variants: [] },

  // Soft Skills
  { canonical: 'communication', variants: [] },
  { canonical: 'leadership', variants: [] },
  { canonical: 'problem solving', variants: ['problem-solving'] },
  { canonical: 'teamwork', variants: ['team work', 'collaboration'] },
  { canonical: 'project management', variants: ['project-management'] },
];

// Skill categories for partial-credit matching
const SKILL_CATEGORIES = {
  programming_languages: ['javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'dart', 'elixir', 'perl', 'lua', 'haskell', 'clojure'],
  frontend: ['react', 'angular', 'vue', 'svelte', 'next.js', 'nuxt.js', 'html', 'css', 'sass', 'tailwind', 'bootstrap', 'jquery', 'redux', 'webpack', 'vite'],
  backend: ['node.js', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails', '.net', 'nestjs', 'fastify', 'laravel', 'gin', 'fiber'],
  databases: ['sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'cassandra', 'sqlite', 'firebase', 'supabase', 'prisma', 'sequelize', 'typeorm', 'knex'],
  devops: ['docker', 'kubernetes', 'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab ci', 'nginx', 'linux', 'bash'],
  cloud: ['aws', 'azure', 'gcp'],
  data_science: ['machine learning', 'deep learning', 'natural language processing', 'computer vision', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn', 'data science', 'data engineering', 'spark'],
  apis: ['rest', 'graphql', 'microservices', 'api', 'oauth', 'grpc', 'websocket', 'rabbitmq', 'kafka'],
  mobile: ['react native', 'flutter', 'ios', 'android'],
  testing: ['jest', 'mocha', 'cypress', 'playwright', 'selenium'],
  soft_skills: ['communication', 'leadership', 'problem solving', 'teamwork', 'project management'],
};

// Build reverse lookup maps at startup
const VARIANT_TO_CANONICAL = new Map();
for (const group of SKILL_GROUPS) {
  const canon = group.canonical.toLowerCase();
  VARIANT_TO_CANONICAL.set(canon, canon);
  for (const v of group.variants) {
    VARIANT_TO_CANONICAL.set(v.toLowerCase(), canon);
  }
}

const CANONICAL_TO_CATEGORY = new Map();
for (const [category, skills] of Object.entries(SKILL_CATEGORIES)) {
  for (const skill of skills) {
    CANONICAL_TO_CATEGORY.set(skill, category);
  }
}

/**
 * Get canonical form of a skill. Returns canonical name or input lowercased if unknown.
 */
function getCanonical(skill) {
  return VARIANT_TO_CANONICAL.get(skill.toLowerCase().trim()) || skill.toLowerCase().trim();
}

/**
 * Get all variants of a skill (canonical + all known synonyms).
 */
function getSkillVariants(skill) {
  const lower = skill.toLowerCase().trim();
  const canon = VARIANT_TO_CANONICAL.get(lower) || lower;
  const variants = new Set([canon, lower]);

  // Find the group for this canonical and add all variants
  for (const group of SKILL_GROUPS) {
    if (group.canonical.toLowerCase() === canon) {
      variants.add(group.canonical.toLowerCase());
      for (const v of group.variants) {
        variants.add(v.toLowerCase());
      }
      break;
    }
  }

  // Also handle .js/.ts suffix removal
  const base = lower.replace(/\.(js|ts)$/, '');
  if (base !== lower) variants.add(base);

  return Array.from(variants);
}

/**
 * Get the category of a skill (e.g., 'frontend', 'databases').
 */
function getSkillCategory(skill) {
  const canon = getCanonical(skill);
  return CANONICAL_TO_CATEGORY.get(canon) || null;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
    }
  }
  return dp[m][n];
}

/**
 * Fuzzy match a skill against candidate skills. Returns matched skill or null.
 * Only used for skills with length >= 5 and distance <= 2.
 */
function fuzzySkillMatch(skill, candidateSkills, threshold = 2) {
  const lower = skill.toLowerCase().trim();
  if (lower.length < 5) return null;
  for (const cs of candidateSkills) {
    if (cs.length >= 4 && levenshtein(lower, cs) <= threshold) return cs;
  }
  return null;
}

/**
 * Check if a required skill is found in candidate skills (with synonym support)
 * or in raw text with word boundary.
 */
function skillMatches(skill, candidateSkillsLower, rawTextLower) {
  const variants = getSkillVariants(skill);
  if (candidateSkillsLower.some((cs) => variants.includes(cs))) return true;
  if (!rawTextLower) return false;
  return variants.some((v) => {
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(rawTextLower);
  });
}

module.exports = {
  SKILL_GROUPS,
  SKILL_CATEGORIES,
  getSkillVariants,
  getCanonical,
  getSkillCategory,
  skillMatches,
  fuzzySkillMatch,
  levenshtein,
};
