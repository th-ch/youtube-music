import { existsSync } from 'node:fs';
import { basename, relative, resolve } from 'node:path';

import { globSync } from 'glob';

type PluginType = 'index' | 'main' | 'preload' | 'renderer' | 'menu';

const snakeToCamel = (text: string) => text.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
const getName = (mode: PluginType, name: string) => {
  if (mode === 'index') {
    return snakeToCamel(name);
  }

  return `${snakeToCamel(name)}Plugin`;
};
const getListName = (mode: PluginType) => {
  if (mode === 'index') return 'pluginBuilders';

  return `${mode}Plugins`;
};

export const pluginVirtualModuleGenerator = (mode: PluginType) => {
  const srcPath = resolve(__dirname, '..', 'src');

  const plugins = globSync(`${srcPath}/plugins/*`)
    .map((path) => ({ name: basename(path), path }))
    .filter(({ name, path }) => {
      if (name.startsWith('utils')) return false;

      return existsSync(resolve(path, `${mode}.ts`));
    });

    console.log('converted plugin list');
    console.log(plugins.map((it) => it.name));

  let result = '';

  for (const { name, path } of plugins) {
    result += `import ${getName(mode, name)} from "./${relative(resolve(srcPath, '..'), path).replace(/\\/g, '/')}/${mode}";\n`;
  }

  result += `export const ${getListName(mode)} = {\n`;
  for (const { name } of plugins) {
    result += `  "${name}": ${getName(mode, name)},\n`;
  }
  result += '};';

  return result;
};
