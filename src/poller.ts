import { exec, ExecException } from "child_process";
import { promisify } from "util";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { OnCommitAction, RuntimeConfig } from "./config/types";
import { Logger } from "./logger/types";
import { getLogger } from "./logger";
import { processLogs } from "./logger/log-processor";

const asyncExec = promisify(exec);

type BranchResponse = {
  commit: {
    sha: string;
  };
};

export class Poller {
  private interval: NodeJS.Timer;
  private auth: string;
  private currentSha: string;
  private logger: Logger;
  private actionLogger: Logger;
  constructor(private config: RuntimeConfig) {
    const pat = this.getPat();
    this.auth = pat ? `${pat}@` : "";
    this.logger = getLogger(this.config, "poller");
    this.actionLogger = this.logger.createChild("action");
  }
  private getPat(): string | null {
    const { config } = this;
    if (config.personalAccessToken) {
      return config.personalAccessToken;
    } else if (config.personalAccessTokenEnvVar) {
      return process.env[config.personalAccessTokenEnvVar] ?? null;
    }
    return null;
  }
  private getActionName(action: OnCommitAction) {
    if (action.name) {
      return action.name;
    } else if (action.actionType === "inline-script") {
      return action.inlineScript;
    } else {
      return action.scriptFilePath;
    }
  }
  private async takeAction(
    action: OnCommitAction
  ): Promise<{ stdout: string; stderr: string } | undefined> {
    const { logger } = this;
    logger.info(`Running ${this.getActionName(action)}...`);
    try {
      if (action.actionType === "inline-script") {
        return asyncExec(action.inlineScript, {
          cwd: action.cwd,
        });
      } else if (action.actionType === "file-script") {
        return asyncExec(
          `${action.scriptFilePath} ${(action.scriptArgs ?? []).join(" ")}`,
          {
            cwd: action.cwd,
          }
        );
      } else {
        throw new Error(`Unknown action type: ${(action as any).actionType}`);
      }
    } catch (err) {
      const e = err as ExecException;
      logger.error(
        `Failed to execute ${this.getActionName(action)} (code ${e.code}): ${
          e.name
        } ${e.message}`
      );
      return undefined;
    }
  }
  private async takeActions() {
    const { actionLogger } = this;
    for await (const action of this.config.onNewCommit) {
      const resp = await this.takeAction(action);
      if (resp) {
        const { stdout, stderr } = resp;
        const infoLogs = processLogs(stdout);
        const errLogs = processLogs(stderr);
        infoLogs.forEach((infoLog) => infoLog && actionLogger.info(infoLog));
        errLogs.forEach((errLog) => errLog && actionLogger.error(errLog));
      }
    }
  }
  private getUrl(useAuth: boolean): string {
    const { config, auth } = this;
    const url = new URL(config.overrideEndpoint ?? "https://api.github.com");
    return `${url.protocol}//${useAuth ? auth : ""}${url.host}/repos/${
      config.username
    }/${config.repoName}/branches/${config.branchName}`;
  }
  private getAuthUrl() {
    return this.getUrl(true);
  }
  private getSanitizedUrl(): string {
    return this.getUrl(false);
  }
  private getAxiosRequestConfig(): AxiosRequestConfig | undefined {
    const { config } = this;
    if (config.extraHeaders) {
      return {
        headers: config.extraHeaders,
      };
    }
  }
  private poll = async () => {
    const { logger, config } = this;
    try {
      logger.verbose(`Polling ${this.getSanitizedUrl()}...`);
      const resp = await axios.get<BranchResponse>(
        this.getAuthUrl(),
        this.getAxiosRequestConfig()
      );
      const { commit } = resp.data;
      const sha = commit.sha;
      if (sha !== this.currentSha) {
        logger.info(`New commit SHA detected: ${this.currentSha} -> ${sha}`);
        this.currentSha = sha;
        await this.takeActions();
      }
    } catch (err) {
      const e = err as AxiosError;
      if (!e.isAxiosError) {
        logger.fatal(`Code error while processing github API response: ${e}`);
        return;
      }
      if (e.response?.status === 403 || e.response?.status === 401) {
        logger.fatal(`Error: Invalid credentials when polling github API`);
      } else if (e.response?.status === 404) {
        logger.error(
          `Error: Branch/repo ${config.username}/${config.repoName}/${config.branchName} not found!`
        );
      } else if (e.code === "ECONNREFUSED") {
        logger.error(`Error: ${e.message}`);
      } else {
        logger.error(`Error while polling: ${err}`);
      }
    }
  };

  async init() {
    const { config, logger } = this;
    logger.info(
      `Starting polling ${this.getSanitizedUrl()} every ${
        config.pollingIntervalSeconds
      } seconds...`
    );
    this.interval = setInterval(
      this.poll,
      config.pollingIntervalSeconds * 1000
    );
  }
  async stop() {
    this.logger.info(`Stopping polling...`);
    clearInterval(this.interval);
  }
}