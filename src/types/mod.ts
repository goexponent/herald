import { TaskStore } from "../backends/task_store.ts";

export type HeraldContext = {
  taskStore: TaskStore;
};
