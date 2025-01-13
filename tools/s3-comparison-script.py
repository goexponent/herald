import boto3
import logging
from botocore.exceptions import (
    NoCredentialsError,
    PartialCredentialsError,
    EndpointConnectionError,
)
from tqdm import tqdm  # Import tqdm for the progress bar

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("bucket_size.log"),  # Log to a file
        logging.StreamHandler(),  # Log to console
    ],
)


def get_bucket_size(
    bucket_name, access_key, secret_key, endpoint_url=None, region_name=None
):
    # Initialize the S3 client
    s3 = boto3.client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        endpoint_url=endpoint_url,
        region_name=region_name,
    )

    total_size = 0
    total_objects = 0
    paginator = s3.get_paginator("list_objects_v2")

    try:
        logging.info(f"Starting to calculate size for bucket: {bucket_name}")
        # First, count the total number of objects in the bucket
        logging.info("Counting total objects in the bucket...")
        total_object_count = 0
        for page in paginator.paginate(Bucket=bucket_name):
            if "Contents" in page:
                total_object_count += len(page["Contents"])
        logging.info(f"Total objects in bucket {bucket_name}: {total_object_count}")

        # Initialize the progress bar
        with tqdm(
            total=total_object_count, desc=f"Processing {bucket_name}", unit="obj"
        ) as pbar:
            for page in paginator.paginate(Bucket=bucket_name):
                if "Contents" in page:
                    for obj in page["Contents"]:
                        total_size += obj["Size"]
                        total_objects += 1
                        pbar.update(1)  # Update the progress bar

        logging.info(f"Finished processing bucket {bucket_name}.")
        return total_size
    except (NoCredentialsError, PartialCredentialsError):
        logging.error(f"Error: Invalid credentials for bucket {bucket_name}.")
        return None
    except EndpointConnectionError:
        logging.error(
            f"Error: Could not connect to the endpoint for bucket {bucket_name}."
        )
        return None
    except Exception as e:
        logging.error(f"Error retrieving size for bucket {bucket_name}: {e}")
        return None


def get_bucket_info(bucket_number):
    print(f"\nEnter details for Bucket {bucket_number}:")
    bucket_name = input("Bucket Name: ")
    access_key = input("Access Key: ")
    secret_key = input("Secret Key: ")
    endpoint_url = input("Endpoint URL (leave blank for AWS S3): ") or None
    region_name = input("Region (leave blank if not applicable): ") or None
    return bucket_name, access_key, secret_key, endpoint_url, region_name


def main():
    # Get bucket configurations from the user
    (
        bucket1_name,
        bucket1_access_key,
        bucket1_secret_key,
        bucket1_endpoint,
        bucket1_region,
    ) = get_bucket_info(1)
    (
        bucket2_name,
        bucket2_access_key,
        bucket2_secret_key,
        bucket2_endpoint,
        bucket2_region,
    ) = get_bucket_info(2)

    # Get the sizes of both buckets
    size1 = get_bucket_size(
        bucket1_name,
        bucket1_access_key,
        bucket1_secret_key,
        bucket1_endpoint,
        bucket1_region,
    )
    size2 = get_bucket_size(
        bucket2_name,
        bucket2_access_key,
        bucket2_secret_key,
        bucket2_endpoint,
        bucket2_region,
    )

    if size1 is not None and size2 is not None:
        print(f"\nBucket 1 Size: {size1 / (1024 ** 2):.2f} MB")
        print(f"Bucket 2 Size: {size2 / (1024 ** 2):.2f} MB")

        if size1 > size2:
            print("Bucket 1 has more data.")
        elif size1 < size2:
            print("Bucket 2 has more data.")
        else:
            print("Both buckets have the same amount of data.")


if __name__ == "__main__":
    main()
