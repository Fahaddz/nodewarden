const fs = require('node:fs');

const MODEL = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';
const API_KEY = process.env.GEMINI_API_KEY;
const OUTPUT_PATH = process.env.OUTPUT_PATH || 'ai-review.md';
const PR_METADATA_PATH = process.env.PR_METADATA_PATH;
const SECURITY_METADATA_PATH = process.env.SECURITY_METADATA_PATH;
const DIFF_PATH = process.env.DIFF_PATH;
const MAX_DIFF_CHARS = Number(process.env.MAX_DIFF_CHARS || '300000');

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function readText(path) {
  return fs.readFileSync(path, 'utf8');
}

function truncateText(value, maxChars) {
  if (value.length <= maxChars) {
    return { text: value, truncated: false };
  }
  return {
    text: `${value.slice(0, maxChars)}\n\n[diff truncated after ${maxChars} characters]`,
    truncated: true,
  };
}

async function main() {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  if (!PR_METADATA_PATH || !SECURITY_METADATA_PATH || !DIFF_PATH) {
    throw new Error('Required input paths are missing');
  }

  const pr = readJson(PR_METADATA_PATH);
  const security = readJson(SECURITY_METADATA_PATH);
  const rawDiff = readText(DIFF_PATH);
  const diff = truncateText(rawDiff, MAX_DIFF_CHARS);

  const prompt = [
    'You are reviewing an upstream update PR for a self-hosted password manager deployment.',
    'The repo is NodeWarden, a Bitwarden-compatible server running on Cloudflare Workers.',
    'The user is not qualified to perform deep code review alone.',
    'Your job is to review the PR diff plus the security scan result and produce a concise, practical markdown review.',
    '',
    'Focus on:',
    '- auth and token handling',
    '- crypto and key handling',
    '- backup, import, export, restore, and attachment handling',
    '- workflow, CI, deployment, and secret exposure changes',
    '- Cloudflare-specific trust boundary changes',
    '- obvious regressions or risky behavior changes',
    '',
    'Do not claim certainty when unsure. If evidence is limited because the diff was truncated, say so clearly.',
    'Treat a successful security workflow as only one signal, not proof that the PR is safe.',
    '',
    'Return markdown with these sections exactly:',
    '## AI Summary',
    '## Risk Level',
    '## Security Scan',
    '## Key Findings',
    '## Merge Recommendation',
    '',
    'Risk Level must be one of: low, medium, high.',
    'Merge Recommendation must begin with one of: mergeable with normal caution, merge only after manual checks, do not merge yet.',
    '',
    'PR metadata:',
    JSON.stringify(pr, null, 2),
    '',
    'Security workflow metadata:',
    JSON.stringify(security, null, 2),
    '',
    `Diff truncated: ${diff.truncated ? 'yes' : 'no'}`,
    '',
    'PR diff:',
    diff.text,
  ].join('\n');

  const body = {
    system_instruction: {
      parts: [
        {
          text: 'You are a senior software security reviewer. Be concrete, conservative, and concise.',
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
    },
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error('Gemini API returned an empty response');
  }

  const review = [
    '> Automated Gemini review for the current `upstream-review -> main` PR.',
    `> Model: \`${MODEL}\``,
    `> Diff truncated for prompt size: \`${diff.truncated ? 'yes' : 'no'}\``,
    '',
    text,
  ].join('\n');

  fs.writeFileSync(OUTPUT_PATH, review);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
