import * as random from "std/random";

export function getRandomInt(min = 0, max: number) {
  return random.randomIntegerBetween(min, max);
}

export function getRandomUUID(): string {
  return crypto.randomUUID();
}
