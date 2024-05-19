import { z } from '@hono/zod-openapi';

export const AuthHeadersSchema = z.object({
  authorization: z.string().openapi({
    example: 'Bearer token',
  }),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
export const JWTPayloadSchema = z.object({
  id: z.string(),
  iat: z.number(),
});
