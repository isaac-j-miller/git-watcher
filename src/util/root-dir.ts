import fs from "fs";
import path from "path";
import { once } from "./function";

function getParent(dirPath: string): string {
  const hasPackageJson = fs.existsSync(path.join(dirPath, "package.json"));
  if (hasPackageJson) {
    return dirPath;
  } else {
    return getParent(path.dirname(dirPath));
  }
}

export const getRootDir = once((): string => {
  const dirName = __dirname;
  return getParent(dirName);
});
