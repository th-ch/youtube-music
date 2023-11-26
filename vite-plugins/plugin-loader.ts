import { readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

import { createFilter } from 'vite';
import { Project, ts, ObjectLiteralExpression } from 'ts-morph';

import type { PluginOption } from 'vite';

export default function (mode: 'backend' | 'preload' | 'renderer' | 'none'): PluginOption {
  const pluginFilter = createFilter([
    'src/plugins/*/index.{js,ts}',
    'src/plugins/*',
  ]);

  return {
    name: 'ytm-plugin-loader',
    async load(id) {
      if (!pluginFilter(id)) return null;

      const project = new Project({
        tsConfigFilePath: resolve(__dirname, '..', 'tsconfig.json'),
        skipAddingFilesFromTsConfig: true,
        skipLoadingLibFiles: true,
        skipFileDependencyResolution: true,
      });

      const src = project.createSourceFile(
        '_pf' + basename(id),
        await readFile(id, 'utf8'),
      );
      const exports = src.getExportedDeclarations();
      let objExpr: ObjectLiteralExpression | undefined = undefined;

      for (const [name, [expr]] of exports) {
        if (name !== 'default') continue;

        switch (expr.getKind()) {
          case ts.SyntaxKind.ObjectLiteralExpression: {
            objExpr = expr.asKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
            break;
          }
          case ts.SyntaxKind.CallExpression: {
            const callExpr = expr.asKindOrThrow(ts.SyntaxKind.CallExpression);
            if (callExpr.getArguments().length !== 1) continue;

            const name = callExpr.getExpression().getText();
            if (name !== 'createPlugin') continue;

            const arg = callExpr.getArguments()[0];
            if (arg.getKind() !== ts.SyntaxKind.ObjectLiteralExpression)
              continue;

            objExpr = arg.asKindOrThrow(ts.SyntaxKind.ObjectLiteralExpression);
            break;
          }
        }
      }

      if (!objExpr) return null;

      const properties = objExpr.getProperties();
      const propertyNames = properties.map((prop) => {
        switch (prop.getKind()) {
          case ts.SyntaxKind.PropertyAssignment:
            return prop
              .asKindOrThrow(ts.SyntaxKind.PropertyAssignment)
              .getName();
          case ts.SyntaxKind.ShorthandPropertyAssignment:
            return prop
              .asKindOrThrow(ts.SyntaxKind.ShorthandPropertyAssignment)
              .getName();
          case ts.SyntaxKind.MethodDeclaration:
            return prop
              .asKindOrThrow(ts.SyntaxKind.MethodDeclaration)
              .getName();
          default:
            throw new Error('Not implemented');
        }
      });

      const contexts = ['backend', 'preload', 'renderer'];
      for (const ctx of contexts) {
        if (mode === 'none') {
          const index = propertyNames.indexOf(ctx);
          if (index === -1) continue;

          objExpr.getProperty(propertyNames[index])?.remove();
          continue;
        }

        if (ctx === mode) continue;

        const index = propertyNames.indexOf(ctx);
        if (index === -1) continue;

        objExpr.getProperty(propertyNames[index])?.remove();
      }

      return {
        code: src.getText(),
      };
    },
  };
}
