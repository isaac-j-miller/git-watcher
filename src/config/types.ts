import { LogFormat, LogLevel } from "../logger/types";

type OnCommitActionType = "inline-script" | "file-script";

type SubscriptionMode = "polling" | "webhook";

export type OnCommitAction = {
  cwd?: string;
  actionType: OnCommitActionType;
  name?: string;
} & (
  | {
      inlineScript: string;
      actionType: "inline-script";
    }
  | {
      actionType: "file-script";
      scriptFilePath: string;
      scriptArgs?: string[];
    }
);

export type Subscription = {
  mode: SubscriptionMode;
  onNewCommit: OnCommitAction[];
  username: string;
  repoName: string;
  branchName: string;
  extraHeaders?: Record<string, string>;
  personalAccessTokenEnvVar?: string;
  personalAccessToken?: string;
} & (
  | {
      mode: "polling";
      pollingIntervalSeconds: number;
      overrideEndpoint?: string;
    }
  | {
      mode: "webhook";
      path: string;
      actions: string[];
    }
);
export type PollSubscription = Subscription & {
  mode: "polling";
};
export type WebhookSubscription = Subscription & {
  mode: "webhook";
};

export type RuntimeConfig = {
  subscriptions: Subscription[];
  logFilePath?: string;
  logFormat?: LogFormat;
  logLevel?: LogLevel;
  webhookPort?: number;
};
