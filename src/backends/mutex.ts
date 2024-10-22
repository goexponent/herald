export class Mutex {
  private currentPromise: Promise<void> = Promise.resolve();

  lock(): Promise<() => void> {
    // Capture the previous promise in the chain
    let release: () => void;

    // Create a new promise that locks the mutex
    const newPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    // Chain the new promise to ensure sequential execution
    const result = this.currentPromise.then(() => release!);
    this.currentPromise = newPromise;

    return result; // Return the release function to be called after the operation
  }
}
