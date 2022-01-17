import { exec, ExecException } from "child_process";
import { promisify } from "util";
import axios, { AxiosError, AxiosRequestConfig } from "axios";
import express, { Request, Response, Express } from "express";
import {
  OnEventAction,
  PollSubscription,
  RuntimeConfig,
  Subscription,
  WebhookSubscription,
} from "./config/types";
import { Logger } from "./logger/types";
import { getLogger } from "./logger";
import { processLogs } from "./logger/log-processor";

const asyncExec = promisify(exec);

type BranchResponse = {
  commit: {
    sha: string;
  };
};

type WebhookRequest = {
  action: string;
  sender: string;
  repository: {
    // TODO: add the actual spec from https://docs.github.com/en/rest/reference/repos#get-a-repository if we ever need it
  };
};

// TODO: break up this mega class into a poller and a listener

export class PollerListener {
  private intervals: NodeJS.Timer[];
  private auth: Map<string, string>;
  private currentShaMap: Map<string, string>;
  private logger: Logger;
  private actionLogger: Logger;
  private app?: Express;
  constructor(private config: RuntimeConfig) {
    this.auth = new Map<string, string>();
    this.currentShaMap = new Map<string, string>();
    this.intervals = [];
    config.subscriptions.forEach((subscription) => {
      if (subscription.mode === "polling") {
        const pat = this.getPat(subscription);
        const auth = pat ? `${pat}@` : "";
        this.auth.set(this.getKey(subscription), auth);
      }
    });
    this.logger = getLogger(this.config, "poller");
    this.actionLogger = this.logger.createChild("action");
  }
  private getKey(subscription: Subscription): string {
    return `${subscription.username}:${subscription.repositoryName}:${subscription.branchName}`;
  }
  private getPat(subscription: PollSubscription): string | null {
    if (subscription.personalAccessToken) {
      return subscription.personalAccessToken;
    } else if (subscription.personalAccessTokenEnvVar) {
      return process.env[subscription.personalAccessTokenEnvVar] ?? null;
    }
    return null;
  }
  private getActionName(action: OnEventAction) {
    if (action.name) {
      return action.name;
    } else if (action.actionType === "inline-script") {
      return action.inlineScript;
    } else {
      return action.scriptFilePath;
    }
  }
  private async takeAction(
    action: OnEventAction
  ): Promise<{ stdout: string; stderr: string } | undefined> {
    const { logger } = this;
    const actionName = this.getActionName(action);
    try {
      if (action.actionType === "inline-script") {
        const res = await asyncExec(action.inlineScript, {
          cwd: action.cwd,
        });
        return res;
      } else if (action.actionType === "file-script") {
        const res = await asyncExec(
          `./${action.scriptFilePath} ${(action.scriptArgs ?? []).join(" ")}`,
          {
            cwd: action.cwd,
          }
        );
        return res;
      } else {
        throw new Error(`Unknown action type: ${(action as any).actionType}`);
      }
    } catch (err) {
      const e = err as ExecException;
      logger.error(
        `Failed to execute ${actionName} (code ${e.code}): ${e.name} ${e.message}`
      );
      return undefined;
    }
  }
  private async takeActions(subscription: Subscription) {
    const { actionLogger } = this;
    for await (const action of subscription.onEvent) {
      const actionName = this.getActionName(action);
      actionLogger.info(`Running ${actionName}...`);
      try {
        const resp = await this.takeAction(action);
        if (resp) {
          const { stdout, stderr } = resp;
          const infoLogs = processLogs(stdout);
          const errLogs = processLogs(stderr);
          infoLogs.forEach((infoLog) => infoLog && actionLogger.info(infoLog));
          errLogs.forEach((errLog) => errLog && actionLogger.error(errLog));

          actionLogger.info(`Successfully executed ${actionName}`);
        }
      } catch (err) {
        actionLogger.error(
          `Error while running ${actionName}: ${err.name} ${err.message}`
        );
      }
    }
  }
  private getUrl(subscription: PollSubscription, useAuth: boolean): string {
    const { auth } = this;
    const url = new URL(
      subscription.overrideEndpoint ?? "https://api.github.com"
    );
    return `${url.protocol}//${
      useAuth ? auth.get(this.getKey(subscription)) ?? "" : ""
    }${url.host}/repos/${subscription.username}/${
      subscription.repositoryName
    }/branches/${subscription.branchName}`;
  }
  private getAuthUrl(subscription: PollSubscription) {
    return this.getUrl(subscription, true);
  }
  private getSanitizedUrl(subscription: PollSubscription): string {
    return this.getUrl(subscription, false);
  }
  private getAxiosRequestConfig(
    subscription: PollSubscription
  ): AxiosRequestConfig | undefined {
    if (subscription.extraHeaders) {
      return {
        headers: subscription.extraHeaders,
      };
    }
  }
  private poll = async (subscription: PollSubscription) => {
    const { logger } = this;
    try {
      logger.verbose(`Polling ${this.getSanitizedUrl(subscription)}...`);
      const resp = await axios.get<BranchResponse>(
        this.getAuthUrl(subscription),
        this.getAxiosRequestConfig(subscription)
      );
      const { commit } = resp.data;
      const sha = commit.sha;
      const key = this.getKey(subscription);
      const currentSha = this.currentShaMap.get(key);
      if (sha !== currentSha) {
        this.currentShaMap.set(key, sha);
        // TODO: store SHAs in file
        if (currentSha) {
          logger.info(`New commit SHA detected: ${currentSha} -> ${sha}`);
          await this.takeActions(subscription);
        } else {
          logger.debug(`Initial SHA detected: ${sha}`);
        }
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
          `Error: Branch/repo ${subscription.username}/${subscription.repositoryName}/${subscription.branchName} not found!`
        );
      } else if (e.code === "ECONNREFUSED") {
        logger.error(`Error: ${e.message}`);
      } else {
        logger.error(`Error while polling: ${err}`);
      }
    }
  };
  private getWebhookRequestHandler = (subscription: WebhookSubscription) => {
    const handler = async (
      req: Request<unknown, unknown, WebhookRequest>,
      res: Response
    ) => {
      const { logger } = this;
      logger.info(`Received webhook request: ${req.url}`);
      try {
        if (subscription.actions.includes(req.body.action)) {
          await this.takeActions(subscription);
        }
        res.status(200);
        res.send({ success: true });
      } catch (error) {
        logger.error(
          `Error while receiving webhook request: ${error.name} ${error.message}`
        );
        res.status(500);
        res.send(error);
      }
    };
    return handler;
  };
  async init() {
    const { config, logger } = this;
    for (const subscription of config.subscriptions) {
      if (subscription.mode === "polling") {
        const { pollingIntervalSeconds } = subscription;
        logger.info(
          `Starting polling ${this.getSanitizedUrl(
            subscription
          )} every ${pollingIntervalSeconds} seconds...`
        );
        this.intervals.push(
          setInterval(
            async () => this.poll(subscription),
            pollingIntervalSeconds * 1000
          )
        );
      } else if (subscription.mode === "webhook") {
        if (!this.app) {
          this.app = express();
          this.app.use(express.json());
        }
        logger.info(
          `Configuring subscription to webhook at ${subscription.path}`
        );
        this.app.post(
          subscription.path,
          this.getWebhookRequestHandler(subscription)
        );
      } else {
        throw new Error(
          `Invalid subscription mode: ${(subscription as any).mode}`
        );
      }
    }
    if (this.app) {
      logger.info(
        `Listening for webhook requests at http://localhost:${
          config.webhookPort ?? 80
        }`
      );
      this.app.get("/health", (_req, res) => res.send());
      this.app.listen(config.webhookPort ?? 80);
    }
  }
  async stop() {
    this.logger.info(`Stopping polling...`);
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
  }
}
