import { render } from 'solid-js/web';

import style from './style.css?inline';
import { createPlugin } from '@/utils';

import { t } from '@/i18n';

import { ForwardButton } from './components/forward-button';
import { BackButton } from './components/back-button';

export default createPlugin({
  name: () => t('plugins.navigation.name'),
  description: () => t('plugins.navigation.description'),
  restartNeeded: false,
  config: {
    enabled: true,
  },
  stylesheets: [style],
  renderer: {
    buttonContainer: document.createElement('div'),
    start() {
      if (!this.buttonContainer) {
        this.buttonContainer = document.createElement('div');
      }

      render(
        () => (
          <>
            <BackButton
              onClick={() => history.back()}
              title={t('plugins.navigation.templates.back.title')}
            />
            <ForwardButton
              onClick={() => history.forward()}
              title={t('plugins.navigation.templates.forward.title')}
            />
          </>
        ),
        this.buttonContainer,
      );
      const menu = document.querySelector('#right-content');
      menu?.prepend(this.buttonContainer);
    },
    stop() {
      this.buttonContainer.remove();
    },
  },
});
