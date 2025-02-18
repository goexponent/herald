import {
  ReplicaS3Config,
  ReplicaSwiftConfig,
  S3BucketConfig,
  SwiftBucketConfig,
} from "../config/types.ts";

export type MirrorableCommands =
  | "putObject"
  | "deleteObject"
  | "copyObject"
  | "createBucket"
  | "deleteBucket"
  | "createMultipartUpload"
  | "completeMultipartUpload"
  | "uploadPart";

export interface WorkerEvent {
  data: MirrorTask;
}

/**
 * Interface representing a task to mirror a specific operation between two bucket configurations.
 */
export interface MirrorTask {
  mainBucketConfig: S3BucketConfig | SwiftBucketConfig;
  backupBucketConfig: ReplicaS3Config | ReplicaSwiftConfig;
  command: MirrorableCommands;
  originalRequest: Record<string, unknown>;
  nonce: string;
}
