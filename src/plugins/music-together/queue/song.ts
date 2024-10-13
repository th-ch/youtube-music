import { extractToken, getAuthorizationHeader, getClient } from './client';

type QueueRendererResponse = {
  queueDatas: {
    content: unknown;
  }[];
  responseContext: unknown;
  trackingParams: string;
};

export const getMusicQueueRenderer = async (
  videoIds: string[],
): Promise<QueueRendererResponse | null> => {
  const token = extractToken();
  if (!token) return null;

  const response = await fetch(
    'https://music.youtube.com/youtubei/v1/music/get_queue?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30&prettyPrint=false',
    {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({
        context: {
          client: getClient(),
          request: {
            useSsl: true,
            internalExperimentFlags: [],
            consistencyTokenJars: [],
          },
          user: {
            lockedSafetyMode: false,
          },
        },
        videoIds,
      }),
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://music.youtube.com',
        'Authorization': await getAuthorizationHeader(token),
      },
    },
  );

  const text = await response.text();
  try {
    return JSON.parse(text) as QueueRendererResponse;
  } catch {}

  return null;
};
