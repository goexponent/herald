<p align="center">
    <img src="https://raw.githubusercontent.com/PKief/vscode-material-icon-theme/ec559a9f6bfd399b82bb44393651661b08aaf7ba/icons/folder-markdown-open.svg" align="center" width="30%">
</p>
<p align="center"><h1 align="center">HERALD</h1></p>
<p align="center">
    <em>Empowering Data Management: Herald - Your Gateway to Efficient Distributed Storage!</em>
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

##  Table of Contents

- [ Overview](#-overview)
- [ Features](#-features)
- [ Project Structure](#-project-structure)
  - [ Project Index](#-project-index)
- [ Getting Started](#-getting-started)
  - [ Prerequisites](#-prerequisites)
  - [ Installation](#-installation)
  - [ Usage](#-usage)
  - [ Testing](#-testing)
- [ Project Roadmap](#-project-roadmap)
- [ Contributing](#-contributing)
- [ License](#-license)
- [ Acknowledgments](#-acknowledgments)

---

##  Overview

, 'The herald-compose.yaml file is used to define and manage multi-container Docker applications. It specifies the services, networks, and volumes for the application, and sets up the environment for running the Herald project.')]]

The Herald project is an innovative open-source solution for managing distributed storage systems. It simplifies data replication across multiple platforms, ensuring efficient data management. Key features include configuration for various storage services, code quality maintenance, and Docker environment setup. It's ideal for developers and organizations seeking to streamline their storage backend processes.

---

##  Features

|      | Feature         | Summary       |
| :--- | :---:           | :---          |
| ⚙️  | **Architecture**  | <ul><li>The project uses a distributed storage system architecture.</li><li>It uses various storage backends and replicas.</li><li>It is configured to connect with different storage services like Minio S3 and OpenStack Swift.</li></ul> |
| 🔩 | **Code Quality**  | <ul><li>The primary language used is TypeScript.</li><li>It uses a Deno runtime with a configuration file for maintaining code quality and consistency.</li><li>It has rules for formatting and linting the code.</li></ul> |
| 📄 | **Documentation** | <ul><li>The project uses Docker for containerization.</li><li>It provides installation and usage commands for Docker.</li><li>It does not seem to have a dedicated package manager.</li></ul> |
| 🔌 | **Integrations**  | <ul><li>The project integrates with Docker and Docker Compose for containerization.</li><li>It uses GitHub Actions for CI/CD.</li><li>It integrates with storage services like Minio S3 and OpenStack Swift.</li></ul> |
| 🧩 | **Modularity**    | <ul><li>The project is modular with separate configuration files for different aspects.</li><li>It uses an import map to manage dependencies.</li><li>It has separate tasks for development, testing, benchmarking, and production runs.</li></ul> |
| 🧪 | **Testing**       | <ul><li>The project does not seem to have a dedicated testing framework.</li><li>However, it has a configuration file for testing tasks.</li><li>It uses GitHub Actions for continuous integration.</li></ul> |
| ⚡️  | **Performance**   | <ul><li>The project uses a distributed storage system for efficient data management.</li><li>It uses Docker for containerization, which can improve performance.</li><li>It uses Deno, which is known for its performance benefits over Node.js.</li></ul> |
| 🛡️ | **Security**      | <ul><li>The project uses Docker, which provides isolation and security benefits.</li><li>It uses Dependabot for automated dependency updates, improving security.</li><li>It uses Deno, which is secure by default, requiring explicit permissions for file, network, and environment access.</li></ul> |
| 📦 | **Dependencies**  | <ul><li>The project uses Docker and Docker Compose as key dependencies.</li><li>It uses Deno as the runtime environment.</li><li>It uses GitHub Actions for CI/CD.</li></ul> |

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
```


###  Project Index
<details open>
    <summary><b><code>HERALD/</code></b></summary>
    <details> <!-- __root__ Submodule -->
        <summary><b>__root__</b></summary>
        <blockquote>
            <table>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/herald.yaml'>herald.yaml</a></b></td>
                <td>- Herald.yaml serves as a configuration file for a distributed storage system, defining the settings for various storage backends and replicas<br>- It specifies the connection details for different storage services like Minio S3 and OpenStack Swift, and sets up the task store backend and service accounts<br>- It also outlines the configuration for various buckets and replicas, enabling efficient data management and replication across multiple storage platforms.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/deno.jsonc'>deno.jsonc</a></b></td>
                <td>- The deno.jsonc file serves as a configuration file for the Deno runtime in the project<br>- It defines tasks for development, testing, benchmarking, and production runs<br>- It also sets rules for formatting and linting the code, and specifies an import map<br>- This file is crucial for maintaining code quality and consistency across the project.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/Dockerfile'>Dockerfile</a></b></td>
                <td>- The Dockerfile establishes the environment for a Deno application, specifying the base image and working directory<br>- It copies necessary configuration files and the source code into the container, pre-caches dependencies, and sets the entry point and command for running the application<br>- The file also indicates that health checks and user settings are managed externally.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/ghjk.ts'>ghjk.ts</a></b></td>
                <td>- The ghjk.ts file manages the installation and setup of system dependencies, including specific versions of Deno and Python<br>- It also controls the operation of Docker containers, including the development environment and proxy<br>- Additionally, it handles the setup of authentication through Kubernetes service account tokens and certificates.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/herald-compose.yaml'>herald-compose.yaml</a></b></td>
                <td>- Herald-compose.yaml configures the Herald application to interact with two different storage backends, Minio S3 and Openstack Swift<br>- It specifies the connection details, credentials, and bucket information for each backend<br>- This allows the application to store and retrieve data from these services, enabling flexible and scalable data management.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/import_map.json'>import_map.json</a></b></td>
                <td>- The import_map.json file serves as a mapping configuration for the project's dependencies<br>- It specifies the locations of various modules, including AWS SDK, Node.js built-in modules, and other third-party libraries<br>- This configuration aids in the efficient and accurate import of these modules throughout the codebase, ensuring seamless functionality and interoperability.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/docker-compose.yml'>docker-compose.yml</a></b></td>
                <td>- The docker-compose.yml orchestrates the deployment of three services: Minio, Swift, and a Proxy<br>- Minio and Swift are object storage systems, while the Proxy service, built from a local Dockerfile, serves as an intermediary for requests<br>- The configuration ensures these services restart unless manually stopped, and exposes specific ports for each service.</td>
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
                <td>- The 'utils/s3.ts' module provides a set of utility functions for interacting with Amazon S3 service<br>- It includes functions for creating and deleting buckets, listing objects within a bucket, and handling various S3 operations such as uploading, copying, and retrieving objects<br>- It also includes middleware for logging requests when in debug mode.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/utils/file.ts'>file.ts</a></b></td>
                <td>- The 'utils/file.ts' module in the project provides functionality for creating temporary files and streams of a specified size<br>- It exports two main functions: 'createTempFile' and 'createTempStream'<br>- These functions are used to generate temporary files and readable streams respectively, which are essential for data handling and manipulation within the application.</td>
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
                        <td>- The main.tf file in the simple-bucket-test example creates an AWS S3 bucket and uploads an object to it<br>- It uses the Terraform filemd5 function to generate an ETag for the uploaded object, ensuring data integrity<br>- The object's creation is dependent on the successful creation of the S3 bucket.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/examples/simple-bucket-test/versions.tf'>versions.tf</a></b></td>
                        <td>- The 'versions.tf' file in the 'simple-bucket-test' directory sets the required Terraform and AWS provider versions for the project<br>- It also configures the AWS provider with specific endpoints, region, access keys, and disables certain AWS-specific features<br>- This configuration is crucial for the project's interaction with AWS services.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/examples/simple-bucket-test/lade.yml'>lade.yml</a></b></td>
                        <td>- Lade.yml, located in the simple-bucket-test example directory, serves as a configuration file for the project<br>- It outlines the parameters for testing the functionality of a simple storage bucket<br>- This file plays a crucial role in ensuring the reliability and performance of the storage component within the larger codebase architecture.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/examples/simple-bucket-test/sample.txt'>sample.txt</a></b></td>
                        <td>- The sample.txt file in the simple-bucket-test example is a Terraform script that creates an AWS S3 bucket named 's3-test' and uploads an object to it<br>- It also calculates the MD5 hash of the uploaded file<br>- The script includes commands for applying and destroying the Terraform configuration.</td>
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
                <td>- The 'result.json' file in the 'benchmarks' directory provides performance metrics for the S3-Herald project<br>- It contains benchmarking data for various operations such as creating and deleting buckets, uploading objects, and listing objects<br>- This data aids in understanding the efficiency and speed of the project's operations.</td>
            </tr>
            <tr>
                <td><b><a href='https://github.com/expnt/herald/blob/master/benchmarks/bench_saver.ts'>bench_saver.ts</a></b></td>
                <td>- The 'bench_saver.ts' script in the 'benchmarks' directory executes performance benchmarks in a subprocess, capturing the results in JSON format<br>- It then saves these results to a 'result.json' file within the same directory<br>- This aids in tracking and comparing the performance of the codebase over time.</td>
            </tr>
            </table>
            <details>
                <summary><b>sdk</b></summary>
                <blockquote>
                    <table>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/benchmarks/sdk/buckets_bench.ts'>buckets_bench.ts</a></b></td>
                        <td>- Benchmarks/sdk/buckets_bench.ts is a performance testing module for the S3 client's bucket creation and deletion operations<br>- It uses Deno's benchmarking tool to measure the execution time of these operations, providing valuable insights into the efficiency of the S3 client within the larger codebase.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/benchmarks/sdk/objects_bench.ts'>objects_bench.ts</a></b></td>
                        <td>- The 'objects_bench.ts' file in the 'sdk' directory under 'benchmarks' is primarily used for performance testing of various AWS S3 operations<br>- It includes benchmarks for uploading files, both as a whole and in chunks, listing objects, retrieving an object, and deleting an object from an S3 bucket.</td>
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
                <td>- The .github/dependabot.yml in the project structure is responsible for automating dependency updates<br>- It is configured to check for updates in the GitHub Actions package ecosystem on a monthly basis<br>- This ensures the project's dependencies are always up-to-date, enhancing security and performance.</td>
            </tr>
            </table>
            <details>
                <summary><b>workflows</b></summary>
                <blockquote>
                    <table>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/.github/workflows/pr-title-check.yml'>pr-title-check.yml</a></b></td>
                        <td>- The pr-title-check.yml in the .github/workflows directory ensures that pull request titles adhere to a semantic format<br>- It triggers on various pull request events and uses the action-semantic-pull-request action to perform the check<br>- This contributes to maintaining a clean and understandable project history.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/.github/workflows/tests.yml'>tests.yml</a></b></td>
                        <td>- The 'tests.yml' file in the '.github/workflows' directory orchestrates the continuous integration process for the project<br>- It triggers tests on code changes, sets up the necessary environment, and builds Docker images<br>- The file also supports debugging via tmate and handles different types of pull request events.</td>
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
                <td>- The main.ts file serves as the entry point of the application, initializing configurations, setting up logging, and handling error reporting<br>- It establishes routes for health checks and proxy functionality, manages authentication, and resolves request handlers<br>- The file also registers signal handlers and workers, and controls the server's lifecycle.</td>
            </tr>
            </table>
            <details>
                <summary><b>buckets</b></summary>
                <blockquote>
                    <table>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/buckets/mod.ts'>mod.ts</a></b></td>
                        <td>- The 'src/buckets/mod.ts' module in the project architecture initializes and manages bucket stores<br>- It defines the Bucket class and the BucketStore interface, allowing the creation of bucket instances with specific configurations and replicas<br>- The module also provides methods for retrieving replicas and checking their existence.</td>
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
                        <td>- Src/types/mod.ts serves as a central hub for type definitions within the project<br>- It consolidates and exports all types used across the codebase, ensuring consistency and facilitating easier maintenance<br>- This structure enhances code readability and simplifies debugging processes.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/types/api_errors.ts'>api_errors.ts</a></b></td>
                        <td>- The src/types/api_errors.ts file defines an enumeration of API errors and their corresponding details, including code, description, HTTP status code, and error source<br>- It also provides a function to generate a standardized HTTP response for each error<br>- This contributes to the overall codebase by ensuring consistent error handling across the application.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/types/http-exception.ts'>http-exception.ts</a></b></td>
                        <td>- The HTTPException module in the src/types directory provides a custom error handling mechanism for the application<br>- It is primarily used for handling fatal errors such as authentication failures, allowing developers to throw custom HTTP exceptions with specific status codes and messages<br>- This contributes to the robustness and reliability of the application's error handling strategy.</td>
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
                        <td>- The 'src/config/mod.ts' module initializes and exports configurations for the application<br>- It loads global and environment-specific settings, sets up a proxy URL, and initializes a bucket store<br>- The module also provides functions to retrieve specific S3 and Swift bucket configurations.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/config/loader.ts'>loader.ts</a></b></td>
                        <td>- The 'loader.ts' file in the 'src/config' directory is responsible for managing the configuration of the application<br>- It reads and validates YAML configuration files, handles environment variables, and ensures the correct setup of backend services and bucket storage<br>- The file also provides error handling for configuration issues.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/config/types.ts'>types.ts</a></b></td>
                        <td>- The 'types.ts' file in the 'src/config' directory defines and exports various configuration schemas and types for the application<br>- It includes schemas for backend, S3, Swift, bucket, and replica configurations, as well as global and environment variable configurations<br>- The file also contains utility functions to validate and convert these configurations.</td>
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
                        <td>- The 'src/auth/mod.ts' module is responsible for verifying service account tokens and managing access to specific resources<br>- It fetches JSON Web Keys (JWKs) from a Kubernetes API, caches them, and uses them to verify incoming tokens<br>- Additionally, it checks if a service account has access to a specific bucket, providing an essential layer of security within the application.</td>
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
                        <td>- Routes.ts within the src/constants directory defines the paths for accessing S3 objects and buckets in the application<br>- It plays a crucial role in the project's architecture by providing a centralized location for route management, ensuring consistent and efficient navigation throughout the application.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/headers.ts'>headers.ts</a></b></td>
                        <td>- The 'headers.ts' file in the 'src/constants' directory defines a set of constants representing HTTP headers and query parameters<br>- These constants are primarily used for handling authentication, date, region, and other metadata in Amazon Web Services (AWS) and OpenStack requests, contributing to the secure and efficient communication within the project's architecture.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/errors.ts'>errors.ts</a></b></td>
                        <td>- The 'errors.ts' file in the 'src/constants' directory defines and exports custom HTTP exceptions for the application<br>- These exceptions include 'NoSuchBucketException', 'NotImplementedException', and 'MethodNotAllowedException', which are used to handle specific error scenarios, such as non-existent buckets or unimplemented methods, enhancing the robustness and maintainability of the codebase.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/query-params.ts'>query-params.ts</a></b></td>
                        <td>- The 'query-params.ts' within the 'src/constants' directory defines a set of request parameters for Amazon S3 operations and specifies the XML content type<br>- These constants streamline the interaction with S3 services, ensuring consistent and correct parameter usage across the codebase.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/message.ts'>message.ts</a></b></td>
                        <td>- SAVETASKQUEUE in the src/constants/message.ts serves as a constant identifier for saving task queue operations within the project<br>- It's used across the codebase to standardize the action of storing tasks in the queue, ensuring consistency and reducing potential errors.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/http_status_codes.ts'>http_status_codes.ts</a></b></td>
                        <td>- HTTP_STATUS_CODES in the src/constants directory serves as a centralized repository for HTTP status codes used throughout the application<br>- It enhances readability and maintainability by providing named constants for various status codes, ranging from successful responses like OK to error responses such as INTERNAL_SERVER_ERROR.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/constants/time.ts'>time.ts</a></b></td>
                        <td>- In the context of the entire codebase architecture, src/constants/time.ts establishes a constant for the task queue save operation timeout<br>- Set at 30 seconds, this constant ensures that the task store operation does not exceed this time limit, enhancing the efficiency and performance of the system.</td>
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
                        <td>- The 'src/backends/mod.ts' module in the codebase primarily handles the resolution of incoming requests<br>- It determines the appropriate backend service (either S3 or Swift) based on the bucket configuration and protocol<br>- It also validates bucket access permissions for the service account, ensuring secure and authorized data handling.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/types.ts'>types.ts</a></b></td>
                        <td>- The 'types.ts' file in the 'backends' directory defines types and interfaces for managing data replication tasks between different storage configurations<br>- It facilitates mirroring operations such as object creation, deletion, and copying across S3 and Swift bucket configurations, contributing to the project's data redundancy and backup functionality.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/task_store.ts'>task_store.ts</a></b></td>
                        <td>- TaskStore is a class that manages tasks and their states, synchronizing with both remote (S3) and local (Deno.Kv) storage<br>- It provides methods to serialize and deserialize the task queue and locks, upload and fetch data from S3, and synchronize the local state with the remote storage<br>- It follows a singleton pattern to ensure only one instance is used throughout the application.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/mirror.ts'>mirror.ts</a></b></td>
                        <td>- The 'mirror.ts' module in the codebase is responsible for managing data replication tasks between primary and replica storage systems<br>- It handles tasks such as object creation, deletion, and copying in both S3 and Swift storage backends<br>- The module also maintains a task queue to ensure data consistency across all storage systems.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/tasks.ts'>tasks.ts</a></b></td>
                        <td>- The 'tasks.ts' module in the 'backends' directory manages task handling and worker setup for the project<br>- It creates and assigns workers to different buckets, listens to task queues, and handles task execution<br>- It also manages worker errors and task re-enqueueing when workers are busy.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/worker.ts'>worker.ts</a></b></td>
                        <td>- The worker.ts module, located in the backends directory, is responsible for initializing configurations, setting up loggers, and processing tasks<br>- It communicates with the main thread, receiving tasks, executing them, and sending back completion messages<br>- This module plays a crucial role in the asynchronous task processing mechanism of the project.</td>
                    </tr>
                    </table>
                    <details>
                        <summary><b>s3</b></summary>
                        <blockquote>
                            <table>
                            <tr>
                                <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/s3/mod.ts'>mod.ts</a></b></td>
                                <td>- The 's3Resolver' function in 'src/backends/s3/mod.ts' serves as a central dispatcher for handling S3-related requests<br>- It manages operations such as object retrieval, creation, deletion, and bucket management based on the request method and parameters<br>- It also ensures the validity of the request, throwing HTTP exceptions for unsupported methods or query parameters.</td>
                            </tr>
                            <tr>
                                <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/s3/objects.ts'>objects.ts</a></b></td>
                                <td>- The 'objects.ts' file in the S3 backend module manages object operations in an S3 bucket<br>- It handles requests to get, list, put, delete, copy, and retrieve metadata of objects<br>- The file also supports operations on replicas, providing a failover mechanism<br>- It logs operation outcomes and reports errors to Sentry for monitoring and debugging.</td>
                            </tr>
                            <tr>
                                <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/s3/buckets.ts'>buckets.ts</a></b></td>
                                <td>- The 'buckets.ts' in the S3 backend module manages operations related to S3 buckets, including creation, deletion, routing of requests with query parameters, and checking bucket existence (head bucket)<br>- It also handles error reporting and mirrors operations if the bucket has replicas.</td>
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
                                <td>- The 'swiftResolver' function in the 'src/backends/swift/mod.ts' file serves as a central hub for handling various types of requests related to object and bucket operations in a Swift backend<br>- It manages tasks such as object retrieval, bucket creation, and policy enforcement, among others, thereby playing a crucial role in the project's overall architecture.</td>
                            </tr>
                            <tr>
                                <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/objects.ts'>objects.ts</a></b></td>
                                <td>- The code in 'src/backends/swift/objects.ts' provides functionality for managing objects in a Swift backend<br>- It includes methods for creating, retrieving, deleting, listing, and copying objects, as well as retrieving object metadata<br>- The code also handles error reporting and supports operations on replicas for redundancy.</td>
                            </tr>
                            <tr>
                                <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/buckets.ts'>buckets.ts</a></b></td>
                                <td>- The `buckets.ts` file in the `src/backends/swift` directory is a part of the backend Swift implementation of the project<br>- It primarily handles operations related to Swift buckets, which are storage containers in the OpenStack Swift object storage system<br>- The file imports various utilities, constants, and configurations from other parts of the project to facilitate these operations<br>- It also includes functions for creating a bucket, preparing mirror requests, and handling HTTP exceptions<br>- In the broader context of the project, this file contributes to the overall functionality of the system by enabling interactions with Swift buckets<br>- This is crucial for data storage and retrieval in the application<br>- The file also interacts with the S3 backend, indicating that the project supports multiple storage backends and can switch between or integrate them as needed<br>- This suggests a flexible and extensible architecture.</td>
                            </tr>
                            <tr>
                                <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/auth.ts'>auth.ts</a></b></td>
                                <td>- The 'auth.ts' in the Swift backend handles authentication with the OpenStack server<br>- It fetches an authorization token and storage URL, handling potential errors and multiple choices for the requested resource<br>- It also provides a function to generate request headers for Swift<br>- This is crucial for secure and efficient data storage and retrieval operations.</td>
                            </tr>
                            </table>
                            <details>
                                <summary><b>utils</b></summary>
                                <blockquote>
                                    <table>
                                    <tr>
                                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/backends/swift/utils/mod.ts'>mod.ts</a></b></td>
                                        <td>- The 'mod.ts' in the 'swift/utils' directory of the backend source code primarily transforms Swift's JSON responses into S3's XML format<br>- It also formats dates into RFC3339 standard, extracts common prefixes from folders, and generates S3 objects from Swift objects<br>- This aids in the interoperability between Swift and S3 storage systems.</td>
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
                        <td>- SignalHandlers in the utility directory manages the termination signal for the application<br>- It ensures a graceful shutdown by clearing resources, saving the current state, and syncing the task queue to a remote store<br>- If the task queue fails to sync, it logs the error and forces an application exit.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/mod.ts'>mod.ts</a></b></td>
                        <td>- The 'src/utils/mod.ts' serves as a central hub for utility functions, exporting modules for logging, type definitions, URL, S3, error handling, signing, and cryptography<br>- It also includes a function to check if the code is running within a worker context<br>- This structure enhances code reusability and maintainability across the project.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/signer.ts'>signer.ts</a></b></td>
                        <td>- The 'signer.ts' module in the 'utils' directory is responsible for handling AWS Signature Version 4 signing and verification for S3 requests<br>- It extracts signatures and signed headers from requests, signs requests, verifies signatures, and converts between native and signable request formats<br>- This module plays a crucial role in ensuring secure communication with AWS S3 services.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/s3.ts'>s3.ts</a></b></td>
                        <td>- The 's3.ts' utility module in the 'src/utils' directory provides functionality for interacting with AWS S3 service<br>- It includes methods for creating an S3 client, extracting request information, and determining URL format style<br>- This module plays a crucial role in managing data storage and retrieval in the application.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/http-status.ts'>http-status.ts</a></b></td>
                        <td>- The 'http-status.ts' file in the 'utils' directory defines various HTTP status codes<br>- It categorizes these codes into informational, success, redirect, client error, server error, and unofficial status codes<br>- This categorization aids in the consistent use of HTTP status codes across the project, enhancing readability and maintainability.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/crypto.ts'>crypto.ts</a></b></td>
                        <td>- Utilizing the standard random library, the crypto.ts utility module in the src/utils directory provides functionality for generating random integers within a specified range and creating unique UUIDs<br>- These functions enhance the project's ability to handle randomness and uniqueness, crucial in many computing scenarios.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/url.ts'>url.ts</a></b></td>
                        <td>- The 'url.ts' utility module in the 'src/utils' directory provides functions for URL redirection, request forwarding, and error handling with retries<br>- It also includes utilities for validating and formatting request parameters, checking IP addresses, and serializing/deserializing requests.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/types.ts'>types.ts</a></b></td>
                        <td>- The 'types.ts' file in the 'utils' directory defines and exports various types and schemas using the Zod library<br>- These include HTTP methods, URL format styles, request metadata, and request body types<br>- These types and schemas are integral to the validation and structuring of data across the entire codebase.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/log.ts'>log.ts</a></b></td>
                        <td>- The 'log.ts' module in the 'src/utils' directory manages logging operations for the project<br>- It sets up loggers, retrieves log levels, and fetches logger instances based on provided names and levels<br>- Additionally, it reports exceptions to Sentry for error tracking<br>- This module plays a crucial role in monitoring the application's runtime behavior and troubleshooting issues.</td>
                    </tr>
                    <tr>
                        <td><b><a href='https://github.com/expnt/herald/blob/master/src/utils/error.ts'>error.ts</a></b></td>
                        <td>- The 'error.ts' utility module in the 'src/utils' directory primarily converts JavaScript errors into XML formatted responses<br>- It generates a unique request ID for each error and returns a Response object with the XML error details and appropriate HTTP status code<br>- This module enhances error handling by providing detailed, structured error information.</td>
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
                        <td>- The 'src/workers/mod.ts' module in the project structure is responsible for initializing and registering task handler workers<br>- It leverages utility functions for logging and backend services for task handling<br>- The main purpose is to set up workers that can handle tasks in the application, enhancing its performance and efficiency.</td>
                    </tr>
                    </table>
                </blockquote>
            </details>
        </blockquote>
    </details>
</details>

---
##  Getting Started

###  Prerequisites

Before getting started with herald, ensure your runtime environment meets the following requirements:

- **Programming Language:** TypeScript
- **Container Runtime:** Docker


###  Installation

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

3. Install the project dependencies:


**Using `docker`** &nbsp; [<img align="center" src="https://img.shields.io/badge/Docker-2CA5E0.svg?style={badge_style}&logo=docker&logoColor=white" />](https://www.docker.com/)

```sh
❯ docker build -t expnt/herald .
```




###  Usage
Run herald using the following command:
**Using `docker`** &nbsp; [<img align="center" src="https://img.shields.io/badge/Docker-2CA5E0.svg?style={badge_style}&logo=docker&logoColor=white" />](https://www.docker.com/)

```sh
❯ docker run -it {image_name}
```


###  Testing
Run the test suite using the following command:
echo 'INSERT-TEST-COMMAND-HERE'

---
##  Project Roadmap

- [X] **`Task 1`**: <strike>Implement feature one.</strike>
- [ ] **`Task 2`**: Implement feature two.
- [ ] **`Task 3`**: Implement feature three.

---

##  Contributing

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

##  License

This project is protected under the [SELECT-A-LICENSE](https://choosealicense.com/licenses) License. For more details, refer to the [LICENSE](https://choosealicense.com/licenses/) file.

---

##  Acknowledgments

- List any resources, contributors, inspiration, etc. here.

---
