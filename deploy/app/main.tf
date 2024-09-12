module "config" {
  source = "./.."
}

variable "TAG" {
  type    = string
  default = "config-proxy-docker-file-240912-113839-c42678d8"
}

module "web" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//helm?ref=main"

  namespace = module.config.values.namespace
  name      = "web"
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
    value: "herald-compose.yaml"

livenessProbe:
  httpGet:
    path: /health-check
    port: http

readinessProbe:
  httpGet:
    path: /health-check
    port: http
  EOF
}
