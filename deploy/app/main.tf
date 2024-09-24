module "config" {
  source = "./.."
}

variable "TAG" {
  type    = string
  default = "registry.exponent.ch/expo/s3-herald:config-proxy-docker-file-240924-160437-8a17b923"
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
    value: "/etc/config/herald-dev.yaml"

livenessProbe:
  httpGet:
    path: /health-check
    port: http

readinessProbe:
  httpGet:
    path: /health-check
    port: http

volumes:
  - name: config-volume
    configMap:
      name: herald-config

volumeMounts:
  - name: config-volume
    mountPath: /etc/config # Mounting the ConfigMap at /etc/config
    subPath: "herald-dev.yaml"
  EOF
}

resource "kubernetes_config_map" "app_config" {
  metadata {
    name      = "herald-config"
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
      endpoint: "http://minio:9000"
      region: local
      forcePathStyle: true
      credentials:
        accessKeyId: minio
        secretAccessKey: password
  swift-test:
    backend: openstack_swift
    config:
      auth_url: "http://swift:8080/auth/v1.0"
      storage_url: "http://swift:8080"
      credentials:
        username: "test:tester"
        password: "testing"
        project_name: "your-project-name"
        user_domain_name: "Default"
        project_domain_name: "Default"
      container: "your-container-name"

EOF
  }
}
