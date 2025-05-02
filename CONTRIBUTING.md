# Contributing to ts-to-proptypes

First off, thank you for considering contributing to ts-to-proptypes! It's people like you that make this tool better for everyone. This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to the project maintainers.

We are committed to providing a welcoming and inclusive environment for everyone, regardless of gender, sexual orientation, ability, ethnicity, socioeconomic status, and religion (or lack thereof).

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate in a professional setting

## Getting Started

### Development Environment

1. Fork the repository on GitHub
2. Clone your fork to your local machine
3. Install dependencies with `npm install`
4. Create a branch for your changes

### Development Workflow

1. Make your changes in your feature branch
2. Add or update tests as necessary
3. Ensure your code passes all tests with `npm test`
4. Ensure your code follows our style guidelines
5. Submit a pull request from your branch to our `main` branch

## Coding Standards

### Style Guide

This project follows the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) for JavaScript and TypeScript code. Please ensure your contributions adhere to this style guide.

Additionally:

- We use 4-space indentation (as specified in our .editorconfig and prettier config)
- Single quotes for strings
- No trailing commas
- No bracket spacing in object literals
- Semi-colons are required

Our ESLint and Prettier configurations enforce these rules. Before submitting a pull request, make sure your code passes our linting with:

```bash
npm run format
```

### Code Quality

- Write clean, readable, and maintainable code
- Add meaningful comments where necessary, but prefer self-documenting code
- Follow TypeScript best practices
- Keep functions small and focused on a single responsibility
- Use descriptive variable and function names

### Testing

All new features or bug fixes should include appropriate tests:

- Unit tests for individual functions and components
- Integration tests for more complex interactions

Run tests with:

```bash
npm test
```

For continuous testing during development:

```bash
npm run test:watch
```

## Pull Request Process

1. Update the README.md and other documentation with details of your changes if appropriate
2. Add or update tests for your changes
3. Ensure the test suite passes and your code lints without errors
4. Submit your pull request with a clear title and description
5. Include any relevant issue numbers in your PR description

### PR Title and Description

- Use a clear, descriptive title for your PR
- In the description, explain the changes you've made and why
- Reference any related issues using GitHub's syntax: "Fixes #123" or "Relates to #456"

### Review Process

- A maintainer will review your PR
- The review process may involve some discussion and requests for changes
- Once approved, your PR will be merged

## Issue Reporting

### Bug Reports

When filing a bug report, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information (OS, browser, Node.js version, etc.)

### Feature Requests

When suggesting a feature:

- Clearly describe the feature and its value
- Provide examples of how it would be used
- Consider whether it aligns with the project's goals

## Community

Join our community! Feel free to:

- Ask questions if you're unsure about something
- Help others with their issues and PRs
- Share your experiences using the library
- Suggest improvements

We value respectful communication and constructive feedback.

## Recognition

Contributors are recognized in our README.md. We appreciate all contributions, no matter how small!

---

Thank you for contributing to ts-to-proptypes! Your efforts help make this project better for everyone.
