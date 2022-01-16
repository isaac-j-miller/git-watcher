import { formatJson, formatText } from "./formatters";
import { LogLevel } from "./types";

describe("formatJson", () => {
  const timestamp = new Date("2022-01-01");
  const level = LogLevel.DEBUG;
  const source = "jest";
  it("string", () => {
    const json = formatJson("test message", level, source, timestamp);
    expect(json).toEqual(
      JSON.stringify({
        timestamp: timestamp.toISOString(),
        level,
        source,
        message: "test message",
      })
    );
  });
  it("number", () => {
    const json = formatJson(1, level, source, timestamp);
    expect(json).toEqual(
      JSON.stringify({
        timestamp: timestamp.toISOString(),
        level,
        source,
        message: "1",
      })
    );
  });
  it("boolean", () => {
    const json = formatJson(true, level, source, timestamp);
    expect(json).toEqual(
      JSON.stringify({
        timestamp: timestamp.toISOString(),
        level,
        source,
        message: "true",
      })
    );
  });
  it("object", () => {
    const obj = { foo: "bar", arr: [1, 2, 3] };
    const json = formatJson(obj, level, source, timestamp);
    expect(json).toEqual(
      JSON.stringify({
        timestamp: timestamp.toISOString(),
        level,
        source,
        message: JSON.stringify(obj),
      })
    );
  });
  it("array", () => {
    const arr = [1, 2, 3];
    const json = formatJson(arr, level, source, timestamp);
    expect(json).toEqual(
      JSON.stringify({
        timestamp: timestamp.toISOString(),
        level,
        source,
        message: JSON.stringify(arr),
      })
    );
  });
});

describe("formatText", () => {
  const timestamp = new Date("2022-01-01");
  const level = LogLevel.DEBUG;
  const source = "jest";
  const prefix = `[${LogLevel[
    level
  ].toUpperCase()}]\t${timestamp.toISOString()}\t[${source}]\t`;
  it("string", () => {
    const text = formatText("test message", level, source, timestamp);
    expect(text).toEqual(prefix + "test message");
  });
  it("number", () => {
    const text = formatText(1, level, source, timestamp);
    expect(text).toEqual(prefix + "1");
  });
  it("boolean", () => {
    const text = formatText(true, level, source, timestamp);
    expect(text).toEqual(prefix + "true");
  });
  it("object", () => {
    const obj = { foo: "bar", arr: [1, 2, 3] };
    const text = formatText(obj, level, source, timestamp);
    expect(text).toEqual(prefix + JSON.stringify(obj));
  });
  it("array", () => {
    const arr = [1, 2, 3];
    const text = formatText(arr, level, source, timestamp);
    expect(text).toEqual(prefix + JSON.stringify(arr));
  });
});
