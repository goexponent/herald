resource "aws_s3_bucket" "my_bucket" {
  bucket = var.exoscale_bucket
}

output "bucket_name" {
  value = aws_s3_bucket.my_bucket.bucket
}
