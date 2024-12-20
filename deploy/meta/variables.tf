
variable "MINIO_ACCESS_KEY" {
  type = string
}

variable "MINIO_SECRET_KEY" {
  type = string
}

variable "OS_PASSWORD" {
  type = string
}

variable "namespace" {
  type = string
}

variable "registry" {
  type = string
}

variable "gitlab" {
  type = string
}

variable "gitlab_project" {
  type = string
}

variable "name" {
  type        = string
  description = "base name of the stack"
}

variable "environment" {
  type = string
}

variable "context" {
  type = string
}

variable "cluster" {
  type = string
}

variable "infisical_url" {
  type = string
}

variable "infisical_env" {
  type = string
}

variable "dns" {
  type = map(map(string))
}

variable "swift_bucket" {
  type = string
}
