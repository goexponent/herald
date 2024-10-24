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
