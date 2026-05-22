const HF_API = 'https://api-inference.huggingface.co/models';

const EXPLANATION_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
const FINGERPRINT_MODEL = 'google/flan-t5-large';
const FALLBACK_MODEL = 'HuggingFaceH4/zephyr-7b-beta';

const AGENT_LABELS = [
  'legacy-spaghetti',
  'god-object',
  'callback-hell',
  'copy-paste-clone',
  'dead-code',
  'over-engineered',
  'tight-coupling',
  'missing-abstraction',
];

interface HFTextResponse {
  generated_text?: string;
  error?: string;
}

async function callHF(
  model: string,
  inputs: string,
  options?: { max_new_tokens?: number; wait_for_model?: boolean }
): Promise<string> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY is not configured');
  }

  const response = await fetch(`${HF_API}/${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs,
      parameters: {
        max_new_tokens: options?.max_new_tokens ?? 256,
        return_full_text: false,
        temperature: 0.3,
      },
      options: {
        wait_for_model: options?.wait_for_model ?? true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 503 && model !== FALLBACK_MODEL) {
      return callHF(FALLBACK_MODEL, inputs, options);
    }
    throw new Error(`HuggingFace API error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as HFTextResponse[] | HFTextResponse;
  const result = Array.isArray(data) ? data[0] : data;
  if (result?.error) throw new Error(result.error);
  return (result?.generated_text ?? '').trim();
}

export async function generateDebtExplanation(context: {
  filePath: string;
  symbolName: string;
  debtScore: number;
  complexity: number;
  blastRadius: number;
  codeSnippet: string;
}): Promise<string> {
  const prompt = `<s>[INST] You are a senior software architect analyzing technical debt.

Analyze this code symbol and explain its technical debt in 2-3 concise sentences. Focus on maintainability risks, coupling, and refactoring priority.

File: ${context.filePath}
Symbol: ${context.symbolName}
Debt Score: ${context.debtScore}/100
Complexity: ${context.complexity}
Blast Radius: ${context.blastRadius} dependent symbols

Code:
\`\`\`
${context.codeSnippet.slice(0, 1500)}
\`\`\`

Provide a clear, actionable explanation. [/INST]`;

  try {
    return await callHF(EXPLANATION_MODEL, prompt, { max_new_tokens: 200 });
  } catch {
    const fallbackPrompt = `Explain technical debt for ${context.symbolName} in ${context.filePath} (score ${context.debtScore}): ${context.codeSnippet.slice(0, 500)}`;
    return await callHF(FALLBACK_MODEL, fallbackPrompt, { max_new_tokens: 150 });
  }
}

export async function classifyAgentCode(codeSnippet: string): Promise<{
  label: string;
  confidence: number;
}> {
  const labelsStr = AGENT_LABELS.join(', ');
  const prompt = `Classify this code snippet into exactly one technical debt category from: ${labelsStr}. Reply with only the category name.

Code:
${codeSnippet.slice(0, 800)}`;

  try {
    const result = await callHF(FINGERPRINT_MODEL, prompt, {
      max_new_tokens: 32,
    });
    const normalized = result.toLowerCase().trim();
    const matched = AGENT_LABELS.find((l) => normalized.includes(l.replace(/-/g, '')) || normalized.includes(l));
    if (matched) {
      return { label: matched, confidence: 0.85 };
    }
    return { label: normalized || 'legacy-spaghetti', confidence: 0.6 };
  } catch {
    return heuristicFingerprint(codeSnippet);
  }
}

function heuristicFingerprint(code: string): { label: string; confidence: number } {
  const lines = code.split('\n');
  if (code.match(/function\s*\([^)]*\)\s*{[^}]*function/g)) {
    return { label: 'callback-hell', confidence: 0.7 };
  }
  if (lines.length > 200) return { label: 'god-object', confidence: 0.65 };
  if ((code.match(/if\s*\(/g) || []).length > 15) {
    return { label: 'legacy-spaghetti', confidence: 0.6 };
  }
  if ((code.match(/import|require/g) || []).length > 20) {
    return { label: 'tight-coupling', confidence: 0.55 };
  }
  return { label: 'missing-abstraction', confidence: 0.5 };
}
