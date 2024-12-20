variable "MINIO_ACCESS_KEY" {
  type = string
}

variable "MINIO_SECRET_KEY" {
  type = string
}

variable "OPENSTACK_USERNAME" {
  type = string
}

variable "OPENSTACK_PASSWORD" {
  type = string
}

variable "TAG" {
  type    = string
  default = "latest"
}

variable "name" {
  type = string
}

variable "registry" {
  type = string
}

variable "gitlab_project" {
  type = string
}

variable "gitlab_project_id" {
  type = string
}

variable "gitlab" {
  type = string
}

variable "namespace" {
  type = string
}

variable "cluster" {
  type = string
}

variable "environment" {
  type = string
}

variable "infisical_url" {
  type = string
}

variable "infisical_env" {
  type = string
}

variable "context" {
  type = string
}

variable "dns" {
  type = map(map(string))
}
