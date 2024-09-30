

provider "aws" {

  endpoints {
    # s3 = "https://herald.selfserved.dev"
    s3 = "http://localhost:8000/"
  }

  region     = "local"

  # swift keys
  access_key = "test:tester"
  secret_key = "testing"

  # s3 keys
  # access_key = "minio"
  # secret_key = "password"


  # Disable AWS-specific features
  skip_credentials_validation = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
  s3_use_path_style            = true
  # skip_s3_checksum            = true
}
