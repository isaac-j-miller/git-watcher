import sinon from "sinon";
import { once } from "./function";

describe("once", () => {
  it("only calls once", () => {
    const fn = sinon.stub();
    const wrapped = once(fn);
    wrapped();
    wrapped();
    wrapped();
    wrapped();
    expect(fn.getCalls().length).toEqual(1);
  });
  it("returns correct result", () => {
    const fn = () => {
      return "test-result";
    };
    const wrapped = once(fn);
    expect(wrapped()).toEqual("test-result");
  });
});
