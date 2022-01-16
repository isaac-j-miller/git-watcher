import path from "path";
import fs from "fs";
import Ajv from "ajv";

import { Logger } from "../logger/types";
import { getRootDir } from "../util/root-dir";

export class SchemaValidator<T> {
  private schema: object;

  constructor(private logger: Logger, private className: string) {
    const schemaPath = path.join(getRootDir(), "schema", `${className}.json`);
    logger.verbose(`Loading schema from ${path.resolve(schemaPath)}`);
    try {
      const schemaString = fs.readFileSync(schemaPath, "utf8");
      this.schema = JSON.parse(schemaString);
    } catch (err) {
      logger.error(`Error while loading schema: ${err.message}`);
      throw err;
    }
  }
  validate(obj: T): boolean {
    const { logger, schema, className } = this;
    const ajv = new Ajv();
    const validate = ajv.compile(schema);
    const valid = validate(obj);
    if (!valid) {
      logger.error(`Schema validation failed for ${className}`);
      validate.errors.forEach((err) => {
        logger.error(err);
      });
    }
    return !!valid;
  }
}
