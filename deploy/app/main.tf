locals {
  s3_region                     = "local"
  s3_access_key                 = var.MINIO_ACCESS_KEY
  s3_secret_key                 = var.MINIO_SECRET_KEY
  openstack_auth_url            = "https://api.pub1.infomaniak.cloud/identity/v3"
  openstack_username            = var.OPENSTACK_USERNAME
  openstack_password            = var.OPENSTACK_PASSWORD
  openstack_project_name        = "PCP-RP63UPV"
  openstack_user_domain_name    = "Default"
  openstack_project_domain_name = "Default"
  swift_region                  = "dc3-a"

  registry       = var.registry
  gitlab_project = var.gitlab_project
  name           = var.name
  namespace      = var.namespace
  context        = var.context
  dns            = var.dns

  podsconfig = <<EOF
pods:
  - serviceaccount:
      name: "default"
      uid: ${var.pod1_uid}
    sub: "system:serviceaccount:jwk-auth-app:default"
EOF

  herald_config = <<EOF
port: 8000
temp_dir: "./tmp"
task_store_backend:
  endpoint: https://sos-${var.exoscale_region}.exo.io
  region: ${var.exoscale_region}
  forcePathStyle: true
  bucket: task-store
  credentials:
    accessKeyId: ${var.XKS_EXOSCALE_KEY}
    secretAccessKey: ${var.XKS_EXOSCALE_SECRET}
backends:
  exoscale_s3:
    protocol: s3
  minio_s3:
    protocol: s3
  openstack_swift:
    protocol: swift
buckets:
  s3-test:
    backend: minio_s3
    config:
      endpoint: http://minio.${local.namespace}:9000
      region: ${local.s3_region}
      forcePathStyle: true
      bucket: s3-test
      credentials:
        accessKeyId: ${local.s3_access_key}
        secretAccessKey: ${local.s3_secret_key}
  swift-test:
    backend: openstack_swift
    config:
      auth_url: ${local.openstack_auth_url}
      credentials:
        username: ${local.openstack_username}
        password: ${local.openstack_password}
        project_name: ${local.openstack_project_name}
        user_domain_name: ${local.openstack_user_domain_name}
        project_domain_name: ${local.openstack_project_domain_name}
      container: "swift-test"
      region: ${local.swift_region}
  stg-datacycle:
    backend: openstack_swift
    config:
      auth_url: ${local.openstack_auth_url}
      credentials:
        username: ${local.openstack_username}
        password: ${local.openstack_password}
        project_name: ${local.openstack_project_name}
        user_domain_name: ${local.openstack_user_domain_name}
        project_domain_name: ${local.openstack_project_domain_name}
      container:  ${var.swift_bucket}
      region: ${local.swift_region}
    # they are read-only,
    backups:
      - name: stg-datacycle
        backend: exoscale_s3
        config:
          endpoint: https://sos-${var.exoscale_region}.exo.io
          region: ${var.exoscale_region}
          forcePathStyle: true
          bucket: ${var.exoscale_bucket}
          credentials:
            accessKeyId: ${var.XKS_EXOSCALE_KEY}
            secretAccessKey: ${var.XKS_EXOSCALE_SECRET}

EOF

  herald_checksum = sha256(local.herald_config)
}



module "web" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//helm?ref=main"

  namespace = local.namespace
  name      = "s3-herald"
  chart     = "./chart-generic"
  tag       = var.TAG
  timeout   = 60
  debug     = true

  # https://gitlab.exponent.ch/devops/chart-generic/-/blob/main/values.yaml?ref_type=heads
  values = <<EOF
image:
  repository: ${local.registry}/${local.gitlab_project}
  pullPolicy: Always

imagePullSecrets:
  - name: ${local.name}-pull

deploymentAnnotations:
  secrets.infisical.com/auto-reload: "true"
  configmap-checksum: "${local.herald_checksum}"

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
    nginx.ingress.kubernetes.io/proxy-body-size: 80m
  hosts: ${jsonencode([for k in flatten([for k, v in values(local.dns) : keys(v)]) :
  {
    host : k,
    paths : [
      {
        path : "/",
        pathType : "ImplementationSpecific"
      }
    ]
  }
])}
  tls:
    - secretName: web-tls
      hosts: ${jsonencode(flatten([for k, v in values(local.dns) : keys(v)]))}

containerPort: 8000

extraEnv:
  - name: CONFIG_FILE_PATH
    value: /etc/herald/herald-dev.yaml

livenessProbe:
  httpGet:
    path: /health-check
    port: http

readinessProbe:
  httpGet:
    path: /health-check
    port: http

volumeMounts:
  - name: herald
    mountPath: /etc/herald/
    readOnly: true
  - name: podsconfig
    mountPath: /app/pods.yaml
    subPath: pods.yaml
    readOnly: true

volumes:
  - name: herald
    configMap:
      name: herald
  - name: podsconfig
    configMap:
      name: podsconfig
EOF


depends_on = [
  kubernetes_config_map.herald,
  kubernetes_config_map.podsconfig
]
}

resource "kubernetes_config_map" "herald" {
  metadata {
    name      = "herald"
    namespace = local.namespace
  }

  data = {
    "herald-dev.yaml" = local.herald_config
  }
}

resource "kubernetes_config_map" "podsconfig" {
  metadata {
    name      = "podsconfig"
    namespace = local.namespace
  }

  data = {
    "pods.yaml" = local.podsconfig
  }
}
