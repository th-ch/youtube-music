import { basename, relative, resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { globSync } from 'glob';
import { Project } from 'ts-morph';

const snakeToCamel = (text: string) =>
  text.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

export const i18nImporter = () => {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const project = new Project({
    tsConfigFilePath: resolve(__dirname, '..', 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
    skipLoadingLibFiles: true,
    skipFileDependencyResolution: true,
  });

  const srcPath = resolve(__dirname, '..', 'src');
  const plugins = globSync(['src/i18n/resources/*.json']).map((path) => {
    const nameWithExt = basename(path);
    const name = nameWithExt.replace(extname(nameWithExt), '');

    return { name, path };
  });

  const src = project.createSourceFile('vm:i18n', (writer) => {
    // prettier-ignore
    for (const { name, path } of plugins) {
      const relativePath = relative(resolve(srcPath, '..'), path).replace(/\\/g, '/');
      writer.writeLine(`import ${snakeToCamel(name)}Json from "./${relativePath}";`);
    }

    writer.blankLine();

    writer.writeLine('export const languageResources = {');
    for (const { name } of plugins) {
      writer.writeLine(`  "${name}": {`);
      writer.writeLine(`    translation: ${snakeToCamel(name)}Json,`);
      writer.writeLine('  },');
    }
    writer.writeLine('};');
    writer.blankLine();
  });

  return src.getText();
};
