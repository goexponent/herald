import sys
import json
import yaml
import shlex
import logging
import subprocess
from typing import Set, List, Optional, Dict


class S3BucketComparator:
    def __init__(
        self, bucket_name: str, credentials_file: str, profile: str, endpoint_url: str
    ):
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
            logging.info(f"Executing: {' '.join(full_command)}")

            result = subprocess.run(
                full_command,
                check=True,
                text=True,
                capture_output=True,
                timeout=timeout,
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            logging.error(f"s5cmd error: {e.stderr}")
        except subprocess.TimeoutExpired:
            logging.error(f"Command timed out after {timeout} seconds")
        return None

    def list_contents(self) -> Set[str]:
        """Lists all objects in the bucket."""
        logging.info(f"Listing contents of {self.bucket_name}")
        command = f"ls --show-fullpath s3://{self.bucket_name}/*"
        output = self.run_command(command)
        return set(output.splitlines()) if output else set()

    def compare_buckets(
        self, other_bucket: "S3BucketComparator"
    ) -> Dict[str, List[str]]:
        """Compares bucket contents and returns differences."""
        primary_contents = self.list_contents()
        mirror_contents = other_bucket.list_contents()

        differences = {
            f"only_in_primary_bucket_{self.bucket_name}": list(
                primary_contents - mirror_contents
            ),
            f"only_in_mirror_bucket_{other_bucket.bucket_name}": list(
                mirror_contents - primary_contents
            ),
        }
        return differences

    def save_differences_to_json(
        self, differences: Dict[str, List[str]], filename: str
    ) -> None:
        """Saves differences to a JSON file."""
        logging.info(f"Saving differences to {filename}")
        try:
            with open(filename, "w") as json_file:
                json.dump(differences, json_file, indent=4)
            logging.info(f"Differences saved to {filename}")
        except IOError as e:
            logging.error(f"Failed to save JSON file: {e}")


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=[
            logging.FileHandler("bucket_comparison.log"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    logging.info("Starting bucket comparison script")

    try:
        with open("conf.yaml", "r") as f:
            config = yaml.safe_load(f)
    except (FileNotFoundError, yaml.YAMLError) as e:
        logging.error(f"Error loading config: {e}")
        return

    for key in ["primary", "mirror"]:
        if key not in config:
            logging.error(f"Missing '{key}' configuration in conf.yaml")
            return

    def create_comparator(bucket_config: Dict[str, str]) -> S3BucketComparator:
        return S3BucketComparator(
            bucket_name=bucket_config["bucket_name"],
            credentials_file=bucket_config["credentials_file"],
            profile=bucket_config["profile"],
            endpoint_url=bucket_config["endpoint_url"],
        )

    primary_bucket = create_comparator(config["primary"])
    mirror_bucket = create_comparator(config["mirror"])

    differences = primary_bucket.compare_buckets(mirror_bucket)
    primary_bucket.save_differences_to_json(differences, "bucket_differences.json")
    logging.info("Comparison completed successfully")


if __name__ == "__main__":
    main()
