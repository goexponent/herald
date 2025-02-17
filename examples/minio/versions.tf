terraform {
  required_version = ">= 1.4.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# tflint-ignore: terraform_required_providers
provider "aws" {

  endpoints {
    s3 = "http://localhost:9000/"
  }

  region = "local"
  #   s3 keys
  access_key = "minio"
  secret_key = "password"


  # Disable AWS-specific features
  skip_credentials_validation = true
  skip_region_validation      = true
  skip_requesting_account_id  = true
  s3_use_path_style           = true
  # skip_s3_checksum            = true
}
