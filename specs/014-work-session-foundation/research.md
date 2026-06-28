# Research

A separate WorkSession model is preferred over embedding execution state directly in ProjectTask because a task may have multiple execution attempts, providers, retries, cancellations, or future multi-employee sessions. Task-keyed portal storage is the smallest useful state shape for current Task Detail rendering.