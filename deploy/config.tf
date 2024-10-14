output "values" {
  value = {
    name = "s3-herald"

    registry       = "registry.exponent.ch"
    gitlab_project = "expo/s3-herald"

    cluster   = "195.15.199.57"
    namespace = "s3-herald"

    gitlab = "https://gitlab.exponent.ch"
    dns = {
      "selfserved.cloud" : {
        "s3.herald.selfserved.cloud" : "selfserved.cloud",
      },
    }
  }
}
