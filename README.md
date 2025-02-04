<p align="center">
    <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/ec559a9f6bfd399b82bb44393651661b08aaf7ba/icons/folder-markdown-open.svg" align="center" width="30%">
</p>
<p align="center"><h1 align="center">herald</h1></p>
<p align="center">
	<em>herald: Orchestrating object storage services</em>
</p>
<p align="center">
	<img src="https://img.shields.io/github/license/expnt/herald?style=default&logo=opensourceinitiative&logoColor=white&color=0080ff" alt="license">
	<img src="https://img.shields.io/github/last-commit/expnt/herald?style=default&logo=git&logoColor=white&color=0080ff" alt="last-commit">
	<img src="https://img.shields.io/github/languages/top/expnt/herald?style=default&color=0080ff" alt="repo-top-language">
	<img src="https://img.shields.io/github/languages/count/expnt/herald?style=default&color=0080ff" alt="repo-language-count">
</p>
<p align="center"><!-- default option, no dependency badges. -->
</p>
<p align="center">
	<!-- default option, no dependency badges. -->
</p>
<br>

## Table of Contents

- [ Overview](#Overview)
- [ Features](#Features)
- [ Project Structure](#Project-Structure)
  - [ Project Index](#Project-Index)
- [ Getting Started](#Getting-Started)
  - [ Prerequisites](#Prerequisites)
  - [ Development](#Development)
  - [ herald.yaml config file](#herald.yaml-config-file)
  - [ Environment Variables](#Environment-Variables)
  - [ Usage](#Usage)
  - [ Testing](#Testing)
- [ Project Roadmap](#Project-Roadmap)
- [ Contributing](#Contributing)
- [ Acknowledgments](#Acknowledgments)

---

## Overview

The herald project is a proxy which sits on top of storage services that addresses the challenge of managing scalable cloud storage solutions by allowing you to connect with different types of object storages (S3, Swift) using the S3 protocol. The development was inspired due to some bugs in the OpenStack S3 proxy for the swift object storage service. The proxy includes other essential features besides fixing some of the bugs. It supports mirroring across different cloud storage providers, kubernetes friendly authentication scheme and others.

---

## Features

|     |      Feature      | Summary                                                                                                                                                                                                                                                                             |
| :-- | :---------------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ⚙️  | **Architecture**  | <ul><li>Employs Deno for a lightweight and efficient runtime environment.</li></ul>                           |
| 🔩  | **Code Quality**  | <ul><li>Codebase primarily in TypeScript, ensuring strong typing and modern JavaScript features.</li><li>Linting and formatting rules defined in `deno.jsonc` to maintain consistency.</li><li>Regular updates and dependency management facilitated by `dependabot.yml`.</li></ul> |                    |
| 🔌  | **Integrations**  | <ul><li>Seamless integration with cloud storage backends like MinIO and Swift.</li><li>Supports CI/CD pipelines using GitHub Actions.</li><li>Infrastructure management via Terraform.</li></ul>                                                                                    |
| 🧩  |  **Modularity**   | <ul><li>Highly modular with distinct configuration files for different services.</li><li>Uses Docker Compose for orchestrating multi-container applications.</li><li>Task orchestration and management through `deno.jsonc`.</li></ul>                                              |
| 🧪  |    **Testing**    | <ul><li>Testing configurations outlined in `tests.yml`.</li><li>Automated testing integrated into CI/CD workflows.</li><li>Focus on maintaining high code quality through continuous testing.</li></ul>                                                                             |
| ⚡️ |  **Performance**  | <ul><li>Optimized for containerized deployment to enhance performance.</li></ul>                                               |
| 🛡️  |   **Security**    | <ul><li>Access control and service account management in `herald.yaml`.</li><li>Secure deployment practices using Docker and Terraform.</li><li>Regular dependency updates to mitigate vulnerabilities.</li></ul>                                                                   |
| 📦  | **Dependencies**  | <ul><li>Managed through `deno.jsonc` and `import_map.json` for streamlined development.</li><li>Container dependencies defined in Dockerfile and docker-compose.yml.</li><li>Automated dependency updates with Dependabot.</li></ul>                                                |                                                          |

---

##  Project Structure

```sh
└── herald/
    ├── .github
    │   ├── dependabot.yml
    │   ├── pull_request_template.md
    │   └── workflows
    ├── Dockerfile
    ├── LICENSE.md
    ├── README.md
    ├── benchmarks
    │   ├── bench_saver.ts
    │   ├── result.json
    │   └── sdk
    ├── deno.jsonc
    ├── deno.lock
    ├── docker-compose.yml
    ├── examples
    │   └── simple-bucket-test
    ├── ghjk.ts
    ├── herald-compose.yaml
    ├── herald.yaml
    ├── import_map.json
    ├── src
    │   ├── auth
    │   ├── backends
    │   ├── buckets
    │   ├── config
    │   ├── constants
    │   ├── main.ts
    │   ├── types
    │   ├── utils
    │   └── workers
    ├── tests
    │   ├── iac
    │   ├── mirror
    │   ├── s3
    │   ├── swift
    │   └── utils
    ├── tools
    │   ├── compose
    │   ├── deps.ts
    │   └── s3-comparison
    └── utils
        ├── file.ts
        └── s3.ts
````

### Project Index

<details open>
	<summary><b><code>HERALD/</code></b></summary>
	<details> <!-- __root__ Submodule -->
		<summary><b>__root__</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/herald.yaml'>herald.yaml</a></b></td>
				<td>- The configuration in "herald.yaml" orchestrates the integration and management of storage backends, specifically MinIO S3 and OpenStack Swift, within the project<br>- It defines service accounts, bucket configurations, and replication strategies, facilitating seamless data storage and retrieval<br>- This setup ensures efficient task storage and access control, supporting the project's broader objective of robust and scalable cloud storage solutions.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/deno.jsonc'>deno.jsonc</a></b></td>
				<td>- The `deno.jsonc` configuration file orchestrates various tasks and settings for the project, including development, testing, benchmarking, and code formatting<br>- It defines task commands for running and testing the application, specifies formatting rules, and outlines linting rules to maintain code quality<br>- Additionally, it manages dependencies through an import map, ensuring a streamlined development workflow and consistent code standards across the project.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/Dockerfile'>Dockerfile</a></b></td>
				<td>- Facilitates the deployment of a Deno-based application by defining the environment and dependencies required for execution<br>- Utilizes an Alpine-based Deno image to ensure a lightweight and efficient runtime<br>- Establishes the working directory, copies necessary configuration and source files, and sets up the application to run the main script with appropriate permissions<br>- Integrates seamlessly into the broader project architecture by focusing on containerization and deployment efficiency.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/ghjk.ts'>ghjk.ts</a></b></td>
				<td>- Facilitates the management of development and runtime environments by providing tasks for Docker Compose operations, system dependency installations, and authentication setup<br>- It ensures consistent environments through automated installation of specific versions of Deno and Python, and supports proxy management and rebuilding<br>- This enhances the project's infrastructure by streamlining setup and maintenance processes, contributing to efficient development workflows.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/herald-compose.yaml'>herald-compose.yaml</a></b></td>
				<td>- Configuration of storage backends and buckets for the project is achieved through the herald-compose.yaml file<br>- It defines connections to MinIO S3 and OpenStack Swift, specifying protocols, endpoints, and authentication details<br>- This setup facilitates seamless integration with cloud storage services, enabling efficient data management and retrieval within the project's architecture, while also supporting local development and testing environments.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/import_map.json'>import_map.json</a></b></td>
				<td>- The import_map.json file serves as a centralized configuration for managing module imports within the project<br>- It maps module names to their respective sources, ensuring consistent and efficient dependency management across the codebase<br>- This setup facilitates seamless integration of both Node.js built-in modules and external libraries, enhancing modularity and maintainability while supporting various functionalities like AWS SDK operations, HTTP handling, and data validation.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/docker-compose.yml'>docker-compose.yml</a></b></td>
				<td>- Facilitate the deployment and orchestration of essential services within the project architecture by defining configurations for MinIO, OpenStack Swift, and a custom proxy service<br>- Enable seamless integration and interaction between these components, providing storage solutions and a proxy layer<br>- Ensure services are consistently available and configured with necessary environment variables and ports, supporting the project's overall functionality and scalability.</td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details> <!-- utils Submodule -->
		<summary><b>utils</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/utils/s3.ts'>s3.ts</a></b></td>
				<td>- Facilitates interaction with AWS S3 by providing utility functions for managing S3 buckets and objects<br>- It includes operations such as creating, deleting, and listing buckets and objects, alongside validation checks for these operations<br>- Additionally, it offers a logging mechanism for request details and an alternative method to create buckets without using the AWS SDK, enhancing flexibility and debugging capabilities within the project.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/utils/file.ts'>file.ts</a></b></td>
				<td>- The `utils/file.ts` module facilitates the creation of temporary files and streams, primarily for testing or data handling purposes within the project<br>- It provides functionality to generate a temporary file of a specified size and a corresponding file stream, enabling efficient data manipulation and testing scenarios without affecting the permanent file system<br>- This enhances the project's flexibility in handling file-based operations.</td>
			</tr>
			</table>
		</blockquote>
	</details>
	<details> <!-- examples Submodule -->
		<summary><b>examples</b></summary>
		<blockquote>
			<details>
				<summary><b>simple-bucket-test</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/examples/simple-bucket-test/main.tf'>main.tf</a></b></td>
						<td>- Demonstrates the creation and management of an AWS S3 bucket and an object within it, serving as a practical example for users to understand basic AWS resource provisioning using Terraform<br>- It highlights the dependency management between resources and showcases the use of Terraform functions for file integrity verification, contributing to the project's goal of simplifying cloud infrastructure management through clear, hands-on examples.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/examples/simple-bucket-test/versions.tf'>versions.tf</a></b></td>
						<td>- Define the Terraform configuration for setting up a local AWS S3-compatible storage environment<br>- Specify the required Terraform and AWS provider versions, and configure the AWS provider to connect to a local S3 endpoint with test credentials<br>- Facilitate local testing and development by bypassing AWS-specific validations and using path-style access for S3 operations, aligning with the project's focus on local infrastructure testing.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/examples/simple-bucket-test/lade.yml'>lade.yml</a></b></td>
						<td>- Defines configuration for a simple bucket test within the project, serving as an example or template for users to understand how to set up and execute bucket-related operations<br>- It plays a crucial role in demonstrating the practical application of the project's features, aiding in user onboarding and ensuring that users can effectively utilize the project's capabilities in their own environments.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/examples/simple-bucket-test/sample.txt'>sample.txt</a></b></td>
						<td>- Demonstrates the configuration and deployment of an AWS S3 bucket and an S3 bucket object using Terraform<br>- Serves as an example for setting up cloud storage infrastructure, highlighting the use of Terraform functions for file integrity verification<br>- Contributes to the project's goal of providing practical examples for managing cloud resources, facilitating learning and adoption of infrastructure as code practices.</td>
					</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<details> <!-- benchmarks Submodule -->
		<summary><b>benchmarks</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/benchmarks/result.json'>result.json</a></b></td>
				<td>- The `benchmarks/result.json` file provides performance metrics for various operations within the s3-herald project, such as creating and deleting buckets, and uploading, listing, getting, and deleting objects<br>- These benchmarks help evaluate the efficiency and speed of the system's functionalities, offering insights into potential areas for optimization and ensuring the project's performance aligns with expected standards.</td>
			</tr>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/benchmarks/bench_saver.ts'>bench_saver.ts</a></b></td>
				<td>- Facilitates the execution and storage of benchmark results for the project by running benchmarks in a subprocess and saving the output in JSON format<br>- This process aids in performance evaluation and optimization by providing a structured way to capture and analyze benchmark data, contributing to the overall efficiency and reliability of the codebase within the project's architecture.</td>
			</tr>
			</table>
			<details>
				<summary><b>sdk</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/benchmarks/sdk/buckets_bench.ts'>buckets_bench.ts</a></b></td>
						<td>- Benchmarks the performance of creating and deleting an S3 bucket using the AWS SDK in a local environment<br>- It utilizes Deno's benchmarking tools to measure the time taken for these operations, providing insights into the efficiency of bucket management tasks<br>- This contributes to the overall project by ensuring that S3 interactions are optimized and performant within the system's architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/benchmarks/sdk/objects_bench.ts'>objects_bench.ts</a></b></td>
						<td>- Conducts performance benchmarking for S3 operations, including uploading, listing, retrieving, and deleting objects<br>- Utilizes Deno's benchmarking capabilities to assess the efficiency of handling files of varying sizes, focusing on both whole and chunked uploads<br>- Aims to evaluate the performance of S3 interactions within the project's architecture, providing insights into potential optimizations for file storage and retrieval processes.</td>
					</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<details> <!-- .github Submodule -->
		<summary><b>.github</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/.github/dependabot.yml'>dependabot.yml</a></b></td>
				<td>- Dependabot configuration in the codebase automates the process of checking for updates to GitHub Actions dependencies<br>- By scheduling monthly checks, it ensures that the project remains up-to-date with the latest improvements and security patches<br>- This contributes to maintaining the overall health and security of the codebase, reducing manual effort, and allowing developers to focus on core development tasks.</td>
			</tr>
			</table>
			<details>
				<summary><b>workflows</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/.github/workflows/pr-title-check.yml'>pr-title-check.yml</a></b></td>
						<td>- Ensures that pull request titles adhere to semantic conventions by automatically checking them when a pull request is opened, edited, synchronized, or marked as ready for review<br>- This process helps maintain consistency and clarity in the project's versioning and changelog management, contributing to a more organized and efficient development workflow within the codebase architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/.github/workflows/tests.yml'>tests.yml</a></b></td>
						<td>- Facilitate automated testing and deployment processes within the project's GitHub repository<br>- The workflow triggers on various Git events, such as pushes and pull requests, and orchestrates tasks like running pre-commit checks, building Docker images, and enabling debugging with tmate<br>- It ensures code quality and consistency by integrating continuous integration practices, enhancing the overall development and deployment pipeline.</td>
					</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
	<details> <!-- src Submodule -->
		<summary><b>src</b></summary>
		<blockquote>
			<table>
			<tr>
				<td><b><a href='https://github.com/expnt/herald/blob/master/src/main.ts'>main.ts</a></b></td>
				<td>- The main entry point of the application initializes configurations, logging, and error handling, and sets up a web server using the Hono framework<br>- It manages incoming requests, performs health checks, verifies authentication tokens, and routes requests to appropriate handlers<br>- Additionally, it integrates Sentry for error reporting and supports graceful shutdowns, ensuring robust and secure operation within the project's architecture.</td>
			</tr>
			</table>
			<details>
				<summary><b>buckets</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/buckets/mod.ts'>mod.ts</a></b></td>
						<td>- The code defines a structure for managing storage buckets within the project, supporting both S3 and Swift configurations<br>- It facilitates the creation and initialization of bucket instances, including their replicas, based on global configuration settings<br>- This setup allows for efficient management and retrieval of bucket information, ensuring seamless integration with different storage backends and enhancing the project's data storage capabilities.</td>
					</tr>
					</table>
				</blockquote>
			</details>
			<details>
				<summary><b>types</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/types/mod.ts'>mod.ts</a></b></td>
						<td>- Defines and organizes type definitions crucial for ensuring type safety and consistency across the codebase<br>- By centralizing type management, it facilitates easier maintenance and scalability, allowing developers to implement features with reduced risk of type-related errors<br>- This approach enhances collaboration among team members by providing a clear and shared understanding of data structures and their intended use within the project architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/types/api_errors.ts'>api_errors.ts</a></b></td>
						<td>- Define and manage error handling for API requests by mapping specific error codes to detailed descriptions, HTTP status codes, and error sources<br>- Facilitate consistent error responses across the application, particularly for authentication and signature validation issues<br>- Enhance the robustness of the system by providing clear feedback to clients when requests fail due to authorization or signature mismatches, ensuring better debugging and user experience.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/types/http-exception.ts'>http-exception.ts</a></b></td>
						<td>- Facilitates error handling within the project by defining an `HTTPException` class, which is used to manage fatal errors like authentication failures<br>- It provides a structured way to generate HTTP responses with customizable status codes and messages, ensuring consistent error reporting across the application<br>- This enhances the robustness and maintainability of the codebase by centralizing exception handling logic.</td>
					</tr>
					</table>
				</blockquote>
			</details>
			<details>
				<summary><b>config</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/config/mod.ts'>mod.ts</a></b></td>
						<td>- The configuration module in the codebase centralizes the initialization and management of global settings, environment variables, and bucket storage configurations<br>- It facilitates the retrieval of specific bucket configurations for S3 and Swift, sets up a proxy URL, and initializes the bucket store<br>- This module plays a crucial role in ensuring consistent configuration management across the application, enhancing maintainability and scalability.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/config/loader.ts'>loader.ts</a></b></td>
						<td>- Facilitates the loading and validation of configuration settings for the project, ensuring compatibility with both S3 and Swift protocols<br>- It reads configuration data from YAML files and environment variables, validates the configurations against predefined schemas, and checks for duplicate backup configurations<br>- This process ensures that the system's backend and bucket configurations are correctly set up and error-free.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/config/types.ts'>types.ts</a></b></td>
						<td>- Define and validate configuration schemas for different storage backends, including S3 and Swift, within the project's architecture<br>- It facilitates the management of bucket and replica configurations, service account access, and global settings<br>- By leveraging these schemas, the codebase ensures consistent configuration handling, enabling seamless integration with various storage services and supporting environment-specific configurations for development and production environments.</td>
					</tr>
					</table>
				</blockquote>
			</details>
			<details>
				<summary><b>auth</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/auth/mod.ts'>mod.ts</a></b></td>
						<td>- Facilitates authentication and authorization by verifying Kubernetes service account tokens<br>- It retrieves and caches JSON Web Keys (JWKs) from the Kubernetes API to validate tokens, ensuring secure access to resources<br>- Additionally, it checks if a service account has access to specific buckets, integrating seamlessly with the project's configuration and logging utilities to maintain robust security and traceability.</td>
					</tr>
					</table>
				</blockquote>
			</details>
			<details>
				<summary><b>constants</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/routes.ts'>routes.ts</a></b></td>
						<td>- Defines key route constants for the application, facilitating consistent and centralized management of URL paths related to S3 objects and buckets<br>- By abstracting these routes, the codebase ensures easier maintenance and scalability, allowing developers to reference these paths throughout the application without hardcoding them, thereby reducing the risk of errors and improving overall code readability and organization.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/headers.ts'>headers.ts</a></b></td>
						<td>- Defines a set of constants representing HTTP headers and query parameters used for authentication and request signing in AWS and OpenStack environments<br>- These constants facilitate consistent and standardized handling of headers across the codebase, ensuring seamless integration with AWS services and OpenStack Swift<br>- By centralizing these values, the codebase maintains clarity and reduces the risk of errors related to header management.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/errors.ts'>errors.ts</a></b></td>
						<td>- Defines custom HTTP exceptions for error handling within the project, focusing on XML-formatted error responses<br>- It includes specific exceptions for scenarios such as non-existent buckets, unimplemented methods, and disallowed HTTP methods<br>- These exceptions enhance the robustness of the application by providing clear and structured error messages, contributing to a more maintainable and user-friendly error management system across the codebase.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/query-params.ts'>query-params.ts</a></b></td>
						<td>- Defines a set of query parameters and a constant for XML content type used in interactions with Amazon S3 services<br>- These constants standardize and streamline the process of constructing requests to S3, ensuring consistency across the codebase<br>- By centralizing these parameters, the project enhances maintainability and reduces the likelihood of errors when dealing with S3-related operations, contributing to a more robust architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/message.ts'>message.ts</a></b></td>
						<td>- Define a constant named SAVETASKQUEUE, which likely serves as a key or identifier within the broader project architecture<br>- This constant is used to standardize and centralize the reference to a specific task queue, promoting consistency and reducing the risk of errors across the codebase<br>- It plays a crucial role in managing task-related operations efficiently within the system.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/http_status_codes.ts'>http_status_codes.ts</a></b></td>
						<td>- Define and centralize HTTP status codes for the project, ensuring consistent usage across the codebase<br>- By providing a single source of truth for these codes, the constants facilitate easier maintenance and readability, reducing the likelihood of errors related to hardcoded values<br>- This approach supports the overall architecture by promoting modularity and reusability, aligning with best practices in software development.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/time.ts'>time.ts</a></b></td>
						<td>- Defining a constant for the task queue timeout, the code establishes a standardized time interval for saving tasks within the application<br>- This ensures consistency and reliability in task management operations across the codebase<br>- By centralizing this timeout value, the project enhances maintainability and simplifies future adjustments, contributing to a more robust and scalable architecture.</td>
					</tr>
					</table>
				</blockquote>
			</details>
			<details>
				<summary><b>backends</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/mod.ts'>mod.ts</a></b></td>
						<td>- Facilitates request handling by resolving backend services for bucket operations within the architecture<br>- It verifies bucket access permissions and retrieves bucket configurations, determining the appropriate backend protocol (S3 or Swift) to process requests<br>- Ensures security and error handling by logging critical issues and throwing HTTP exceptions for unauthorized access or missing configurations, thereby maintaining robust backend service integration.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/types.ts'>types.ts</a></b></td>
						<td>- Facilitates the mirroring of operations between two bucket configurations within the project's architecture<br>- It defines types and interfaces for tasks that involve commands like creating, deleting, or copying objects and buckets<br>- By structuring these operations, it ensures seamless data replication and synchronization across different storage backends, enhancing data redundancy and reliability in the system.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/task_store.ts'>task_store.ts</a></b></td>
						<td>- Manages tasks and their states by synchronizing with both remote (S3) and local (Deno.Kv) storage, ensuring consistency across the application<br>- Implements a singleton pattern to maintain a single instance, providing methods for serializing, deserializing, uploading, and fetching data<br>- Facilitates synchronization of task queues and locks, enhancing reliability and efficiency in task management within the broader codebase architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/mirror.ts'>mirror.ts</a></b></td>
						<td>- Facilitates the mirroring of storage operations between primary and replica buckets across S3 and Swift backends<br>- It manages tasks such as creating, deleting, copying, and putting objects or buckets, ensuring data consistency and redundancy<br>- The module integrates with a task queue for asynchronous processing and employs logging and error reporting to maintain operational reliability within the distributed storage architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/tasks.ts'>tasks.ts</a></b></td>
						<td>- Facilitates task management and execution within the project by setting up and managing worker threads for processing tasks from a queue<br>- It ensures tasks are assigned to appropriate workers based on their designated buckets, handles task completion or failure, and manages worker lifecycle, including re-enqueuing tasks if workers are busy or recreating workers if they fail, maintaining efficient task processing.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/worker.ts'>worker.ts</a></b></td>
						<td>- Facilitates task processing within a worker environment by initializing configuration and logging systems, and handling incoming tasks<br>- It listens for messages containing tasks, logs the task details, processes them, and communicates completion back to the main thread<br>- This component is crucial for parallel task execution, enhancing the system's efficiency and responsiveness within the broader architecture of the project.</td>
					</tr>
					</table>
					<details>
						<summary><b>s3</b></summary>
						<blockquote>
							<table>
							<tr>
								<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/s3/mod.ts'>mod.ts</a></b></td>
								<td>- Facilitates interaction with Amazon S3 by handling HTTP requests for object and bucket operations<br>- It supports actions like creating, deleting, and retrieving objects and buckets, while also managing query parameters and logging<br>- The module ensures appropriate responses for supported methods and throws exceptions for unsupported actions, integrating seamlessly into the broader architecture to manage S3 resources efficiently.</td>
							</tr>
							<tr>
								<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/s3/objects.ts'>objects.ts</a></b></td>
								<td>- Facilitates interaction with S3-compatible storage by handling object operations such as retrieval, listing, uploading, deletion, and copying<br>- It ensures requests are forwarded with appropriate timeouts and manages error handling, including attempts on replica configurations<br>- Additionally, it logs operations and reports failures to Sentry, supporting both primary and mirrored storage configurations for enhanced reliability and redundancy within the system architecture.</td>
							</tr>
							<tr>
								<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/s3/buckets.ts'>buckets.ts</a></b></td>
								<td>- Facilitates the management of S3 buckets by handling requests to create, delete, query, and check the existence of buckets<br>- It ensures operations are logged, errors are reported, and requests are forwarded with appropriate timeouts<br>- Additionally, it supports mirroring operations for bucket replicas, enhancing data redundancy and availability across different storage backends, including S3 and Swift.</td>
							</tr>
							</table>
						</blockquote>
					</details>
					<details>
						<summary><b>swift</b></summary>
						<blockquote>
							<table>
							<tr>
								<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/mod.ts'>mod.ts</a></b></td>
								<td>- Facilitates the handling of HTTP requests for Swift-based object storage operations within the codebase<br>- It manages bucket and object operations such as creation, deletion, and metadata retrieval, while also addressing query parameter-based requests for bucket configurations like policy, ACL, and encryption<br>- By leveraging utility functions and logging, it ensures efficient request resolution and error handling, contributing to the overall storage management architecture.</td>
							</tr>
							<tr>
								<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/objects.ts'>objects.ts</a></b></td>
								<td>- Facilitate object storage operations within the Swift backend, including putting, getting, deleting, listing, and copying objects<br>- It handles authentication, constructs requests, and manages retries with exponential backoff<br>- Additionally, it supports mirroring operations across replicas and integrates error reporting to Sentry, ensuring robust and reliable object management in a distributed storage environment.</td>
							</tr>
							<tr>
								<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/buckets.ts'>buckets.ts</a></b></td>
								<td>- The file `src/backends/swift/buckets.ts` is a crucial component of the project's architecture, primarily responsible for managing interactions with Swift storage buckets<br>- It facilitates the creation and management of these buckets by integrating authentication, error handling, and logging mechanisms<br>- The file leverages utility functions for handling HTTP requests and responses, ensuring robust communication with Swift storage services<br>- Additionally, it supports mirroring requests and integrates with other storage backends like S3, highlighting its role in providing a seamless and unified interface for storage operations within the broader system.</td>
							</tr>
							<tr>
								<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/auth.ts'>auth.ts</a></b></td>
								<td>- Facilitates authentication with an OpenStack Swift server by obtaining an authorization token and storage URL<br>- It handles multiple authentication scenarios, including retrying with exponential backoff in case of failures<br>- The module also provides functionality to generate request headers for Swift API interactions, ensuring secure and authenticated communication within the broader architecture of the project.</td>
							</tr>
							</table>
							<details>
								<summary><b>utils</b></summary>
								<blockquote>
									<table>
									<tr>
										<td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/utils/mod.ts'>mod.ts</a></b></td>
										<td>- Facilitates the transformation of JSON responses from Swift storage into XML format compatible with Amazon S3<br>- It ensures data consistency by converting date formats and structuring object metadata<br>- This utility supports seamless integration between Swift and S3 by enabling applications to interpret Swift responses as if they were native S3 responses, enhancing interoperability within the project's storage backend architecture.</td>
									</tr>
									</table>
								</blockquote>
							</details>
						</blockquote>
					</details>
				</blockquote>
			</details>
			<details>
				<summary><b>utils</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/signal_handlers.ts'>signal_handlers.ts</a></b></td>
						<td>- Facilitates graceful shutdown of the application by handling termination signals<br>- It ensures that resources are cleared and the current state is saved by synchronizing the task queue to a remote location<br>- This process includes a timeout mechanism to prevent indefinite waiting<br>- Integral to maintaining data integrity and application stability during shutdown, it enhances the robustness of the overall codebase architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/mod.ts'>mod.ts</a></b></td>
						<td>- The `src/utils/mod.ts` module consolidates various utility functions and types, enhancing modularity and reusability across the codebase<br>- It imports and re-exports functionalities related to logging, data types, URL manipulation, S3 interactions, error handling, request signing, and cryptographic operations<br>- Additionally, it provides a utility to determine if the code is executing within a web worker environment, supporting diverse runtime contexts.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/signer.ts'>signer.ts</a></b></td>
						<td>- Facilitates AWS S3 request signing and verification using AWS Signature Version 4<br>- It provides functions to create a V4 signer, extract and verify signatures, and convert between native and signable request formats<br>- This utility ensures secure communication with S3 by validating request authenticity and integrity, playing a crucial role in the project's security and data integrity architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/s3.ts'>s3.ts</a></b></td>
						<td>- Facilitates interaction with AWS S3 by configuring an S3 client and extracting request metadata<br>- It supports logging for debugging, determines URL format styles, and identifies bucket names and object keys from requests<br>- This functionality is crucial for managing S3 operations within the project, ensuring efficient data handling and integration with AWS services while maintaining robust error handling and logging capabilities.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/http-status.ts'>http-status.ts</a></b></td>
						<td>- Defines a comprehensive set of HTTP status codes categorized into informational, success, redirection, client error, server error, and unofficial codes<br>- Facilitates consistent handling and representation of HTTP responses across the codebase, ensuring that developers can easily reference and utilize standardized status codes for API responses, enhancing code readability and maintainability within the project's architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/crypto.ts'>crypto.ts</a></b></td>
						<td>- Facilitates the generation of random integers and UUIDs, enhancing the project's capability to handle operations requiring randomness and unique identifiers<br>- By abstracting these functionalities, it supports various components within the codebase that depend on secure and efficient random data generation, contributing to the overall robustness and flexibility of the system's utility functions.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/url.ts'>url.ts</a></b></td>
						<td>- The `src/utils/url.ts` module enhances request handling within the codebase by providing utility functions for URL manipulation, request forwarding, and validation<br>- It facilitates redirect URL generation, replica retrieval, and request forwarding with signature verification and retries<br>- Additionally, it includes functions for checking content length, validating IP addresses, and serializing requests, contributing to robust and efficient network operations.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/types.ts'>types.ts</a></b></td>
						<td>- Defines and validates types related to HTTP requests, ensuring consistent handling of HTTP methods, URL formats, and request metadata across the codebase<br>- Utilizes the Zod library for schema validation, enhancing type safety and reducing runtime errors<br>- Plays a crucial role in standardizing request structures, which is essential for maintaining robust communication protocols within the project's architecture.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/log.ts'>log.ts</a></b></td>
						<td>- Facilitates logging functionality across the codebase by providing utilities to set up and retrieve logger instances with customizable levels and handlers<br>- Integrates with Sentry for error reporting, enhancing error tracking and debugging<br>- Supports dynamic logger naming based on file paths, ensuring consistent and informative log messages, which aids in monitoring and maintaining the application's operational health.</td>
					</tr>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/error.ts'>error.ts</a></b></td>
						<td>- Facilitates error handling by converting error objects into XML-formatted responses, enhancing interoperability with systems that require XML data<br>- It generates a structured XML error message, including details like error code, message, and a unique request ID<br>- This functionality is crucial for maintaining consistent error reporting across the application, ensuring that clients receive standardized error information in a format they can process.</td>
					</tr>
					</table>
				</blockquote>
			</details>
			<details>
				<summary><b>workers</b></summary>
				<blockquote>
					<table>
					<tr>
						<td><b><a href='https://github.com/expnt/herald/blob/master/src/workers/mod.ts'>mod.ts</a></b></td>
						<td>- Registering workers within the project architecture ensures that task handlers are initialized and ready for operation<br>- By leveraging logging capabilities, the process provides transparency and traceability during worker registration<br>- This functionality is crucial for managing asynchronous tasks efficiently, contributing to the overall robustness and scalability of the system by enabling distributed task processing and monitoring within the project's backend infrastructure.</td>
					</tr>
					</table>
				</blockquote>
			</details>
		</blockquote>
	</details>
</details>

---

## Getting Started

### Prerequisites

Before getting started with herald, ensure your runtime environment meets the following requirements:

- **Programming Language:** TypeScript
- **Container Runtime:** Docker

### Development

Install herald using one of the following methods:

**Build from source:**

1. Clone the herald repository:

```sh
❯ git clone https://github.com/expnt/herald
```

2. Navigate to the project directory:

```sh
❯ cd herald
```

3. Install ghjk

[ghjk](https://github.com/metatypedev/ghjk) is a developer environment management tool used to install dependencies required to run herald.

4. Install dependencies

```sh
❯ ghjk p resolve
```

5. Run services needed for herald.

We just spin a minio s3 server and a swift object storage container in docker.

```sh
❯ ghjk dev-compose up all
```

6. Configure herald.yaml

Configuration for the cloud services that herald connects with are defined here. Other configs such as the port it runs on, temporary dir for tests is also defined here. The object storage for a task store is also defined here. A serialized task store is saved in the specified storage service where durable tasks for mirroring tasks are stored. Service account names are also configured for jwk based authentication. This is a sample configuration file.

```yaml
port: 8000
temp_dir: "./tmp"
backends:
  minio_s3:
    protocol: s3
  openstack_swift:
    protocol: swift
  exoscale_s3:
    protocol: s3

task_store_backend:
  endpoint: "http://localhost:9000"
  region: local
  forcePathStyle: true
  bucket: task-store
  credentials:
    accessKeyId: minio
    secretAccessKey: password

service_accounts:
  - name: "system:serviceaccount:dev-s3-herald:default"
    buckets:
      - s3-test
      - s3-mirror-test
      - swift-mirror-test
      - iac-s3
  - name: "system:serviceaccount:stg-datacycle:datacycle-app-backend-sa"
    buckets:
      - s3-test
      - s3-mirror-test
      - iac-s3

buckets:
  s3-test:
    backend: minio_s3
    config:
      endpoint: "http://localhost:9000"
      region: local
      forcePathStyle: true
      bucket: s3-test
      credentials:
        accessKeyId: minio
        secretAccessKey: password

replicas:
  - name: replica-0
    backend: minio_s3
    config:
      endpoint: "http://localhost:9090"
      region: local
      forcePathStyle: true
      bucket: s3-test
      credentials:
        accessKeyId: minio
        secretAccessKey: password
```


7. Run herald

```sh
❯ deno run src/main.ts
```

### herald.yaml config file

This configuration YAML file is used to set up and manage the Herald service, which interacts with various storage backends and service accounts. Below is a detailed description of the key sections in the file:

- **port**: Specifies the port number (8000) on which herald will run.
- **temp_dir**: Defines the temporary directory (`./tmp`) used by the service.
- **backends**: Lists the supported storage backends, including `minio_s3`, `openstack_swift`, and `exoscale_s3`, each with its respective protocol.
- **task_store_backend**: Configures the backend for storing tasks, including the endpoint, region, path style, bucket name, and credentials (access key ID and secret access key).
- **service_accounts**: Defines the service accounts with access to specific buckets. Each service account has a name and a list of accessible buckets.
- **buckets**: Specifies the configuration for individual buckets, including the backend type, endpoint, region, path style, bucket name, and credentials.
- **replicas**: Configures replicas for redundancy and load balancing. Each replica has a name, backend type, and configuration similar to the buckets section.

This configuration file allows for flexible and secure management of storage resources and service accounts, ensuring that the Herald service can interact with multiple storage backends and maintain high availability through replicas.

### Environment Variables
| **Name**                   | **Default**  | **Description**  |
|----------------------------|------------------------------|-------------------------------|
| **debug**                  | —                                                                      | Boolean string that enables or disables debug mode.                                            |
| **log_level**              | (optional)                                                             | Logging level; possible values: `NOTSET`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `CRITICAL`.        |
| **env**                    | `DEV`                                                                  | Environment in which the application runs (`DEV` or `PROD`).                                  |
| **k8s_api**                | `https://kubernetes.default.svc`                                      | URL for the Kubernetes API.                                                                   |
| **cert_path**              | `/var/run/secrets/kubernetes.io/serviceaccount/ca.crt`                 | File path to the Kubernetes service account CA certificate.                                   |
| **config_file_path**       | herald.yaml | Path to the Herald configuration file.                                                        |
| **service_account_token_path** | `/var/run/secrets/kubernetes.io/serviceaccount/token`              | File path to the Kubernetes service account token.                                            |
| **version**                | `0.1`                                                                  | Application version.                                                                          |
| **sentry_dsn**             | (optional)                                                             | DSN for Sentry, used for error tracking.                                                      |
| **sentry_sample_rate**     | `1`                                                                    | Sampling rate for Sentry events (numeric, 0 to 1).                                            |
| **sentry_traces_sample_rate** | `1`                                                                 | Sampling rate for Sentry traces (numeric, 0 to 1).                                            |

### Run using docker

Pull the image first

```sh
❯ docker pull ghcr.io/expnt/herald:latest
```

Run herald using the following command:
**Using `docker`** &nbsp; [<img align="center" src="https://img.shields.io/badge/Docker-2CA5E0.svg?style={badge_style}&logo=docker&logoColor=white" />](https://www.docker.com/)

```sh
❯ docker run -it expnt/herald:latest
```

### Testing

To run full tests,

```sh
❯ deno test -A tests
```

---

## Project Roadmap

- [x] **`Task 1`**: Mirroring
- [ ] **`Task 2`**: Event Notification.
- [ ] **`Task 3`**: Advanced Cache Policy

---

## Contributing

- **💬 [Join the Discussions](https://github.com/expnt/herald/discussions)**: Share your insights, provide feedback, or ask questions.
- **🐛 [Report Issues](https://github.com/expnt/herald/issues)**: Submit bugs found or log feature requests for the `herald` project.
- **💡 [Submit Pull Requests](https://github.com/expnt/herald/blob/main/CONTRIBUTING.md)**: Review open PRs, and submit your own PRs.

<details closed>
<summary>Contributing Guidelines</summary>

1. **Fork the Repository**: Start by forking the project repository to your github account.
2. **Clone Locally**: Clone the forked repository to your local machine using a git client.
   ```sh
   git clone https://github.com/expnt/herald
   ```
3. **Create a New Branch**: Always work on a new branch, giving it a descriptive name.
   ```sh
   git checkout -b new-feature-x
   ```
4. **Make Your Changes**: Develop and test your changes locally.
5. **Commit Your Changes**: Commit with a clear message describing your updates.
   ```sh
   git commit -m 'Implemented new feature x.'
   ```
6. **Push to github**: Push the changes to your forked repository.
   ```sh
   git push origin new-feature-x
   ```
7. **Submit a Pull Request**: Create a PR against the original project repository. Clearly describe the changes and their motivations.
8. **Review**: Once your PR is reviewed and approved, it will be merged into the main branch. Congratulations on your contribution!
</details>

<details closed>
<summary>Contributor Graph</summary>
<br>
<p align="left">
   <a href="https://github.com{/expnt/herald/}graphs/contributors">
      <img src="https://contrib.rocks/image?repo=expnt/herald">
   </a>
</p>
</details>

---

## Acknowledgments

- List any resources, contributors, inspiration, etc. here.

---
