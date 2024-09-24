

resource "openstack_objectstorage_container_v1" "preprod" {
  name = local.bucket
}

resource "openstack_identity_ec2_credential_v3" "preprod" {}

output "out" {
  value = {
    endpoint              = "https://s3.pub1.infomaniak.cloud"
    bucket                = local.bucket
    region                = "us-east-1"
    aws_access_key_id     = openstack_identity_ec2_credential_v3.preprod.access
    aws_secret_access_key = openstack_identity_ec2_credential_v3.preprod.secret
  }
  sensitive = true
}
