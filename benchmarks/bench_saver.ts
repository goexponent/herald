async function runBenchmarksInSubprocess(): Promise<string> {
  const command = new Deno.Command("deno", {
    args: ["bench", "-A", "--json"],
    stdout: "piped",
    stderr: "piped",
    env: {
      log_level: "INFO",
    },
  });

  const process = command.spawn();
  const { code, stdout, stderr } = await process.output();

  const decodedStdout = new TextDecoder().decode(stdout);
  const decodedStderr = new TextDecoder().decode(stderr);

  if (code !== 0) {
    throw new Error(`Failed running benchmarks: ${decodedStderr}`);
  }

  return decodedStdout;
}

async function saveBenchmarkResult() {
  // run benchmarks in subprocess, in json format
  const benchmark = await runBenchmarksInSubprocess();

  // write to file
  const resultFile = "./benchmarks/result.json";
  await Deno.writeTextFile(resultFile, benchmark);
}

await saveBenchmarkResult();
