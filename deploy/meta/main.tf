locals {
  s3_access_key = var.MINIO_ACCESS_KEY
  s3_secret_key = var.MINIO_SECRET_KEY

  os_identity = "https://api.pub1.infomaniak.cloud/identity"
  os_tenant   = "PCP-RP63UPV"
  os_user     = "PCU-RP63UPV"
  os_password = var.OS_PASSWORD

  bucket = var.swift_bucket

  namespace      = var.namespace
  registry       = var.registry
  gitlab         = var.gitlab
  gitlab_project = var.gitlab_project
  name           = var.name
  environment    = var.environment
  cluster        = var.cluster
  context        = var.context
  infisical_url  = var.infisical_url
  infisical_env  = var.infisical_env
  dns            = var.dns
}

module "web_pull" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//pull-secret?ref=main"

  name           = "${local.name}-pull"
  namespace      = local.namespace
  registry       = local.registry
  gitlab_project = local.gitlab_project
}

module "cluster" {
  source = "git::https://gitlab.exponent.ch/devops/tf-modules.git//cluster-sa?ref=main"

  name           = "${local.name}-sa"
  namespace      = local.namespace
  cluster_host   = local.cluster
  gitlab_project = local.gitlab_project
  environment    = local.environment
}

data "cloudflare_zone" "zone" {
  for_each = toset(keys(local.dns))
  name     = each.key
}

resource "cloudflare_record" "cname" {
  for_each = { for r in flatten([for zone, vs in local.dns : [for k, v in vs : { zone : zone, name : k, cname : v }]]) : r.name => r }
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
      name: ${local.name}
      namespace: ${local.namespace}
    spec:
      hostAPI: ${local.infisical_url}
      authentication:
        serviceToken:
          serviceTokenSecretReference:
            secretName: infisical-token
            secretNamespace: ${local.namespace}
          secretsScope:
            envSlug: "${local.infisical_env}"
            secretsPath: "/"
      managedSecretReference:
        secretName: ${local.name}-conf
        secretNamespace: ${local.namespace}
  EOF
  )
}
