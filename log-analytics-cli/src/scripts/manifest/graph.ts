import { Task } from "./manifest.schema";

export const buildDag = (tasks: Task[]) => {
  const datasets = new Set<string>();
  const dependsOnByDataset = new Map<string, string[]>();

  for (const task of tasks) {
    const { dataset, dependsOn = [] } = task;

    datasets.add(dataset);

    const uniqued = Array.from(new Set(dependsOn));
    if (uniqued.includes(dataset)) {
      throw new Error(
        `Self dependency detected: '${dataset}' depends on itself`
      );
    }

    dependsOnByDataset.set(dataset, uniqued);
  }

  return { datasets, dependsOnByDataset };
};

export const assertAcyclic = (args: {
  datasets: Set<string>;
  dependsOnByDataset: Map<string, string[]>;
}) => {
  const { datasets, dependsOnByDataset } = args;

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const parent = new Map<string, string | null>();

  const dfs = (dataset: string) => {
    if (visited.has(dataset)) return;

    if (visiting.has(dataset)) {
      const cycle: string[] = [dataset];
      let cur = parent.get(dataset);
      while (cur && cur !== dataset) {
        cycle.push(cur);
        cur = parent.get(cur);
      }
      cycle.reverse();
      throw new Error(
        `Cyclic dependency detected: ${cycle.join(" -> ")} -> ${dataset}`
      );
    }

    visiting.add(dataset);
    const depends = dependsOnByDataset.get(dataset) ?? [];
    for (const depend of depends) {
      parent.set(depend, dataset);
      dfs(depend);
    }
    visiting.delete(dataset);
    visited.add(dataset);
  };

  for (const dataset of datasets) {
    dfs(dataset);
  }
};

export const topologicalSort = (args: {
  datasets: Set<string>;
  dependsOnByDataset: Map<string, string[]>;
}) => {
  const { datasets, dependsOnByDataset } = args;

  const dependentsByDataset = new Map<string, string[]>();
  const indegreeByDataset = new Map<string, number>();

  for (const dataset of datasets) {
    dependentsByDataset.set(dataset, []);
    indegreeByDataset.set(dataset, 0);
  }

  for (const [dataset, depends] of dependsOnByDataset) {
    for (const depend of depends) {
      dependentsByDataset.get(depend)!.push(dataset);
      indegreeByDataset.set(dataset, indegreeByDataset.get(dataset)! + 1);
    }
  }

  const queue: string[] = [];
  for (const [k, v] of indegreeByDataset) {
    if (v === 0) {
      queue.push(k);
    }
  }

  const order: string[] = [];

  while (queue.length) {
    const dataset = queue.shift()!;
    order.push(dataset);

    const dependents = dependentsByDataset.get(dataset) ?? [];
    for (const dependent of dependents) {
      const nextIndegree = indegreeByDataset.get(dependent)! - 1;
      indegreeByDataset.set(dependent, nextIndegree);
      if (nextIndegree === 0) {
        queue.push(dependent);
      }
    }
  }

  return order;
};
