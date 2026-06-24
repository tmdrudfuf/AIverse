"use client";

import dynamic from "next/dynamic";
import { FormEvent, useEffect, useRef, useState } from "react";

const CityGame = dynamic(() => import("./CityGame"), { ssr: false });

export type AgentRole = "PM" | "Engineer" | "QA" | "Marketer";
export type AgentPhase = "home" | "moving" | "working";
export type Agent = { role: AgentRole; status: string; color: string; phase: AgentPhase };
type ActivityEntry = { id: number; timestamp: string; agent: AgentRole | "System"; action: string };

const INITIAL_AGENTS: Agent[] = [
  { role: "PM", status: "Ready", color: "#ffca5c", phase: "home" },
  { role: "Engineer", status: "Ready", color: "#67d5ff", phase: "home" },
  { role: "QA", status: "Ready", color: "#c694ff", phase: "home" },
  { role: "Marketer", status: "Ready", color: "#ff7f9f", phase: "home" },
];

const FLOW: Array<{ role: AgentRole; status: string; action: string }> = [
  { role: "PM", status: "Planning", action: "created a plan" },
  { role: "Engineer", status: "Implementing", action: "started implementation" },
  { role: "QA", status: "Testing", action: "started testing" },
  { role: "Marketer", status: "Preparing launch", action: "prepared launch notes" },
];

const WALK_DURATION = 1000;
const ARRIVAL_GAP = 250;
const COMPLETION_GAP = 500;

export function CityDashboard() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [mission, setMission] = useState("");
  const [activeMission, setActiveMission] = useState("");
  const [running, setRunning] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextActivityId = useRef(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function submitMission(event: FormEvent) {
    event.preventDefault();
    const nextMission = mission.trim();
    if (!nextMission || running) return;

    timers.current.forEach(clearTimeout);
    timers.current = [];
    setAgents(INITIAL_AGENTS);
    setActiveMission(nextMission);
    setRunning(true);

    function appendActivity(agent: ActivityEntry["agent"], action: string) {
      setActivityLog((current) => [...current, {
        id: nextActivityId.current++,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }),
        agent,
        action,
      }]);
    }

    FLOW.forEach(({ role, status, action }, index) => {
      const departure = setTimeout(() => {
        setAgents((current) =>
          current.map((agent) => (agent.role === role ? { ...agent, phase: "moving" } : agent)),
        );
      }, 250 + index * (WALK_DURATION + ARRIVAL_GAP));
      const arrival = setTimeout(() => {
        setAgents((current) =>
          current.map((agent) =>
            agent.role === role ? { ...agent, status, phase: "working" } : agent,
          ),
        );
        appendActivity(role, action);
      }, 250 + index * (WALK_DURATION + ARRIVAL_GAP) + WALK_DURATION);
      timers.current.push(departure, arrival);
    });
    const workflowDuration =
      250 + (FLOW.length - 1) * (WALK_DURATION + ARRIVAL_GAP) + WALK_DURATION;
    const completion = setTimeout(() => {
      appendActivity("System", "Mission workflow completed");
      setRunning(false);
    }, workflowDuration + COMPLETION_GAP);
    timers.current.push(completion);
    setMission("");
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">SIMULATION ONLINE</p>
          <h1>AI CITY</h1>
        </div>
        <div className="city-clock"><span /> DISTRICT 01 · DAY SHIFT</div>
      </header>

      <section className="workspace">
        <div className="scene-card">
          <div className="scene-label">BUILDING INTERIOR VIEW</div>
          <CityGame agents={agents} />
          <div className="mission-strip">
            <span>CURRENT MISSION</span>
            <strong>{activeMission || "Awaiting assignment"}</strong>
          </div>
          <section className="activity-panel" aria-labelledby="activity-log-heading">
            <div className="activity-heading">
              <span id="activity-log-heading">ACTIVITY LOG</span>
              <small>{activityLog.length} EVENTS</small>
            </div>
            {activityLog.length === 0 ? (
              <p className="activity-empty">Mission activity will appear here.</p>
            ) : (
              <ol className="activity-list" aria-live="polite">
                {activityLog.map((entry, index) => (
                  <li className={index === activityLog.length - 1 ? "activity-entry latest" : "activity-entry"} key={entry.id}>
                    <time>{entry.timestamp}</time>
                    <strong>{entry.agent}</strong>
                    <span>{entry.action}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="control-panel">
          <div className="panel-heading">
            <p className="eyebrow">TEAM ROSTER</p>
            <h2>Daily Proof Inc.</h2>
          </div>

          <div className="agent-list">
            {agents.map((agent) => (
              <article className="agent-card" key={agent.role}>
                <span className="avatar" style={{ "--agent-color": agent.color } as React.CSSProperties}>
                  {agent.role.charAt(0)}
                </span>
                <div><h3>{agent.role}</h3><p>{agent.status}</p></div>
                <span className={agent.phase === "working" ? "status-dot active" : "status-dot"} />
              </article>
            ))}
          </div>

          <form onSubmit={submitMission} className="mission-form">
            <label htmlFor="mission">ASSIGN A MISSION</label>
            <textarea
              id="mission"
              value={mission}
              onChange={(event) => setMission(event.target.value)}
              placeholder="e.g. Ship the new landing page"
              rows={3}
              maxLength={140}
            />
            <button disabled={!mission.trim() || running} type="submit">
              {running ? "MISSION IN PROGRESS..." : "START MISSION →"}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
