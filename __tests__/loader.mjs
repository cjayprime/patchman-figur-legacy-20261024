import fs from 'node:fs/promises';
import ts from 'typescript';

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (error) {
    if (!specifier.startsWith('.') || /\.[a-z]+$/i.test(specifier)) {
      throw error;
    }
    for (const suffix of ['.ts', '.tsx', '/index.ts']) {
      try {
        return await next(specifier + suffix, context);
      } catch {
        /* Try the next TypeScript suffix. */
      }
    }
    throw error;
  }
}
export async function load(url, context, next) {
  if (!/\.tsx?$/.test(url)) {
    return next(url, context);
  }
  const source = await fs.readFile(new URL(url), 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: 'module', shortCircuit: true, source: result.outputText };
}
