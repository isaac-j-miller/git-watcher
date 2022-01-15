export function countInstances(str: string, item: string): number {
  let count = 0;
  let newStr = str;
  while (newStr.length) {
    const startIndex = newStr.indexOf(item);
    if (startIndex > -1) {
      const newIndex = startIndex + item.length;
      newStr = newStr.slice(newIndex);
    } else {
      return count;
    }
  }
  return count;
}

function tryParse(str: string): object | Array<any> | string[] {
  try {
    return JSON.parse(str);
  } catch (e) {
    return str.split("\n");
  }
}

export function processLogs(rawLog: string): any[] {
  const outputLines: any[] = [];

  const lines = rawLog.split("\n");
  let currentString = "";
  let leftBracketCount = 0;
  let rightBracketCount = 0;
  let leftBraceCount = 0;
  let rightBraceCount = 0;
  for (const line of lines) {
    if (line.match(/\{|\}|\[|\]/g)) {
      const leftBrackets = countInstances(line, "{");
      const rightBrackets = countInstances(line, "}");
      const leftBraces = countInstances(line, "[");
      const rightBraces = countInstances(line, "]");
      const bracketSum =
        leftBracketCount + leftBrackets - (rightBracketCount + rightBrackets);
      const braceSum =
        leftBraceCount + leftBraces - (rightBraceCount + rightBraces);
      if (bracketSum || braceSum) {
        currentString += line + "\n";
      } else {
        if (currentString) {
          const output = tryParse(currentString);
          if (Array.isArray(output) && typeof output[0] === "string") {
            outputLines.push(...output);
          } else {
            outputLines.push(output);
          }
          currentString = "";
        } else if (leftBrackets || leftBraces || rightBrackets || rightBraces) {
          const output = tryParse(line);
          if (Array.isArray(output) && typeof output[0] === "string") {
            outputLines.push(...output);
          } else {
            outputLines.push(output);
          }
        } else {
          outputLines.push(line);
        }
      }
    } else {
      outputLines.push(line);
    }
  }
  if (currentString) {
    outputLines.push(...currentString.split("\n"));
  }
  return outputLines;
}
