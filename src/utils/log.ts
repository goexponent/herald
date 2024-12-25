import { LevelName, Logger } from "std/log/mod.ts";
import { basename, dirname, extname } from "std/path/mod.ts";
import * as log from "std/log/mod.ts";
import { ensureDir, exists } from "std/fs/mod.ts";
import { envVarsConfig } from "../config/mod.ts";
import { magenta } from "std/fmt/colors.ts";

const logFilePath = "logs/.log";
const loggers = new Map<string, Logger>();

async function setupLogFile() {
  if (await exists(logFilePath)) {
    await Deno.remove(logFilePath);
  }

  await ensureDir(dirname(logFilePath));
}

const consoleHandler = new log.ConsoleHandler("NOTSET", {
  formatter: (logRecord) => {
    const { datetime, levelName, msg } = logRecord;

    const formattedDate =
      datetime.toISOString().replace("T", " ").split(".")[0];
    let finalMessasge = `${formattedDate} ${levelName} ${msg}`;
    if (logRecord.level === log.LogLevels.DEBUG) {
      finalMessasge = magenta(finalMessasge);
    }
    return finalMessasge;
  },
});

export async function setupLoggers() {
  await setupLogFile();
  log.setup({
    handlers: {
      file: new log.FileHandler("DEBUG", {
        filename: logFilePath,
        formatter: (record) =>
          `${record.datetime} ${record.levelName} ${record.msg}`,
      }),
    },

    loggers: {},
  });
}

export function getLogLevel(): LevelName {
  if (envVarsConfig) {
    return envVarsConfig.log_level ?? "NOTSET";
  }

  return "NOTSET";
}

/**
 * Retrieves a logger instance based on the provided name and level.
 * If the name is an object, it extracts the base name and directory name from the URL and constructs a new name.
 * If a logger instance with the same name does not exist, it creates a new logger with the specified name and level,
 * and adds a console handler to it.
 * If the name is not provided, it retrieves the default logger instance.
 *
 * @param name - The name of the logger or an object containing the URL.
 * @param levelName - The level name for the logger (default: "NOTSET").
 * @returns The logger instance.
 */
export function getLogger(
  name: ImportMeta | string | null = null,
  levelName: LevelName = getLogLevel(),
): Logger {
  if (name && typeof name === "object") {
    const bname = basename(name.url);
    const dname = basename(dirname(name.url));
    name = `${dname}/${bname.replace(extname(bname), "")}`;

    let logger = loggers.get(name);
    if (!logger) {
      logger = new Logger(name, levelName, {
        handlers: [consoleHandler],
      });
      loggers.set(name, logger);
    }
    return logger;
  }

  const logger = log.getLogger(name ?? undefined);
  return logger;
}

export { Logger };
