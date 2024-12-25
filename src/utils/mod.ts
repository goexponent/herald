export * as loggerUtils from "./log.ts";
export * as iTypes from "./types.ts";
export * as urlUtils from "./url.ts";
export * as s3Utils from "./s3.ts";
export * as errorUtils from "./error.ts";
export * as signerUtils from "./signer.ts";
export * as cryptoUtils from "./crypto.ts";

export function inWorker() {
  return typeof WorkerGlobalScope !== "undefined" &&
    self instanceof WorkerGlobalScope;
}
