locals {
  # os_password = var.TF_VAR_HERALD_S3_PASSWORD

  s3_host       = "minio"
  s3_port       = "9000"
  s3_region     = "us-east-1"
  s3_access_key = var.MINIO_ACCESS_KEY
  s3_secret_key = var.MINIO_SECRET_KEY
  s3_root_password = var.MINIO_ROOT_PASSWORD

  namespace = module.config.values.namespace
}

module "config" {
  source = "./.."
}

module "web_pull" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//pull-secret?ref=main"

  name           = "${module.config.values.name}-pull"
  namespace      = module.config.values.namespace
  registry       = module.config.values.registry
  gitlab_project = module.config.values.gitlab_project
}

module "cluster" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//cluster-sa?ref=main"

  name           = "${module.config.values.name}-sa"
  namespace      = module.config.values.namespace
  cluster_host   = module.config.values.cluster
  gitlab_project = module.config.values.gitlab_project
}

data "cloudflare_zone" "zone" {
  for_each = toset(keys(module.config.values.dns))
  name     = each.key
}

resource "cloudflare_record" "cname" {
  for_each = { for r in flatten([for zone, vs in module.config.values.dns : [for k, v in vs : { zone : zone, name : k, cname : v }]]) : r.name => r }
  zone_id  = data.cloudflare_zone.zone[each.value.zone].id
  type     = "CNAME"
  name     = each.value.name
  value    = each.value.cname
  proxied  = true
}

resource "kubernetes_manifest" "infisical" {
  manifest = yamldecode(<<EOF
    apiVersion: secrets.infisical.com/v1alpha1
    kind: InfisicalSecret
    metadata:
      name: ${module.config.values.name}
      namespace: ${module.config.values.namespace}
    spec:
      hostAPI: https://infisical.exponent.ch/api
      authentication:
        serviceToken:
          serviceTokenSecretReference:
            secretName: infisical-token
            secretNamespace: ${module.config.values.namespace}
          secretsScope:
            envSlug: prod
            secretsPath: "/"
      managedSecretReference:
        secretName: ${module.config.values.name}-conf
        secretNamespace: ${module.config.values.namespace}
  EOF
  )
}
