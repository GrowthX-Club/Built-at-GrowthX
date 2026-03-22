import { PassThrough } from "node:stream";
import type { EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import createEmotionServer from "@emotion/server/create-instance";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

const ABORT_DELAY = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  const userAgent = request.headers.get("user-agent") || "";
  return isbot(userAgent)
    ? handleBotRequest(
        request,
        responseStatusCode,
        responseHeaders,
        routerContext
      )
    : handleBrowserRequest(
        request,
        responseStatusCode,
        responseHeaders,
        routerContext
      );
}

/**
 * Bot/crawler path: renderToString so the full HTML is available immediately.
 * We extract Emotion critical CSS and inject it before </head>.
 */
function handleBotRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  const cache = createCache({ key: "css" });
  const { extractCriticalToChunks, constructStyleTagsFromChunks } =
    createEmotionServer(cache);

  const html = renderToString(
    <CacheProvider value={cache}>
      <ServerRouter context={routerContext} url={request.url} />
    </CacheProvider>
  );

  const emotionChunks = extractCriticalToChunks(html);
  const emotionCss = constructStyleTagsFromChunks(emotionChunks);

  // Inject Emotion styles before </head>
  const markup = html.replace("</head>", `${emotionCss}</head>`);

  responseHeaders.set("Content-Type", "text/html");

  return new Response(`<!DOCTYPE html>${markup}`, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

/**
 * Browser path: streaming SSR via renderToPipeableStream.
 * Emotion CSS is extracted after the shell renders and injected inline.
 */
function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;

    const cache = createCache({ key: "css" });
    const { extractCriticalToChunks, constructStyleTagsFromChunks } =
      createEmotionServer(cache);

    const { pipe, abort } = renderToPipeableStream(
      <CacheProvider value={cache}>
        <ServerRouter context={routerContext} url={request.url} />
      </CacheProvider>,
      {
        onShellReady() {
          shellRendered = true;

          const body = new PassThrough({
            transform(chunk, encoding, callback) {
              // Inject Emotion critical CSS into the streamed HTML before </head>
              const str = chunk.toString();
              if (str.includes("</head>")) {
                const emotionChunks = extractCriticalToChunks(str);
                const emotionCss =
                  constructStyleTagsFromChunks(emotionChunks);
                callback(
                  null,
                  Buffer.from(str.replace("</head>", `${emotionCss}</head>`))
                );
              } else {
                callback(null, chunk);
              }
            },
          });

          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
