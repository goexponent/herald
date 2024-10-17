module "config" {
  source = "./.."
}

locals {
  s3_host       = "minio"
  s3_region     = "local"
  s3_access_key = var.MINIO_ACCESS_KEY
  s3_secret_key = var.MINIO_SECRET_KEY
  openstack_auth_url = "https://api.pub1.infomaniak.cloud/identity/v3"
  openstack_username = var.OPENSTACK_USERNAME
  openstack_password = var.OPENSTACK_PASSWORD
  openstack_project_name = "PCP-RP63UPV"
  openstack_user_domain_name = "Default"
  openstack_project_domain_name = "Default"
  swift_region = "dc3-a"

  herald_config = <<EOF
port: 8000
temp_dir: "./tmp"
backends:
  minio_s3:
    protocol: s3
  openstack_swift:
    protocol: swift
buckets:
  s3-test:
    backend: minio_s3
    config:
      endpoint: http://minio.s3-herald:9000
      region: ${local.s3_region}
      forcePathStyle: true
      bucket: s3-test
      credentials:
        accessKeyId: ${local.s3_access_key}
        secretAccessKey: ${local.s3_secret_key}
  iac-s3:
    backend: minio_s3
    config:
      endpoint: http://minio:9000
      region: ${local.s3_region}
      forcePathStyle: true
      bucket: iac-s3
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

EOF

  herald_checksum = sha256(local.herald_config)
}

variable "TAG" {
  type    = string
  default = "latest"
}

module "web" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//helm?ref=main"

  namespace = module.config.values.namespace
  name      = "s3-herald-dev"
  chart     = "./chart-generic"
  tag       = var.TAG
  timeout   = 60
  debug     = false

# https://gitlab.exponent.ch/devops/chart-generic/-/blob/main/values.yaml?ref_type=heads
  values = <<EOF
image:
  repository: ${module.config.values.registry}/${module.config.values.gitlab_project}

imagePullSecrets:
  - name: ${module.config.values.name}-pull

deploymentAnnotations:
  secrets.infisical.com/auto-reload: "true"
  configmap-checksum: "${local.herald_checksum}"


ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
    nginx.ingress.kubernetes.io/proxy-body-size: 80m
  hosts: ${jsonencode([for k in flatten([for k, v in values(module.config.values.dns) : keys(v)]) :
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
      hosts: ${jsonencode(flatten([for k, v in values(module.config.values.dns) : keys(v)]))}

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

volumes:
  - name: herald
    configMap:
      name: herald
EOF


depends_on = [
    kubernetes_config_map.herald
  ]
}

resource "kubernetes_config_map" "herald" {
  metadata {
    name      = "herald"
    namespace = module.config.values.namespace
  }

  data = {
    "herald-dev.yaml" = local.herald_config
  }
}
