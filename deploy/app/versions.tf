terraform {
  backend "kubernetes" {
    secret_suffix  = "s3-herald"
    config_path    = "~/.kube/config"
  }

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.21.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.10.0"
    }
  }
}

provider "kubernetes" {
  config_path    = "~/.kube/config"
  config_context = local.context
}

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
