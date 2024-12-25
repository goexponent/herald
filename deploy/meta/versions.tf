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
    exoscale = {
      source  = "exoscale/exoscale"
      version = "~> 0.62.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = local.context
}

# tflint-ignore: terraform_required_providers
provider "helm" {
  kubernetes {
    config_path    = "~/.kube/config"
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

# tflint-ignore: terraform_required_providers
provider "exoscale" {
  key    = var.XKS_EXOSCALE_KEY
  secret = var.XKS_EXOSCALE_SECRET
}

provider "aws" {

  endpoints {
    s3 = "https://sos-${var.exoscale_region}.exo.io"
  }

  region = var.exoscale_region

  # swift keys
  access_key = var.XKS_EXOSCALE_KEY
  secret_key = var.XKS_EXOSCALE_SECRET

  # Disable AWS-specific features
  skip_credentials_validation = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
  # skip_s3_checksum            = true
}
