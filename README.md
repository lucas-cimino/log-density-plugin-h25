# log-density-plugin

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-online-brightgreen)](/docs)

## Table of Contents

- [log-density-plugin](#log-density-plugin)
  - [Table of Contents](#table-of-contents)
  - [About](#about)
  - [Features](#features)
  - [Documentation](#documentation)
  - [Contributing](#contributing)
  - [License](#license)
  - [Quick Links](#quick-links)

## About

This project is about a Visual Studio Code extension that groups functionalities about logging method in Java Project. It uses a AI model trained on open-source Java projects to predict and check the log density of `.java` files and projects, helping developers understand and optimize their logging practices. It also offers the possibility to generate log advices with a large language model at line in code, for the function / method in which you are. Basics functionalities are:

- Model Training
- Log Density Analysis
- Generate Log Advice

For more details, see the [documentation](./docs/README.md).

## Features

- **Model Training**: Train the AI model using a collection of open-source Java projects.
- **Log Density Analysis**: Analyze individual Java files to determine the log density in each block of code.
- **Batch Log Density Prediction**: Obtain predicted and current log densities for multiple Java files at once.

- **Generate Log Advice**: Generate log advices with a large language model at line in code, for the function / method in which you are.
- **Get Model Info**: Get current configured model.
- **Change Model ID**: Change the configured model and download if not available locally by givving a valid model ID.
- **Change Token**: Change and set a new token (Only used for HuggingFace).

## Documentation

The full documentation, including installation and usage instructions, can be found in the [`/docs`](./docs/README.md) directory. Key sections:

- [Installation Guide](./docs/INSTALLATION.md)
- [Usage Instructions](./docs/USAGE.md)

## Contributing

Contributions are welcome! To get started:

1. Read the [Contributing Guide](./docs/CONTRIBUTING.md).
2. Check the open issues or suggest new features.

## License

This project is licensed under the [GNU General Public License v3.0](COPYING).

## Quick Links

- [Official Documentation](./docs/README.md)
- [Report Issues](https://github.com/username/repo/issues)
