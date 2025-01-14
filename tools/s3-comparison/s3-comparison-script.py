import json
import subprocess
import yaml
import logging
import sys


class S3BucketComparator:
    def __init__(self, bucket_name, credentials_file, profile, endpoint_url):
        self.bucket_name = bucket_name
        self.credentials_file = credentials_file
        self.profile = profile
        self.endpoint_url = endpoint_url

    def run_command(self, command):
        try:
            full_command = ["s5cmd"]
            if self.credentials_file:
                full_command.extend(["--credentials-file", self.credentials_file])
            if self.profile:
                full_command.extend(["--profile", self.profile])
            if self.endpoint_url:
                full_command.extend(["--endpoint-url", self.endpoint_url])
            full_command.extend(command.split())
            logging.info(f"Executing command: {' '.join(full_command)}")
            result = subprocess.run(
                full_command, check=True, text=True, capture_output=True
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            logging.error(f"Error executing s5cmd: {e.stderr}")
            return None

    def list_contents(self):
        logging.info(f"Listing contents of bucket {self.bucket_name}")
        command = f"ls --show-fullpath s3://{self.bucket_name}/*"
        output = self.run_command(command)
        if output:
            object_keys = [line for line in output.splitlines()]
            logging.info(
                f"Found {len(object_keys)} objects in bucket {self.bucket_name}"
            )
            return set(object_keys)
        return set()

    def compare_buckets(self, other_bucket):
        logging.info("Comparing bucket contents")
        bucket1_contents = self.list_contents()
        bucket2_contents = other_bucket.list_contents()

        only_in_bucket1 = bucket1_contents - bucket2_contents
        only_in_bucket2 = bucket2_contents - bucket1_contents

        logging.info(
            f"Differences found: {len(only_in_bucket1)} only in bucket1, {len(only_in_bucket2)} only in bucket2"
        )
        return {
            "only_in_bucket1": list(only_in_bucket1),
            "only_in_bucket2": list(only_in_bucket2),
        }

    def save_differences_to_json(self, data, filename):
        logging.info(f"Saving differences to {filename}")
        try:
            with open(filename, "w") as json_file:
                json.dump(data, json_file, indent=4)
            logging.info(f"Differences saved to {filename}")
        except IOError as e:
            logging.error(f"Error saving to JSON file: {e}")


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        stream=sys.stdout,
    )
    logging.info("Starting the script")
    try:
        with open("conf.yaml", "r") as f:
            config = yaml.safe_load(f)
    except FileNotFoundError:
        logging.error("Configuration file 'conf.yaml' not found.")
        return
    except yaml.YAMLError as e:
        logging.error(f"Error parsing YAML file: {e}")
        return

    bucket1_config = config.get("bucket1")
    if not bucket1_config:
        logging.error("Bucket1 configuration not found in 'conf.yaml'.")
        return

    required_keys = ["bucket_name", "credentials_file", "profile", "endpoint_url"]
    for key in required_keys:
        if key not in bucket1_config:
            logging.error(f"Missing '{key}' in bucket1 configuration.")
            return

    bucket2_config = config.get("bucket2")
    if not bucket2_config:
        logging.error("Bucket2 configuration not found in 'conf.yaml'.")
        return

    for key in required_keys:
        if key not in bucket2_config:
            logging.error(f"Missing '{key}' in bucket2 configuration.")
            return

    bucket1 = S3BucketComparator(
        bucket_name=bucket1_config["bucket_name"],
        credentials_file=bucket1_config["credentials_file"],
        profile=bucket1_config["profile"],
        endpoint_url=bucket1_config["endpoint_url"],
    )

    bucket2 = S3BucketComparator(
        bucket_name=bucket2_config["bucket_name"],
        credentials_file=bucket2_config["credentials_file"],
        profile=bucket2_config["profile"],
        endpoint_url=bucket2_config["endpoint_url"],
    )

    differences = bucket2.compare_buckets(bucket1)
    bucket1.save_differences_to_json(differences, "bucket_differences.json")
    logging.info("Script execution completed")


if __name__ == "__main__":
    main()
