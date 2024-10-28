import { t } from '@/i18n';

interface ErrorDisplayProps {
  error: Error;
}

// prettier-ignore
export const ErrorDisplay = (props: ErrorDisplayProps) => {
  return (
    <div style={{ 'margin-bottom': '5%' }}>
      <pre
        style={{
          'background-color': 'var(--ytmusic-color-black1)',
          'border-radius': '8px',
          'color': '#58f000',
          'white-space': 'pre',
          'overflow-x': 'auto',
          'max-width': '100%',
          'margin-top': '1em',
          'padding': '0.5em',
          'font-family': 'serif',
          'font-size': 'large',
        }}
      >
        {t('plugins.synced-lyrics.errors.fetch')}
      </pre>
      <pre
        style={{
          'background-color': 'var(--ytmusic-color-black1)',
          'border-radius': '8px',
          'color': '#f0a500',
          'white-space': 'pre',
          'overflow-x': 'auto',
          'max-width': '100%',
          'margin-top': '1em',
          'padding': '0.5em',
          'font-family': 'monospace',
          'font-size': 'large',
        }}
      >
        {props.error.stack}
      </pre>
    </div>
  );
};
