import { t } from "@/i18n";
import { createPlugin } from "@/utils";

import { renderer } from "./renderer";
import style from "./styles.css?inline";

export default createPlugin({
  name: () => t("plugins.settings-ui.name"),
  description: () => t("plugins.settings-ui.description"),
  restartNeeded: false,
  config: { enabled: true },
  renderer: renderer,
  stylesheets: [style],
});
