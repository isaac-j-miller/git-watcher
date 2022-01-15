import { LogFormat, LogLevel } from "logger/types";

type OnCommitActionType = "inline-script" | "file-script";

export type OnCommitAction = {
  cwd: string;
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
  personalAccessTokenEnvVar?: string;
  personalAccessToken?: string;
  username: string;
  repoName: string;
  branchName: string;
  pollingIntervalSeconds: number;
  extraHeaders: Record<string, string>;
  onNewCommit: OnCommitAction[];
  logFilePath?: string;
  logFormat?: LogFormat;
  logLevel?: LogLevel;
};
