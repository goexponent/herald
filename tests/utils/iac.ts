import { shell } from "./shell.ts";
import { assertSnapshot } from "std/testing/snapshot.ts";

export async function testTerraform(
  path: string,
  t: Deno.TestContext,
): Promise<void> {
  await terraformCleanup(path);

  const initCommand = [
    "tofu",
    "init",
  ];

  let { stdout: _, stderr, code } = await shell(initCommand, {
    currentDir: path,
  });
  if (code !== 0) {
    throw new Error(
      `Failed to execute tofu init: ${Deno.inspect(stderr)}`,
    );
  }

  const planCommand = [
    "tofu",
    "plan",
  ];
  const { stdout: planOutput, stderr: planStderr, code: planCode } =
    await shell(planCommand, {
      currentDir: path,
    });
  if (planCode !== 0) {
    throw new Error(
      `Failed to execute tofu plan: ${Deno.inspect(planStderr)}`,
    );
  }

  // Assert snapshot for plan output
  await assertSnapshot(t, planOutput);

  const applyCommand = [
    "tofu",
    "apply",
    "-auto-approve",
  ];

  ({ stdout: _, stderr, code } = await shell(applyCommand, {
    currentDir: path,
  }));
  if (code !== 0) {
    throw new Error(
      `Failed to execute tofu apply: ${Deno.inspect(stderr)}`,
    );
  }

  const destroyCommand = [
    "tofu",
    "destroy",
    "--auto-approve",
  ];

  ({ stdout: _, stderr, code } = await shell(destroyCommand, {
    currentDir: path,
  }));
  if (code !== 0) {
    throw new Error(
      `Failed to execute tofu destroy: ${Deno.inspect(stderr)}`,
    );
  }
}

async function terraformCleanup(dir: string | URL): Promise<void> {
  // deno-lint-ignore no-console
  console.log("Cleaning terraform files...");
  for await (const entry of Deno.readDir(dir)) {
    if (
      (entry.isFile || entry.isDirectory) &&
      (
        entry.name.endsWith(".tfstate") ||
        entry.name.endsWith(".tfstate.backup") ||
        entry.name.endsWith(".lock.hcl") ||
        entry.name === ".terraform"
      )
    ) {
      const filePath = `${dir}/${entry.name}`;
      await Deno.remove(filePath, { recursive: true });
      // deno-lint-ignore no-console
      console.log(`Removed terraform file/dir: ${filePath}`);
    }
  }
}
