import { LogFormat, LogLevel } from "../logger/types";

export type OnCommitActionType = "inline-script" | "file-script";

export type SubscriptionMode = "polling" | "webhook";

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
  repositoryName: string;
  branchName: string;
} & (
  | {
      mode: "polling";
      pollingIntervalSeconds: number;
      overrideEndpoint?: string;
      extraHeaders?: Record<string, string>;
      personalAccessTokenEnvVar?: string;
      personalAccessToken?: string;
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
export type LoggingConfig = {
  level?: LogLevel;
  format?: LogFormat;
  file?: {
    path: string;
    level?: LogLevel;
    format?: LogFormat;
  };
  console?: {
    level?: LogLevel;
    format?: LogFormat;
  };
};

export type RuntimeConfig = {
  $schema?: string;
  subscriptions: Subscription[];
  logging?: LoggingConfig;
  webhookPort?: number;
};
