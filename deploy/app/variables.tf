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

variable "namespace" {
  type = string
}

variable "context" {
  type = string
}

variable "dns" {
  type = map(map(string))
}

variable "swift_bucket" {
  type = string
}
variable "XKS_EXOSCALE_KEY" {
  type = string
}

variable "XKS_EXOSCALE_SECRET" {
  type = string
}

variable "exoscale_region" {
  type = string
}

variable "exoscale_bucket" {
  type = string
}

variable "pod1_uid" {
  type = string
}
