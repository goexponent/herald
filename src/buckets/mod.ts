import { BucketConfig, GlobalConfig, ReplicaConfig } from "../config/types.ts";

export interface BucketStore {
  buckets: Bucket[];
}

export class Bucket {
  constructor(
    private name: string,
    private bucketConfig: BucketConfig | ReplicaConfig,
    private replicas: Bucket[],
    private typ: string,
  ) {}

  public getName() {
    return this.name;
  }

  public getBucket() {
    return this.bucketConfig;
  }

  public hasReplicas() {
    return this.replicas.length > 0;
  }

  public getReplicas() {
    return this.replicas;
  }

  public getConfig() {
    return this.bucketConfig.config;
  }

  public getType() {
    return this.typ;
  }
}

export function initializeBucketStore(config: GlobalConfig): BucketStore {
  const buckets = [];
  for (const [name, bucketConfig] of Object.entries(config.buckets)) {
    const bucketName = bucketConfig.typ === "S3BucketConfig"
      ? bucketConfig.config.bucket
      : bucketConfig.config.container;
    const replicas = config.replicas.filter((replica) => {
      const replicaBucketName = replica.typ === "ReplicaS3Config"
        ? replica.config.bucket
        : replica.config.container;
      return replicaBucketName === bucketName;
    }).map((replica) => new Bucket(replica.name, replica, [], replica.typ));
    const bucket = new Bucket(name, bucketConfig, replicas, bucketConfig.typ);
    buckets.push(bucket);
  }

  return {
    buckets,
  };
}
