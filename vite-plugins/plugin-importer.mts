import { basename, relative, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { globSync } from 'glob';
import { Project } from 'ts-morph';

const snakeToCamel = (text: string) =>
  text.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

export const pluginVirtualModuleGenerator = (
  mode: 'main' | 'preload' | 'renderer',
) => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const project = new Project({
    tsConfigFilePath: resolve(__dirname, '..', 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    skipLoadingLibFiles: true,
    skipFileDependencyResolution: true,
  });

  const srcPath = resolve(__dirname, '..', 'src');
  const plugins = globSync([
    'src/plugins/*/index.{js,ts}',
    'src/plugins/*.{js,ts}',
    '!src/plugins/utils/**/*',
    '!src/plugins/utils/*',
  ]).map((path) => {
    let name = basename(path);
    if (name === 'index.ts' || name === 'index.js') {
      name = basename(resolve(path, '..'));
    }

    name = name.replace(extname(name), '');

    return { name, path };
  });

  const src = project.createSourceFile('vm:pluginIndexes', (writer) => {
    // prettier-ignore
    for (const { name, path } of plugins) {
      const relativePath = relative(resolve(srcPath, '..'), path).replace(/\\/g, '/');
      writer.writeLine(`import ${snakeToCamel(name)}Plugin, { pluginStub as ${snakeToCamel(name)}PluginStub } from "./${relativePath}";`);
    }

    writer.blankLine();

    // Context-specific exports
    writer.writeLine(`export const ${mode}Plugins = {`);
    for (const { name } of plugins) {
      const checkMode = mode === 'main' ? 'backend' : mode;
      // HACK: To avoid situation like importing renderer plugins in main
      writer.writeLine(
        `  ...(${snakeToCamel(name)}Plugin['${checkMode}'] ? { "${name}": ${snakeToCamel(name)}Plugin } : {}),`,
      );
    }
    writer.writeLine('};');
    writer.blankLine();

    // All plugins export (stub only) // Omit<Plugin, 'backend' | 'preload' | 'renderer'>
    writer.writeLine('export const allPlugins = {');
    for (const { name } of plugins) {
      writer.writeLine(`  "${name}": ${snakeToCamel(name)}PluginStub,`);
    }
    writer.writeLine('};');
    writer.blankLine();
  });

  return src.getText();
};
