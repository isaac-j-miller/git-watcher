[![CI](https://github.com/isaac-j-miller/lite-ci/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/isaac-j-miller/lite-ci/actions/workflows/ci.yaml)
[![CodeQL](https://github.com/isaac-j-miller/lite-ci/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/isaac-j-miller/lite-ci/actions/workflows/codeql-analysis.yml)
[![Publish](https://github.com/isaac-j-miller/lite-ci/actions/workflows/publish.yaml/badge.svg?branch=main)](https://github.com/isaac-j-miller/lite-ci/actions/workflows/publish.yaml)
![npm](https://img.shields.io/npm/v/lite-ci)

# lite-ci

super lightweight CI tool

# Introduction

I have a project (https://github.com/isaac-j-miller/mirror-v2) which I deploy to a raspberry pi in my home. I don't want to SSH into the raspberry pi and update or restart the project every time I update the application, and I don't want to stand up a whole CI server on the it because it's a raspberry pi zero w, and it doesn't have a lot of resources. So I wrote this simple miniature CI tool to listen for github webhooks and/or poll GitHub's API to check for new commits on a specified branch, if it isn't possible or desirable to set up NGINX, port forwarding, a static IP, security, etc.

# Installation

There are two ways to install this project. You can either install the NPM package and use the executable, or you can clone the git repo and build it yourself.

This project requires Nodejs (verified with 14.x, 15.x, and 16.x) and npm, so make sure you have Node and npm installed before proceeding.

## NPM installation

To install using NPM (or equivalent) run `npm install lite-ci`

## Git installation

To install by cloning the git repo, clone the repo (`git clone https://github.com/isaac-j-miller/lite-ci`). Then install the dependencies with `npm install`. Finally, build the project with `npm run build`.

# Usage

After installing using the instructions in the previous section, the usage of this project is fairly straightforward. You will need to write a config file (see `test-config-file.json` for an example) according to the schema in `schema/RuntimeConfig.json`. When you run the program, it will validate the runtime configuration and error out if it is invalid.
Once you've written your config file, you can start up the mini CI server using `npx lite-ci {config file path}` if you opted to install using npm, or `./lite-ci {config file path}` if you opted to install by cloning the git repo. You can add the `--verbose` flag to enable verbose logging, overriding the loglevel specified in your config file.

# Configuration

## Subscriptions

The most important part of the configuration is the `subscriptions` node. This is an array of `Subscription` objects.
A `Subscription` object specifies how to watch for new commits and what to do in the event of a new commit.
There are a few options common to both subscription types:

- `mode`: the subscription mode (`polling|webhook`)
- `onEvent`: actions to take when a new commit is detected (more details in the `OnEventAction` section)
- `username`: the repository owner's username
- `repositoryName`: the name of the repository
- `branchName`: the name of the branch to monitor

There are two modes:

### Polling

The simplest (and least efficient, but most straightforward) mode is Polling Mode. This is intended to be used in situations when it is not possible to set up a public IP for a webhook to attach to. This mode sends HTTP requests to GitHub's API at the interval specified in `Subscription.pollingIntervalSeconds`, stores the commit SHA for the specified branch, and if the received SHA does not match the stored SHA, it runs the actions specified in `Subscription.onEvent`. There are a few configurable options for Polling subscriptions:

- `pollingIntervalSeconds`: how often (in seconds) to poll the GitHub API for a new commit
- `overrideEndpoint`: Optional. Only used for testing. Can be used to specify an alternative endpoint to poll.
- `extraHeaders`: Optional. Map of headers to add to HTTP requests to GitHub API
- `personalAccessTokenEnvVar`: Optional. Name of environment variable which contains your personal access token, if polling a private repository
- `personalAccessToken`: Optional. Personal access token to use, if polling a private repository

### Webhook

You may also configure a webhook listener by using `webhook` mode. This will cause the app to stand up an express server which listens on a configured port and path for webhook requests. You must first set up the webhook via GitHub (IMPORTANT: you must select application/json as the content type) and ensure that your server has a public IP. There are a few configurable options for webhook subscriptions:

- `path`: webhook request path. It can be whatever you want, as long as it is a valid URL path. It must match the path configured when setting up the webhook in GitHub. Example: `/repos/repo-name/webhook`.
- `actions`: List of actions which trigger running the commands specified in `onEvent`. To enable actions for pushes, set `actions` to `["push"]`.

The original intention for this project was to run actions on pushes, but by specifying the `actions` field, you can configure it to run scripts for other actions as well.

### OnCommitAction

This is the `Subscription.onEvent` field. There are two types of actions: `inline-script` and `file-script`. The following options are common to both of them:

- `cwd`: Optional. directory to run the command in
- `name`: Optional. name of the action
- `actionType`: `inline-script` or `file-script`

#### inline-script

Inline scripts have one additional field:

- `inlineScript`: the command to run. Example: `echo "Hello World!"`

#### file-script

File scripts have two additional fields:

- `scriptFilePath`: the path to the script.
- `scriptArgs`: Optional. An array of args to pass to the script. Example: `["--arg", "value"]`

## LoggingConfig

There are a few options for configuring logging. This app can log to a file and/or to the console. Logs can be formatted as easily-readable text, or as JSON. The root-level options are:

- `level`: Optional (defaults to 2 (info)). LogLevel. Can be any of the following:
  - 0 (verbose)
  - 1 (debug)
  - 2 (info)
  - 3 (warn)
  - 4 (error)
  - 5 (fatal)
- `format`: Optional (defaults to `text`). the log format. Can be `json` or `text`.
  These two options set the defaults. You can specify different levels and formats for file logging and console logging as well.

### file

Options specific to file logging can be specified here:

- `path`: the path of the file to log to
- `level`: Optional (defaults to root-level `level`). file logging-specific level. Same as root-level `level`
- `format`: Optional (defaults to root-level `level`). file logging-specific format. Same as root-level `format`. If `json` is selected, each line of the logfile will be a JSON object.

To disable file logging, do not specify the `file` property.

### console

Options specific to console logging can be specified here:

- `level`: Optional (defaults to root-level `level`). console logging-specific level. Same as root-level `level`
- `format`: Optional (defaults to root-level `level`). console logging-specific format. Same as root-level `format`

For example, to configure logging so that logs to file are JSON-formatted with loglevel WARN, and logs to the console are text-formatted with loglevel VERBOSE, use this configuration:

```json
{
  "file": {
    "path": "logfile-path.log",
    "level": 3,
    "format": "json"
  },
  "console": {
    "level": 0,
    "format": "text"
  }
}
```

## Other root-level properties

- `webhookPort`: Optional (defaults to 80). The port for the webhook listener to listen on.

# Quick Start Guide

To get started, install the project using `npm install lite-ci`. Then, set up a config file in a directory of your choice. The actions defined are just examples, so replace them with whatever is appropriate for your setup.
Template 1 (polling subscription):

```json
{
  "subscriptions": [
    {
      "username": "your-username",
      "repositoryName": "repository-name",
      "branchName": "main",
      "mode": "polling",
      "pollingIntervalSeconds": 10,
      "onEvent": [
          {
          "cwd": "~/your-project-dir",
          "actionType": "file-script",
          "scriptFilePath": "./stop-project",
          "scriptArgs": ["--arg1", "arg2"],
          "name": "stop-project-with-script"
        }
        {
          "cwd": "~/your-project-dir",
          "actionType": "inline-script",
          "inlineScript": "git pull",
          "name": "pull-from-git"
        },
        {
          "cwd": "~/your-project-dir",
          "actionType": "file-script",
          "scriptFilePath": "./build-project",
          "scriptArgs": ["--arg1", "arg2"],
          "name": "build-project-with-script"
        }
      ]
    }
  ],
  "logging": {
    "console": {
      "format": "text",
      "level": 0
    }
  }
}
```

Template 2 (webhook subscription):

```json
{
  "subscriptions": [
    {
      "username": "your-username",
      "repositoryName": "repository-name",
      "branchName": "main",
      "path": "/webhooks/repository-name",
      "mode": "webhook",
      "onEvent": [
          {
          "cwd": "~/your-project-dir",
          "actionType": "file-script",
          "scriptFilePath": "./stop-project",
          "scriptArgs": ["--arg1", "arg2"],
          "name": "stop-project-with-script"
        }
        {
          "cwd": "~/your-project-dir",
          "actionType": "inline-script",
          "inlineScript": "git pull",
          "name": "pull-from-git"
        },
        {
          "cwd": "~/your-project-dir",
          "actionType": "file-script",
          "scriptFilePath": "./build-project",
          "scriptArgs": ["--arg1", "arg2"],
          "name": "build-project-with-script"
        }
      ]
    }
  ],
  "webhookPort": 8000,
  "logging": {
    "console": {
      "format": "text",
      "level": 0
    }
  }
}
```

Let's say for the webhook configuration, your server's public IP is 123.123.123.123 and you have NGINX mapping port 8000 to port 80. So you would configure your GitHub webhook to send requests to http://123.123.123.123:80/webhooks/repository-name. IMPORTANT: you must select application/json as the content type.

After setting up the config file, just modify your startup config on your server to run `npx lite-ci {config-file-path}` on startup!

# Contribute

To contribute, please raise an issue on the github page and/or make a pull request.

## Build/test

If you are interesting in contributing to this project, the following NPM scripts are used:

- `test`: run jest tests
- `test-inspect`: run jest tests and open a debugger on port 9229
- `start-dev`: run app with test config file, watching for changes with nodemon
- `start-inspect`: run app with test config file, watching for changes with nodemon and opening a debugger on port 9229
- `start-mock`: run the mock github server to simulate push events. It is EXTREMELY barebones. Run this alongside the main program
- `prettier`: format all files
- `prettier-check`: ensure that all files match prettier format
- `lint`: run lint check
- `build`: build the project
- `generate-schema`: generate schema for RuntimeConfig
