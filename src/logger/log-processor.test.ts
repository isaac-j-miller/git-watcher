import { countInstances, detectJson, processLogs } from "./log-processor";

describe("countInstances", () => {
  it("0", () => {
    const str = "1234d2345";
    expect(countInstances(str, "a")).toEqual(0);
  });
  it("0 - empty string", () => {
    const str = "";
    expect(countInstances(str, "a")).toEqual(0);
  });
  it("2", () => {
    const str = "1234d2345";
    expect(countInstances(str, "3")).toEqual(2);
  });
  it("2 (multi-char)", () => {
    const str = "1234d2345";
    expect(countInstances(str, "234")).toEqual(2);
  });

  it("all", () => {
    const str = "111111";
    expect(countInstances(str, "1")).toEqual(6);
  });
});

describe("detectJson", () => {
  it("no json", () => {
    const str = "sadfoij sadfjo{ asdofij]";
    expect(detectJson(str)).toEqual({
      jsonDetected: false,
    });
  });
  it("pure json", () => {
    const str = JSON.stringify({ test: "foo", baz: [1234, 12] });
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 0,
      endIndex: str.length - 1,
    });
  });
  it("pure json - multiline", () => {
    const str = JSON.stringify({ test: "foo", baz: [1234, 12] }, null, 4);
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 0,
      endIndex: str.length - 1,
    });
  });
  it("contains json - single line", () => {
    const str =
      "blah blah, " + JSON.stringify({ test: "foo", baz: [1234, 12] });
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 11,
      endIndex: str.length - 1,
    });
  });
  it("contains json - multi line", () => {
    const str =
      "blah blah, " + JSON.stringify({ test: "foo", baz: [1234, 12] }, null, 4);
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 11,
      endIndex: str.length - 1,
    });
  });
  it("pure array", () => {
    const str = JSON.stringify([1, 2, 3, 4]);
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 0,
      endIndex: str.length - 1,
    });
  });

  it("pure array with objects", () => {
    const str = JSON.stringify([1, 2, 3, 4, { test: "baz" }]);
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 0,
      endIndex: str.length - 1,
    });
  });
  it("pure array - multiline", () => {
    const str = JSON.stringify([1, 2, 3, 4], null, 4);
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 0,
      endIndex: str.length - 1,
    });
  });
  it("contains array", () => {
    const str = "blah blah, " + JSON.stringify(["as", "wrw"], null, 4);
    expect(detectJson(str)).toEqual({
      jsonDetected: true,
      startIndex: 11,
      endIndex: str.length - 1,
    });
  });
});

describe("processLogs", () => {
  it("normal logs", () => {
    const logs = `whatever output from some program
        doing....
        doing....
        done.`;
    expect(processLogs(logs)).toEqual(logs.split("\n"));
  });
  it("single-line json log", () => {
    const logs = `{"level": 0, "message": "test-message"}
        {"level": 1, "message": "test-message"}`;
    expect(processLogs(logs)).toEqual([
      {
        level: 0,
        message: "test-message",
      },
      {
        level: 1,
        message: "test-message",
      },
    ]);
  });
  it("multi-line JSON", () => {
    const obj = {
      foo: "bar",
      baz: {
        bar: "asdfsd",
      },
      a: [1, 2, 3],
    };
    const logs = JSON.stringify(obj, null, 4);
    const processed = processLogs(logs);
    expect(processed).toEqual([obj]);
  });
  it("mixed json", () => {
    const obj = {
      foo: "bar",
      baz: {
        bar: "asdfsd",
      },
      a: [1, 2, 3],
    };
    const logs = `INFO data ${JSON.stringify(obj)}`;

    expect(processLogs(logs)).toEqual(["INFO data ", obj]);
  });
  it("mixed json - multiline", () => {
    const obj = {
      foo: "bar",
      baz: {
        bar: "asdfsd",
      },
      a: [1, 2, 3],
    };
    const logs = `INFO data ${JSON.stringify(obj, null, 4)}`;
    const processed = processLogs(logs);
    expect(processed).toEqual(["INFO data ", obj]);
  });
});
