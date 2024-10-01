resource "helm_release" "minio" {
  name       = "minio"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "minio"
  version    = "14.7.8"

  namespace  = local.namespace

  timeout = 60
  wait    = true

# https://github.com/bitnami/charts/blob/main/bitnami/minio/values.yaml
  values = [
    <<EOF
image:
  registry: docker.io
  repository: bitnami/minio
  tag: latest
  pullPolicy: IfNotPresent

mode: standalone
disableWebUI: false

auth:
  rootUser: ${local.s3_access_key}
  rootPassword: ${local.s3_secret_key}

extraEnvVars:
  - name: MINIO_HTTP_TRACE
    value: /dev/stdout

resources:
  limits:
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi

persistence:
  enabled: false

apiIngress:
  enabled: false

gateway:
  enabled: true
  type: s3
  replicaCount: 1
  updateStrategy:
    type: RollingUpdate
  auth:
    s3:
      accessKey: ${local.s3_access_key}
      secretKey: ${local.s3_secret_key}
      serviceEndpoint: https://s3-minio-herald.pub1.infomaniak.cloud
EOF
  ]
}
