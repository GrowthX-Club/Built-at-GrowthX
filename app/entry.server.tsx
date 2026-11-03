import { PassThrough } from "node:stream";
import type { EntryContext } from "react-router";
import { createReadableStreamFromReadable } from "@react-router/node";
import { renderToPipeableStream } from "react-dom/server";
import { ServerRouter } from "react-router";
import { isbot } from "isbot";
import createEmotionServer from "@emotion/server/create-instance";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";

const ABORT_DELAY = 5_000;

// Bots and link previews get the page once everything has rendered (onAllReady), people get it streamed as soon as
// the shell is ready (onShellReady). Both go through the same stream: renderToString for bots left Suspense
// boundaries on their fallback and never finished React Router's data stream, so crawlers saw a skeleton.
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext
) {
  return handleBrowserRequest(request, responseStatusCode, responseHeaders, routerContext, isbot(request.headers.get("user-agent") || ""));
}

/**
 * Streaming SSR via renderToPipeableStream; Emotion CSS is extracted from the head chunk and injected inline.
 */
function handleBrowserRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  waitForAll: boolean
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
        [waitForAll ? "onAllReady" : "onShellReady"]() {
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
