import { z } from '@hono/zod-openapi';

export const QueueParamsSchema = z.object({
  index: z.coerce.number().int().nonnegative(),
});

export const AddSongToQueueSchema = z.object({
  videoId: z.string(),
});
export const MoveSongInQueueSchema = z.object({
  toIndex: z.number(),
});
export const SetQueueIndexSchema = z.object({
  index: z.number().int().nonnegative(),
});
