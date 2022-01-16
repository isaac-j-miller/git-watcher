export function countInstances(str: string, item: string): number {
  let count = 0;
  let newStr = str;
  while (newStr.length) {
    const startIndex = newStr.indexOf(item);
    if (startIndex > -1) {
      const newIndex = startIndex + item.length;
      newStr = newStr.slice(newIndex);
      count++;
    } else {
      return count;
    }
  }
  return count;
}

function parseJsonIfJson(str: string): undefined | object {
  try {
    return JSON.parse(str);
  } catch (e) {
    return undefined;
  }
}

type MaybeJsonResponse = {
  jsonDetected: boolean;
} & (
  | {
      jsonDetected: true;
      startIndex: number;
      endIndex: number;
    }
  | {
      jsonDetected: false;
    }
);
export function detectJson(str: string): MaybeJsonResponse {
  const leftBracketCount = countInstances(str, "{");
  const rightBracketCount = countInstances(str, "}");
  const leftBraceCount = countInstances(str, "[");
  const rightBraceCount = countInstances(str, "]");
  const hasBalancedBrackets =
    leftBracketCount &&
    rightBracketCount &&
    leftBracketCount === rightBracketCount;
  const hasBalancedBraces =
    leftBraceCount && rightBraceCount && leftBraceCount === rightBraceCount;
  const unbalanced =
    leftBracketCount !== rightBracketCount ||
    leftBraceCount !== rightBraceCount;
  if (unbalanced || (!hasBalancedBraces && !hasBalancedBrackets)) {
    return { jsonDetected: false };
  }
  let startIndex = -1;
  let endIndex = -1;

  if (hasBalancedBrackets) {
    startIndex = str.indexOf("{");
    endIndex = str.lastIndexOf("}");
  }
  if (hasBalancedBraces) {
    const braceStartIndex = str.indexOf("[");
    if (startIndex === -1 || braceStartIndex < startIndex) {
      const braceEndIndex = str.lastIndexOf("]");
      if (endIndex === -1 || braceEndIndex > endIndex) {
        startIndex = braceStartIndex;
        endIndex = braceEndIndex;
      }
    }
  }
  return {
    jsonDetected: true,
    startIndex,
    endIndex,
  };
}

export function processLogs(rawLog: string): any[] {
  const outputLines: any[] = [];
  const lines = rawLog.split("\n");
  let currentGroup = "";
  for (let i = 0; i < lines.length; i++) {
    currentGroup += lines[i] + "\n";
    // TODO: maybe also try to detect XML/table/etc formats?
    const hasJson = detectJson(currentGroup);
    if (hasJson.jsonDetected) {
      const { startIndex, endIndex } = hasJson;
      const jsonPart = currentGroup.slice(startIndex, endIndex + 1);
      const parsed = parseJsonIfJson(jsonPart);
      const currentParts: any[] = [];
      if (parsed) {
        if (startIndex !== 0) {
          const firstPart = currentGroup.slice(0, startIndex);
          currentParts.push(firstPart);
        }
        currentParts.push(parsed);
        if (endIndex !== currentGroup.length - 1) {
          const lastPart = currentGroup.slice(endIndex + 1);
          currentParts.push(lastPart);
        }
        currentGroup = "";
        outputLines.push(...currentParts);
      } else if (i === lines.length - 1) {
        outputLines.push(...currentGroup.split("\n"));
      }
    } else if (i === lines.length - 1) {
      outputLines.push(...currentGroup.split("\n"));
    }
  }
  const filteredOutputLines = outputLines.filter((line) => {
    if (typeof line !== "string") {
      return true;
    }
    return !!line.trim();
  });
  return filteredOutputLines;
}
