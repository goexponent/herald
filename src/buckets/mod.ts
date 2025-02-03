import { S3Config } from "../config/mod.ts";
import { GlobalConfig, SwiftConfig } from "../config/types.ts";

export interface BucketStore {
  buckets: Bucket[];
}

export class Bucket {
  constructor(
    private _name: string,
    private _config: S3Config | SwiftConfig,
    private _replicas: Bucket[],
    private _typ: string,
    private _backend: string,
  ) {}

  public getReplica(name: string) {
    return this.replicas.find((replica) => replica.name === name);
  }

  get name() {
    return this._name;
  }

  public hasReplicas() {
    return this.replicas.length > 0;
  }

  get replicas() {
    return this._replicas;
  }

  get config() {
    return this._config;
  }

  get typ() {
    return this._typ;
  }

  get backend() {
    return this._backend;
  }

  get isReplica() {
    return this.typ == "ReplicaS3Config" || this.typ == "ReplicaSwiftConfig";
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
    }).map((replica) =>
      new Bucket(replica.name, replica.config, [], replica.typ, replica.backend)
    );
    const bucket = new Bucket(
      name,
      bucketConfig.config,
      replicas,
      bucketConfig.typ,
      bucketConfig.backend,
    );
    buckets.push(bucket);
  }

  return {
    buckets,
  };
}
