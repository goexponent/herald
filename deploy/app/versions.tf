terraform {
  backend "kubernetes" {
    namespace      = "s3-herald"
    secret_suffix  = "s3-herald"
    config_path    = "~/.kube/config"
    config_context = "expo-test"
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
  config_context = "expo-test"
}

provider "helm" {
  kubernetes {
    config_path    = "~/.kube/config"
    config_context = "expo-test"
  }
  experiments {
    manifest = true
  }
}
