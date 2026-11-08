/**
 * Jumby Surgical Diff Patcher
 * 
 * Parses and applies SEARCH/REPLACE diff blocks to existing micro-game code.
 * Enables sub-2-second remixes without full file regenerations.
 */

export interface DiffPatchResult {
  success: boolean;
  patchedCode: string;
  patchesApplied: number;
  errors: string[];
}

/**
 * Checks if text contains SEARCH/REPLACE diff blocks.
 */
export function containsDiffBlocks(text: string): boolean {
  return /<{4,7}\s*SEARCH[\s\S]*?={4,7}[\s\S]*?>{4,7}\s*REPLACE/i.test(text);
}

/**
 * Applies SEARCH/REPLACE diff blocks to baseCode.
 */
export function applySearchReplacePatch(baseCode: string, patchText: string): DiffPatchResult {
  if (!baseCode || !patchText) {
    return {
      success: false,
      patchedCode: baseCode || '',
      patchesApplied: 0,
      errors: ['Missing baseCode or patchText'],
    };
  }

  const blockRegex = /<{4,7}\s*SEARCH\s*\n([\s\S]*?)\n={4,7}\s*\n([\s\S]*?)\n>{4,7}\s*REPLACE/gi;
  let match: RegExpExecArray | null;
  let currentCode = baseCode;
  let patchesApplied = 0;
  const errors: string[] = [];

  while ((match = blockRegex.exec(patchText)) !== null) {
    const searchTarget = match[1];
    const replacement = match[2];

    if (!searchTarget.trim()) continue;

    // 1. Try exact string replacement
    if (currentCode.includes(searchTarget)) {
      currentCode = currentCode.replace(searchTarget, replacement);
      patchesApplied++;
      continue;
    }

    // 2. Try normalized whitespace replacement (matching line-by-line while ignoring indent differences)
    const normalizedTarget = searchTarget.replace(/\r\n/g, '\n').trim();
    const codeLines = currentCode.replace(/\r\n/g, '\n').split('\n');
    const targetLines = normalizedTarget.split('\n');

    let foundIndex = -1;
    for (let i = 0; i <= codeLines.length - targetLines.length; i++) {
      let matches = true;
      for (let j = 0; j < targetLines.length; j++) {
        if (codeLines[i + j].trim() !== targetLines[j].trim()) {
          matches = false;
          break;
        }
      }
      if (matches) {
        foundIndex = i;
        break;
      }
    }

    if (foundIndex !== -1) {
      codeLines.splice(foundIndex, targetLines.length, replacement);
      currentCode = codeLines.join('\n');
      patchesApplied++;
    } else {
      errors.push(`Could not locate SEARCH block in code: "${searchTarget.slice(0, 60)}..."`);
    }
  }

  return {
    success: patchesApplied > 0 && errors.length === 0,
    patchedCode: currentCode,
    patchesApplied,
    errors,
  };
}
