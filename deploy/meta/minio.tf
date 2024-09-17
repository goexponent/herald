resource "helm_release" "minio" {
  name       = "minio"
  repository = "https://charts.bitnami.com/bitnami"
  chart      = "minio"
  version    = "14.7.8"

  namespace  = local.namespace

  values = [
    <<EOF
image:
  registry: docker.io
  repository: bitnami/minio
  tag: 2022.2.7-debian-10-r0
  pullPolicy: IfNotPresent

mode: standalone
disableWebUI: false

auth:
  rootPassword: ${local.minio_root_password}
  accessKey: ${local.minio_access_key}
  secretKey: ${local.minio_secret_key}

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
EOF
  ]

  set {
    name  = "auth.rootPassword"
    value = local.minio_root_password
  }

  set {
    name  = "auth.accessKey"
    value = local.minio_access_key
  }

  set {
    name  = "auth.secretKey"
    value = local.minio_secret_key
  }
}
