import { LogFormat, LogLevel } from "../logger/types";

type OnCommitActionType = "inline-script" | "file-script";

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

export type RuntimeConfig = {
  username: string;
  repoName: string;
  branchName: string;
  pollingIntervalSeconds: number;
  onNewCommit: OnCommitAction[];
  extraHeaders?: Record<string, string>;
  personalAccessTokenEnvVar?: string;
  personalAccessToken?: string;
  overrideEndpoint?: string;
  logFilePath?: string;
  logFormat?: LogFormat;
  logLevel?: LogLevel;
};
