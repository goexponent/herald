import * as random from "random";

export function getRandomInt(min = 0, max: number) {
  return random.randomInt(min, max);
}

export function getRandomUUID(): string {
  return crypto.randomUUID();
}
