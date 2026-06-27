# Research: Employee Task Activity Log

Decision: store activity on ProjectTask.activityLog for the smallest local-only implementation.
Decision: do not introduce TaskActivityService or TaskActivityCollection until save/load, sync, notifications, analytics, or cross-task activity views require independent querying.
Decision: render only the latest three entries to fit the existing Phaser portal panel.