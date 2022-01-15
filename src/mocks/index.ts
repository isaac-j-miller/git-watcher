import express from "express";
import { ConsoleLogger } from "../logger/console-logger";
import { LogLevel } from "../logger/types";

const app = express();

const commits = new Map<string, string>();

const logger = new ConsoleLogger(LogLevel.DEBUG, "github-mock");

app.put(
  "/repos/:username/:reponame/branches/:branchname/:commitId",
  (req, res) => {
    const { username, reponame, branchname, commitId } = req.params;
    const idx = [username, reponame, branchname].join(":");
    logger.debug(`Got request to set commitId @${idx} to ${commitId}`);
    commits.set(idx, commitId);
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
