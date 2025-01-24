import sys
import json
import yaml
import shlex
import logging
import subprocess
from typing import Set, List, Optional, Dict


class S3BucketComparator:
    def __init__(self, bucket_name, credentials_file, profile, endpoint_url):
        self.bucket_name = bucket_name
        self.credentials_file = credentials_file
        self.profile = profile
        self.endpoint_url = endpoint_url

    def run_command(self, command: List[str], timeout: int = 300) -> Optional[str]:
        try:
            full_command = ["s5cmd"]
            if self.credentials_file:
                full_command.extend(["--credentials-file", self.credentials_file])
            if self.profile:
                full_command.extend(["--profile", self.profile])
            if self.endpoint_url:
                full_command.extend(["--endpoint-url", self.endpoint_url])

            full_command.extend(shlex.split(command))
            # Log command without sensitive details
            logging.info(f"Executing s5cmd command for bucket: {self.bucket_name}")

            result = subprocess.run(
                full_command,
                check=True,
                text=True,
                capture_output=True,
                timeout=timeout,
            )
            return result.stdout
        except subprocess.CalledProcessError as e:
            logging.error(f"Error executing s5cmd: {e.stderr}")
            return None
        except subprocess.TimeoutExpired:
            logging.error(f"Command timed out after {timeout} seconds")
            return None

    def list_contents(self) -> Set[str]:
        """List all objects in the bucket with progress tracking."""

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

    def compare_buckets(self, other_bucket: "S3BucketComparator") -> Dict:
        """Compare contents and metadata of two buckets."""

        logging.info("Comparing bucket contents")
        primary_bucket_contents = self.list_contents()
        mirror_bucket_contents = other_bucket.list_contents()

        differences = {
            "only_in_bucket1": list(primary_bucket_contents - mirror_bucket_contents),
            "only_in_bucket2": list(mirror_bucket_contents - primary_bucket_contents),
        }
        return differences

    def save_differences_to_json(self, data: Dict, filename: str) -> None:
        """Save comparison results to a JSON file with size validation."""

        logging.info(f"Saving differences to {filename}")
        try:
            # Validate file size before writing
            estimated_size = len(json.dumps(data, indent=4))
            if estimated_size > 100 * 1024 * 1024:  # 100MB
                logging.warning("Large difference file detected")

            with open(filename, "w") as json_file:
                json.dump(data, json_file, indent=4)
            logging.info(f"Differences saved to {filename}")
        except IOError as e:
            logging.error(f"Error saving to JSON file: {e}")


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler("bucket_size.log"),
            logging.StreamHandler(sys.stdout),
        ],
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

    primary_bucket_config = config.get("primary")
    if not primary_bucket_config:
        logging.error("Primary bucket configuration not found in 'conf.yaml'.")
        return

    required_keys = ["bucket_name", "credentials_file", "profile", "endpoint_url"]
    for key in required_keys:
        if key not in primary_bucket_config:
            logging.error(f"Missing '{key}' in primary bucket configuration.")
            return

    mirror_bucket_config = config.get("mirror")
    if not mirror_bucket_config:
        logging.error("Mirror bucket configuration not found in 'conf.yaml'.")
        return

    for key in required_keys:
        if key not in mirror_bucket_config:
            logging.error(f"Missing '{key}' in mirror bucket configuration.")
            return

    primary_bucket = S3BucketComparator(
        bucket_name=primary_bucket_config["bucket_name"],
        credentials_file=primary_bucket_config["credentials_file"],
        profile=primary_bucket_config["profile"],
        endpoint_url=primary_bucket_config["endpoint_url"],
    )

    mirror_bucket = S3BucketComparator(
        bucket_name=mirror_bucket_config["bucket_name"],
        credentials_file=mirror_bucket_config["credentials_file"],
        profile=mirror_bucket_config["profile"],
        endpoint_url=mirror_bucket_config["endpoint_url"],
    )

    differences = mirror_bucket.compare_buckets(primary_bucket)
    primary_bucket.save_differences_to_json(differences, "bucket_differences.json")
    logging.info("Script execution completed")


if __name__ == "__main__":
    main()
