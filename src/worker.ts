import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    try {
      // This is the standard way to serve static assets with a Worker
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      // If the requested file isn't found, serve index.html for SPA routing
      try {
        const url = new URL(request.url);
        const spaRequest = new Request(`${url.origin}/index.html`, request);
        return await getAssetFromKV(
          {
            request: spaRequest,
            waitUntil: ctx.waitUntil.bind(ctx),
          },
          {
            ASSET_NAMESPACE: env.__STATIC_CONTENT,
            ASSET_MANIFEST: assetManifest,
          }
        );
      } catch (e) {
        return new Response("Not found", { status: 404 });
      }
    }
  },
};