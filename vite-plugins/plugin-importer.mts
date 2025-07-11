import { basename, relative, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { globSync } from 'glob';
import { Project } from 'ts-morph';

const snakeToCamel = (text: string) =>
  text.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

const __dirname = dirname(fileURLToPath(import.meta.url));
const globalProject = new Project({
  tsConfigFilePath: resolve(__dirname, '..', 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
  skipLoadingLibFiles: true,
  skipFileDependencyResolution: true,
});

export const pluginVirtualModuleGenerator = (
  mode: 'main' | 'preload' | 'renderer',
) => {
  const srcPath = resolve(__dirname, '..', 'src');
  const plugins = globSync([
    'src/plugins/*/index.{js,ts,jsx,tsx}',
    'src/plugins/*.{js,ts,jsx,tsx}',
    '!src/plugins/utils/**/*',
    '!src/plugins/utils/*',
  ]).map((path) => {
    let name = basename(path);
    if (
      name === 'index.ts' ||
      name === 'index.js' ||
      name === 'index.jsx' ||
      name === 'index.tsx'
    ) {
      name = basename(resolve(path, '..'));
    }

    name = name.replace(extname(name), '');

    return { name, path };
  });

  const src = globalProject.createSourceFile(
    'vm:pluginIndexes',
    (writer) => {
      for (const { name, path } of plugins) {
        const relativePath = relative(resolve(srcPath, '..'), path).replace(
          /\\/g,
          '/',
        );
        if (mode === 'main') {
          // dynamic import (for main)
          writer.writeLine(
            `const ${snakeToCamel(name)}PluginImport = () => import('./${relativePath}');`,
          );
          writer.writeLine(
            `const ${snakeToCamel(name)}Plugin = async () => (await ${snakeToCamel(name)}PluginImport()).default;`,
          );
          writer.writeLine(
            `const ${snakeToCamel(name)}PluginStub = async () => (await ${snakeToCamel(name)}PluginImport()).pluginStub;`,
          );
        } else {
          // static import (preload does not support dynamic import)
          writer.writeLine(
            `import ${snakeToCamel(name)}PluginImport, { pluginStub as ${snakeToCamel(name)}PluginStubImport } from "./${relativePath}";`,
          );
          writer.writeLine(
            `const ${snakeToCamel(name)}Plugin = () => Promise.resolve(${snakeToCamel(name)}PluginImport);`,
          );
          writer.writeLine(
            `const ${snakeToCamel(name)}PluginStub = () => Promise.resolve(${snakeToCamel(name)}PluginStubImport);`,
          );
        }
      }

      writer.blankLine();

      // Context-specific exports
      writer.writeLine(`let ${mode}PluginsCache;`);
      writer.writeLine(`export const ${mode}Plugins = async () => {`);
      writer.writeLine(
        `  if (${mode}PluginsCache) return ${mode}PluginsCache;`,
      );
      writer.writeLine(`  ${mode}PluginsCache = {`);
      for (const { name } of plugins) {
        const checkMode = mode === 'main' ? 'backend' : mode;
        // HACK: To avoid situation like importing renderer plugins in main
        writer.writeLine(
          `    ...(await ${snakeToCamel(name)}Plugin().then((plg) => (plg['${checkMode}'] ? { "${name}": plg } : {}))),`,
        );
      }
      writer.writeLine('  };');
      writer.writeLine(`  return ${mode}PluginsCache;`);
      writer.writeLine('};');
      writer.blankLine();

      // All plugins export (stub only) // Omit<Plugin, 'backend' | 'preload' | 'renderer'>
      writer.writeLine('let allPluginsCache;');
      writer.writeLine('export const allPlugins = async () => {');
      writer.writeLine('  if (allPluginsCache) return allPluginsCache;');
      writer.writeLine('  allPluginsCache = {');
      for (const { name } of plugins) {
        writer.writeLine(
          `    "${name}": await ${snakeToCamel(name)}PluginStub(),`,
        );
      }
      writer.writeLine('  };');
      writer.writeLine('  return allPluginsCache;');
      writer.writeLine('};');
      writer.blankLine();
    },
    { overwrite: true },
  );

  return src.getText();
};
