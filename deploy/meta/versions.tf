terraform {
  required_version = ">= 1.4.6"

  backend "http" {
    address        = "https://gitlab.exponent.ch/api/v4/projects/162/terraform/state/meta"
    lock_address   = "https://gitlab.exponent.ch/api/v4/projects/162/terraform/state/meta/lock"
    unlock_address = "https://gitlab.exponent.ch/api/v4/projects/162/terraform/state/meta/lock"
    lock_method    = "POST"
    unlock_method  = "DELETE"
    retry_wait_min = 5
  }

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "3.6.2"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.21.0"
    }
    gitlab = {
      source  = "gitlabhq/gitlab"
      version = "~> 16.0.3"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.7.1"
    }
    openstack = {
      source  = "terraform-provider-openstack/openstack"
      version = "~> 1.54.0"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = "expo-test"
}

provider "gitlab" {
  base_url = module.config.values.gitlab
}

# provider "openstack" {
#   auth_url = "https://api.pub1.infomaniak.cloud/identity"
#   tenant_name   = "PCP-RP63UPV"
#   user_name     = "PCU-RP63UPV"
#   # checkov:skip=CKV_OPENSTACK_1
#   password = local.os_password
# }
