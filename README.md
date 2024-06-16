<!---
This is the name of the project. It describes the whole project in one sentence, and helps people understand what the main goal and aim of the project is.

Consider putting a CI badge too, for instance:
 [![myworkflow](https://github.com/parcellab/repo-template-base/workflows/myworkflow/badge.svg)](https://github.com/parcellab/repo-template-base/actions?workflow=myworkflow)
-->

[![codecov](https://codecov.parcellab.dev/gh/parcelLab/sift/graph/badge.svg?token=vvbtaY2PL7)](https://codecov.parcellab.dev/gh/parcelLab/sift)

# Sift

Run MongoDB queries in regular javascript.

(fork of https://github.com/crcn/sift.js)

## Table of Contents (Optional)

<!---
If your README is very long, you might want to add a table of contents to make it easy for users to navigate to different sections easily. It will make it easier for readers to move around the project with ease.
-->

## About The Project

### Why fork https://github.com/crcn/sift.js?

The original project uses recursion and closures to construct a filter function based on the given MongoDB query.

- this makes debugging difficult, as you have to trace through deep function calls with little context of what the original filter was
- this makes it slow when V8 has not optimized it, since recursive and closure-heavy function calls make use of many stacks
- this makes it hard to change a behavior without affecting others

This fork intends to rewrite sift to a compiler like [ajv](https://github.com/ajv-validator/ajv).

- it intends to provide a verbose mode where each leaf comparison can provide a pass/fail status, and/or what the comparison function looks like
- it intends to be tiny and fast
- it intends to be safe, where $where function calls are constrained to the input object
- it intends to stick to the same behavior as MongoDB query operators as possible

## Installation

Supports node >= 18

`npm i @parcellab/sift`

<!---If you are working on a project that a user needs to install or run locally in a machine,
you should include the steps required to install your project and also the required dependencies if any.*

Provide a step-by-step description of how to get the development environment set and running.
For instance:

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install foobar.

```bash
pip install foobar
```
-->

## Usage

<!---
Provide instructions and examples so users/contributors can use the project. This will make it easy for them in case they encounter a problem – they will always have a place to reference what is expected.*

*You can also make use of visual aids by including materials like screenshots to show examples of the running project and also the structure and design principles used in your project.

```python
import foobar

# returns 'words'
foobar.pluralize('word')

# returns 'geese'
foobar.pluralize('goose')

# returns 'phenomenon'
foobar.singularize('phenomena')
```
-->

## Contributing

- You need a local copy of MongoDB (e.g. via docker, compose file provided) configured via TEST_MONGODB_URL which defaults to `mongo://localhost:27017/test`

- To update the benchmarks:
  1. run `npm run test:bench` which will update the human readable `output.txt`
  2. run `npm run test:bench:csv`
  3. open `output.xlsx` in Microsoft Excel
  4. click on Refresh Data Sources (this imports `output.csv` automatically)
  5. export the updated chart as `output.png`

[Contribution guidelines](CONTRIBUTING.md)
