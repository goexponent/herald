import { file } from "./dev/deps.ts";

const ghjk = file({
    tasks: {

      "dev-compose": {
    desc: "Wrapper around docker compose to manage runtime dependencies",
    async fn($) {
      const dcs = await Array.fromAsync(
        $.workingDir.join("dev/envs").expandGlob("compose.*.yml", {
          includeDirs: false,
          globstar: true,
        }),
      );
      const files = Object.fromEntries(
        dcs.map((e) => [e.path.basename().split(".")[1], e.path]),
      );

      const on = new Set<string>();
      if ($.argv.length === 1 && $.argv[0] === "all") {
        Object.values(files).forEach((e) => on.add(e.toString()));
      } else {
        for (const arg of $.argv) {
          if (!files[arg]) {
            console.log(
              `Unknown env "${arg}", available: ${
                Object.keys(files).join(
                  ", ",
                )
              } or "all".`,
            );
            Deno.exit(1);
          }
          on.add(files[arg].toString());
        }
      }

      if (on.size > 0) {
        await $.raw`docker compose ${
          [...on].flatMap((file) => [
            "-f",
            file,
          ])
        } up -d --remove-orphans`;
      } else {
        await $.raw`docker compose ${
          Object.values(files).flatMap((file) => [
            "-f",
            file,
          ])
        } down --remove-orphans --volumes`;
      }
    },
  },

    },
  });
export const sophon = ghjk.sophon;
const { env, task } = ghjk;
