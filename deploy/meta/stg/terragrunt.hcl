locals {
  config = read_terragrunt_config("../../config.hcl").inputs
  env    = basename(get_terragrunt_dir())
  customs = {
  }
}

inputs = merge(local.config.common, local.config[local.env], local.customs)

terraform {
  source = ".."
}

remote_state {
  backend = "http"
  config = {
    address        = "${local.config.common.gitlab}/api/v4/projects/${local.config.common.gitlab_project_id}/terraform/state/meta.${local.env}"
    lock_address   = "${local.config.common.gitlab}/api/v4/projects/${local.config.common.gitlab_project_id}/terraform/state/meta.${local.env}/lock"
    unlock_address = "${local.config.common.gitlab}/api/v4/projects/${local.config.common.gitlab_project_id}/terraform/state/meta.${local.env}/lock"
  }
}
