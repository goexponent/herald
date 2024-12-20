locals {
  config = read_terragrunt_config("../../config.hcl").inputs
  env    = basename(get_terragrunt_dir())
}

inputs = merge(local.config.common, local.config[local.env])

terraform {
  source = ".."
}

remote_state {
  backend = "kubernetes"
  config = {
    namespace      = local.config[local.env].namespace
    config_context = local.config[local.env].context
  }
}
