import { readFileSync } from 'node:fs';
import { resolve, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createFilter } from 'vite';
import {
  Project,
  ts,
  ObjectLiteralExpression,
  VariableDeclarationKind,
  Node,
  type ObjectLiteralElementLike,
} from 'ts-morph';

import type { PluginOption } from 'vite';

// Initialize a global project instance to reuse across load calls
const __dirname = dirname(fileURLToPath(import.meta.url));
const globalProject = new Project({
  tsConfigFilePath: resolve(__dirname, '..', 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
  skipLoadingLibFiles: true,
  skipFileDependencyResolution: true,
});

// Helper to extract a property’s name from its node
const getPropertyName = (prop: Node): string | null => {
  const kind = prop.getKind();
  if (
    kind === ts.SyntaxKind.PropertyAssignment ||
    kind === ts.SyntaxKind.ShorthandPropertyAssignment ||
    kind === ts.SyntaxKind.MethodDeclaration
  ) {
    return prop.getFirstChildByKindOrThrow(ts.SyntaxKind.Identifier).getText();
  }
  return null;
};

export default function (
  mode: 'backend' | 'preload' | 'renderer' | 'none',
): PluginOption {
  const pluginFilter = createFilter([
    'src/plugins/*/index.{js,ts}',
    'src/plugins/*',
  ]);

  return {
    name: 'ytm-plugin-loader',
    load(id) {
      if (!pluginFilter(id)) return null;

      // Read file asynchronously
      const fileContent = readFileSync(id, 'utf8');
      // Create or update source file in the global project instance
      const src = globalProject.createSourceFile(
        '_pf' + basename(id),
        fileContent,
        { overwrite: true },
      );

      const exports = src.getExportedDeclarations();
      let objExpr: ObjectLiteralExpression | undefined;

      // Identify the default export as an object literal, or via a 'createPlugin' call
      for (const [exportName, declarations] of exports) {
        if (exportName !== 'default') continue;
        const expr = declarations[0];

        const exprKind = expr.getKind();
        if (exprKind === ts.SyntaxKind.ObjectLiteralExpression) {
          objExpr = expr.asKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
          break;
        } else if (exprKind === ts.SyntaxKind.CallExpression) {
          const callExpr = expr.asKindOrThrow(ts.SyntaxKind.CallExpression);
          if (
            callExpr.getArguments().length === 1 &&
            callExpr.getExpression().getText() === 'createPlugin'
          ) {
            const arg = callExpr.getArguments()[0];
            if (arg.getKind() === ts.SyntaxKind.ObjectLiteralExpression) {
              objExpr = arg.asKindOrThrow(
                ts.SyntaxKind.ObjectLiteralExpression,
              );
              break;
            }
          }
        }
      }

      if (!objExpr) return null;

      // Build a map of property names to their AST nodes for fast lookup
      const propMap = new Map<string, ObjectLiteralElementLike>();
      for (const prop of objExpr.getProperties()) {
        const name = getPropertyName(prop);
        if (name) propMap.set(name, prop);
      }

      const contexts = ['backend', 'preload', 'renderer', 'menu'];
      for (const ctx of contexts) {
        if (mode === 'none' && propMap.has(ctx)) {
          propMap.get(ctx)?.remove();
          continue;
        }
        if (ctx === mode || (ctx === 'menu' && mode === 'backend')) continue;
        if (propMap.has(ctx)) propMap.get(ctx)?.remove();
      }

      // Add an exported variable 'pluginStub' with the modified object literal's text
      const varStmt = src.addVariableStatement({
        isExported: true,
        declarationKind: VariableDeclarationKind.Const,
        declarations: [
          {
            name: 'pluginStub',
            initializer: (writer) => writer.write(objExpr.getText()),
          },
        ],
      });
      const stubObjExpr = varStmt
        .getDeclarations()[0]
        .getInitializerIfKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);

      // Similarly build a map for the stub properties
      const stubMap = new Map<string, ObjectLiteralElementLike>();
      for (const prop of stubObjExpr.getProperties()) {
        const name = getPropertyName(prop);
        if (name) stubMap.set(name, prop);
      }

      const stubContexts =
        mode === 'backend'
          ? contexts.filter((ctx) => ctx !== 'menu')
          : contexts;
      for (const ctx of stubContexts) {
        if (stubMap.has(ctx)) {
          stubMap.get(ctx)?.remove();
        }
      }

      return {
        code: src.getText(),
      };
    },
  };
}
