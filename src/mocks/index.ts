import crypto from "crypto";
import express from "express";
import axios, { AxiosError } from "axios";
import path from "path";
import { ConsoleLogger } from "../logger/console-logger";
import { LogLevel } from "../logger/types";
import { Configuration } from "../config";

const config = Configuration.getInstance(
  path.resolve("./test-config-file.json")
);

const app = express();

const commits = new Map<string, string>();

const logger = new ConsoleLogger(LogLevel.DEBUG, "text", "github-mock");

app.put(
  "/repos/:username/:reponame/branches/:branchname/:commitId",
  async (req, res) => {
    const { username, reponame, branchname, commitId } = req.params;
    const idx = [username, reponame, branchname].join(":");
    logger.debug(`Got request to set commitId @${idx} to ${commitId}`);
    commits.set(idx, commitId);
    const { subscriptions } = config.runtimeConfig;
    for (const subscription of subscriptions) {
      if (
        subscription.username === username &&
        subscription.repositoryName === reponame &&
        subscription.branchName === branchname &&
        subscription.mode === "webhook"
      ) {
        const { webhookPort } = config.runtimeConfig;
        const url =
          "http://" +
          path.join(`localhost:${webhookPort ?? 80}`, subscription.path);
        const data = {
          action: "push",
          sender: "mock",
          repository: {
            name: reponame,
            owner: {
              login: username,
            },
          },
        };
        const stringData = JSON.stringify(data);
        const secret = subscription.secretEnvVar
          ? process.env[subscription.secretEnvVar]
          : undefined;
        const headers: Record<string, string> = {};
        if (secret) {
          const hash = crypto
            .createHmac("sha256", secret)
            .update(stringData)
            .digest("hex");
          headers["X-Hub-Signature-256"] = hash;
          logger.debug(`Computed hash for webhook request: ${hash}`);
        }
        try {
          await axios.post(url, data, { headers });
        } catch (err) {
          const error = err as AxiosError;
          logger.error(
            `Webhook POST to ${url} failed with status ${error?.response?.status}`
          );
        }
      }
    }

    res.send();
  }
);

app.get("/repos/:username/:reponame/branches/:branchname", (req, res) => {
  const { username, reponame, branchname } = req.params;
  const idx = [username, reponame, branchname].join(":");
  const commitId = commits.get(idx);
  logger.debug(`Got request to get commitId @${idx}; got ${commitId}`);
  if (!commitId) {
    res.status(404);
    res.send();
  } else {
    res.status(200);
    res.send({
      commit: {
        sha: commitId,
      },
    });
  }
});

app.listen(3000);
logger.debug(`Listening at http://localhost:3000`);
