import { type PluginOption } from "vite";

import { createFilter } from "@rollup/pluginutils";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

// @ts-ignore
import { pathExists } from "fs-extra/esm";
import { glob } from "glob";

const snakeToCamel = (text: string) => text.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());
const getContextName = (context: "back" | "preload" | "front") => ({
    back: "backend",
    preload: "preload",
    front: "renderer"
})[context];

export default function(): PluginOption {
    const isMain = createFilter("src/index.ts");
    const isRenderer = createFilter("src/renderer.ts");
    const isPreload = createFilter("src/preload.ts");

    const plugins = async() => await glob(`${__dirname}/../src/plugins/*`)
        .then(paths => paths.map(path => ({ name: basename(path), path })));


    const load = async (id: string, mode: "back" | "preload" | "front") => {
        let pluginsToImport = [];

        for (const plugin of await plugins()) {
            if (await pathExists(`${plugin.path}/${mode}.ts`)) {
                pluginsToImport.push(plugin);
            }
        }

        let imports = pluginsToImport
            .map(({ name, path }) => `import ${snakeToCamel(name)}Plugin from "${path}/${mode}";`)
            .join("\n");
        
        const pluginsObj = `const ${getContextName(mode)}Plugins: PluginMapper<'${getContextName(mode)}'> = {\n    ${
            pluginsToImport.map(({name}) => `"${name}": ${snakeToCamel(name)}Plugin`).join(',\n    ')
        }\n}`;

        let code = await readFile(id.split('?')[0], { encoding: "utf8" });
        code = `${imports}\n\n${pluginsObj}\n\n${code}`;

        return { code }
    }

    return {
        name: "vite-auto-import-plugins",
        async load(id, options) {
            if (isMain(id))
                return await load(id, "back");
            
            if (isPreload(id))
                return await load(id, "preload");
        
            if (isRenderer(id))
                return await load(id, "front");
        },
    };
}
