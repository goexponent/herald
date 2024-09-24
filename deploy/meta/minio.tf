resource "helm_release" "minio" {
  name       = "minio"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "minio"
  version    = "14.7.8"

  namespace  = local.namespace

  timeout = 90
  wait    = true

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
  rootPassword: ${local.s3_root_password}

extraEnvVars:
  - name: MINIO_HTTP_TRACE
    value: /dev/stdout

resources:
  limits:
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi

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

  # set {
  #   name  = "auth.rootPassword"
  #   value = local.s3_root_password
  # }

  # set {
  #   name  = "auth.accessKey"
  #   value = local.s3_access_key
  # }

  # set {
  #   name  = "auth.secretKey"
  #   value = local.s3_secret_key
  # }
}
