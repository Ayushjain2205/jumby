/**
 * Jumby AST Validator & Static Syntax Verifier
 * Uses pure JS Acorn parser to inspect generated game scripts before delivery.
 * Catches unclosed brackets, syntax errors, and malformed tokens in ~2-5ms.
 */

import * as acorn from 'acorn';

export interface AstValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
  codeSnippet?: string;
  scriptCount: number;
}

/**
 * Extracts inline JavaScript code from an HTML string (ignoring external script tags like src="...").
 */
export function extractInlineScripts(html: string): { code: string; startIndex: number }[] {
  const scripts: { code: string; startIndex: number }[] = [];
  // Match script tags without src attribute or where src is empty
  const scriptRegex = /<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(html)) !== null) {
    if (match[1] && match[1].trim().length > 0) {
      scripts.push({
        code: match[1],
        startIndex: match.index,
      });
    }
  }

  return scripts;
}

/**
 * Validates the JavaScript syntax of all inline scripts in the HTML document.
 */
export function validateGameAst(html: string): AstValidationResult {
  if (!html || typeof html !== 'string') {
    return {
      valid: false,
      error: 'Empty or non-string HTML content',
      scriptCount: 0,
    };
  }

  const scripts = extractInlineScripts(html);

  if (scripts.length === 0) {
    // If no inline scripts found, check if it's raw JS code mistakenly returned without HTML wrappers
    if (html.includes('function') || html.includes('const ') || html.includes('let ')) {
      try {
        acorn.parse(html, { ecmaVersion: 'latest', sourceType: 'script' });
        return { valid: true, scriptCount: 1 };
      } catch (err: any) {
        return {
          valid: false,
          error: `Raw JS syntax error: ${err.message}`,
          line: err.loc?.line,
          column: err.loc?.column,
          scriptCount: 0,
        };
      }
    }

    return {
      valid: false,
      error: 'No inline <script> tags found in HTML',
      scriptCount: 0,
    };
  }

  for (let i = 0; i < scripts.length; i++) {
    const { code } = scripts[i];
    try {
      acorn.parse(code, {
        ecmaVersion: 'latest',
        sourceType: 'script',
        locations: true,
      });
    } catch (err: any) {
      const line = err.loc?.line || 1;
      const column = err.loc?.column || 0;

      // Extract a 5-line contextual snippet around the error
      const codeLines = code.split('\n');
      const startLine = Math.max(0, line - 3);
      const endLine = Math.min(codeLines.length, line + 2);
      const snippet = codeLines
        .slice(startLine, endLine)
        .map((l, idx) => {
          const currLine = startLine + idx + 1;
          const marker = currLine === line ? '>> ' : '   ';
          return `${marker}${currLine}: ${l}`;
        })
        .join('\n');

      return {
        valid: false,
        error: `SyntaxError in <script> [${i + 1}]: ${err.message}`,
        line,
        column,
        codeSnippet: snippet,
        scriptCount: scripts.length,
      };
    }
  }

  return {
    valid: true,
    scriptCount: scripts.length,
  };
}
