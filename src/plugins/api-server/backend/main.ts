import { jwt } from 'hono/jwt';
import { OpenAPIHono as Hono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { serve } from '@hono/node-server';

import registerCallback from '@/providers/song-info';
import { createBackend } from '@/utils';

import { JWTPayloadSchema } from './scheme';
import { registerAuth, registerControl } from './routes';

import { type APIServerConfig, AuthStrategy } from '../config';

import type { BackendType } from './types';
import type { RepeatMode } from '@/types/datahost-get-state';

export const backend = createBackend<BackendType, APIServerConfig>({
  async start(ctx) {
    const config = await ctx.getConfig();

    await this.init(ctx);
    registerCallback((songInfo) => {
      this.songInfo = songInfo;
    });

    ctx.ipc.on('ytmd:player-api-loaded', () => {
      ctx.ipc.send('ytmd:setup-time-changed-listener');
      ctx.ipc.send('ytmd:setup-repeat-changed-listener');
      ctx.ipc.send('ytmd:setup-volume-changed-listener');
    });

    ctx.ipc.on(
      'ytmd:repeat-changed',
      (mode: RepeatMode) => (this.currentRepeatMode = mode),
    );

    ctx.ipc.on(
      'ytmd:volume-changed',
      (newVolume: number) => (this.volume = newVolume),
    );

    this.run(config.hostname, config.port);
  },
  stop() {
    this.end();
  },
  onConfigChange(config) {
    if (
      this.oldConfig?.hostname === config.hostname &&
      this.oldConfig?.port === config.port
    ) {
      this.oldConfig = config;
      return;
    }

    this.end();
    this.run(config.hostname, config.port);
    this.oldConfig = config;
  },

  // Custom
  async init(ctx) {
    const config = await ctx.getConfig();
    this.app = new Hono();

    this.app.use('*', cors());

    // for web remote control
    this.app.use('*', async (ctx, next) => {
      ctx.header('Access-Control-Request-Private-Network', 'true');
      await next();
    });

    // middlewares
    this.app.use('/api/*', async (ctx, next) => {
      if (config.authStrategy !== AuthStrategy.NONE) {
        return await jwt({
          secret: config.secret,
        })(ctx, next);
      }
      await next();
    });
    this.app.use('/api/*', async (ctx, next) => {
      const result = await JWTPayloadSchema.spa(await ctx.get('jwtPayload'));

      const isAuthorized =
        config.authStrategy === AuthStrategy.NONE ||
        (result.success && config.authorizedClients.includes(result.data.id));
      if (!isAuthorized) {
        ctx.status(401);
        return ctx.body('Unauthorized');
      }

      return await next();
    });

    // routes
    registerControl(
      this.app,
      ctx,
      () => this.songInfo,
      () => this.currentRepeatMode,
      () => this.volume,
    );
    registerAuth(this.app, ctx);

    // swagger
    this.app.openAPIRegistry.registerComponent(
      'securitySchemes',
      'bearerAuth',
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    );
    this.app.doc('/doc', {
      openapi: '3.1.0',
      info: {
        version: '1.0.0',
        title: 'Youtube Music API Server',
        description: 'Note: You need to get an access token using the `/auth/{id}` endpoint first to call any API endpoints under `/api`.',
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    });

    this.app.get('/swagger', swaggerUI({ url: '/doc' }));
  },
  run(hostname, port) {
    if (!this.app) return;

    try {
      this.server = serve({
        fetch: this.app.fetch.bind(this.app),
        port,
        hostname,
      });
    } catch (err) {
      console.error(err);
    }
  },
  end() {
    this.server?.close();
    this.server = undefined;
  },
});
