terraform {
  required_version = ">= 1.4.6"

  backend "http" {
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
  config_context = local.context
}

provider "helm" {
  kubernetes {
    config_path = "~/.kube/config"
    config_context = local.context
  }

  experiments {
    manifest = true
  }
}

provider "gitlab" {
  base_url = local.gitlab
}

provider "openstack" {
  auth_url    = local.os_identity
  tenant_name = local.os_tenant
  user_name   = local.os_user
  # checkov:skip=CKV_OPENSTACK_1
  password = local.os_password
}
