import * as $fs from "node:fs";
import mime from "mime";
// import { Response } from "node-fetch";

const oldFetch = globalThis.fetch;
// globalThis.Response = Response;

// We always polyfill fetch because Node's fetch doesn't support file URLs.
(globalThis.fetch) = async function (resource, options) {
  const url = (resource.href) ? new URL(resource.href) : (resource);

  if (url.protocol === "file:") {
    const readStream = $fs.createReadStream(url);

    const headers = {};

    const type = mime.getType(url.pathname);

    if (type) {
      headers["Content-Type"] = type;
    }

    const result = new Response(readStream, {
      status: 200,
      statusText: "OK",
      headers,
    });

    return result;

  } else {
    return await oldFetch(resource, options);
  }
};