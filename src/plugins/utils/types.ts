export type PluginConfig<T extends keyof PluginBuilderList> = PluginBuilderList[T]['config'];
