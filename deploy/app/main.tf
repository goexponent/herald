module "config" {
  source = "./.."
}

locals {
  s3_host       = "minio"
  s3_region     = "local"
  s3_access_key = var.MINIO_ACCESS_KEY
  s3_secret_key = var.MINIO_SECRET_KEY
}

variable "TAG" {
  type    = string
  default = "config-proxy-docker-file-240924-172536-27182429"
}

module "web" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//helm?ref=main"

  namespace = module.config.values.namespace
  name      = "s3-herald-dev"
  chart     = "./chart-generic"
  tag       = var.TAG
  timeout   = 60
  debug     = true

  values = <<EOF
image:
  repository: ${module.config.values.registry}/${module.config.values.gitlab_project}

imagePullSecrets:
  - name: ${module.config.values.name}-pull

deploymentAnnotations:
  secrets.infisical.com/auto-reload: "true"

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
    "herald-dev.yaml" = <<EOF
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
      endpoint: "minio.s3-herald"
      region: ${local.s3_region}
      forcePathStyle: true
      credentials:
        accessKeyId: ${local.s3_access_key}
        secretAccessKey: ${local.s3_secret_key}
  iac-s3:
    backend: minio_s3
    config:
      endpoint: "minio.s3-herald"
      region: ${local.s3_region}
      forcePathStyle: true
      bucket: iac-s3
      credentials:
        accessKeyId: ${local.s3_access_key}
        secretAccessKey: ${local.s3_secret_key}
  swift-test:
    backend: openstack_swift
    config:
      auth_url: "https://s3.pub1.infomaniak.cloud/identity"
      storage_url: "https://s3.pub1.infomaniak.cloud"
      credentials:
        username: ${local.s3_access_key}
        password: ${local.s3_secret_key}
        project_name: "your-project-name"
        user_domain_name: "Default"
        project_domain_name: "Default"
      container: "swift-test"

EOF
  }
}
