inputs = {
  common = {
    name              = "s3-herald"
    registry          = "registry.exponent.ch"
    gitlab_project    = "expo/s3-herald"
    gitlab_project_id = "162"
    gitlab            = "https://gitlab.exponent.ch"
  }
  dev = {
    environment   = "development"
    infisical_url = "https://infisical.exponent.ch/api"
    infisical_env = "development"
    namespace     = "dev-s3-herald"
    cluster       = "195.15.199.57"
    context = "expo-test"
    dns = {
      "selfserved.dev" : {
        "herald.selfserved.dev" : "expo-test.exponent.ch",
      },
    }
    swift_bucket = "swift-test"
    exoscale_region = "ch-dk-2"
    exoscale_bucket = "stg-datacycle"
  }
  stg = {
    environment   = "staging"
    infisical_url = "https://infisical.exponent.ch/api"
    infisical_env = "staging"
    namespace     = "stg-s3-herald"
    cluster       = "195.15.199.57"
    context       = "expo-test"
    dns = {
      "selfserved.cloud" : {
        "herald.selfserved.cloud" : "selfserved.cloud",
      },
    }
    swift_bucket = "swift-stg"
    exoscale_region = "ch-dk-2"
    exoscale_bucket = "s3-test"
  }
}
