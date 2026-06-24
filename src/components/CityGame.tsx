"use client";

import { useEffect, useRef } from "react";
import type { Agent } from "./CityDashboard";

const WALK_DURATION = 1000;

export default function CityGame({ agents }: { agents: Agent[] }) {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<import("phaser").Game | null>(null);

  useEffect(() => {
    let disposed = false;

    async function mountGame() {
      const Phaser = (await import("phaser")).default;
      if (disposed || !host.current) return;

      class CityScene extends Phaser.Scene {
        private statusLabels = new Map<string, Phaser.GameObjects.Text>();
        private people = new Map<string, Phaser.GameObjects.Container>();

        private readonly homePositions = [
          { x: 190, y: 500 },
          { x: 380, y: 500 },
          { x: 580, y: 500 },
          { x: 770, y: 500 },
        ];

        private readonly workPositions = [
          { x: 190, y: 270 },
          { x: 380, y: 270 },
          { x: 580, y: 270 },
          { x: 770, y: 270 },
        ];

        create() {
          const width = 960;
          const height = 600;
          this.cameras.main.setBackgroundColor("#eadfca");

          const g = this.add.graphics();

          // Office shell and a central walking lane.
          g.fillStyle(0xeadfca).fillRect(0, 0, width, 410);
          g.fillStyle(0x263b50).fillRect(0, 0, width, 22);
          g.fillStyle(0xd66f55).fillRect(0, 22, width, 14);
          g.fillStyle(0xc9b99d).fillRect(0, 410, width, 190);
          g.fillStyle(0xb7a687).fillRect(0, 410, width, 9);
          g.fillStyle(0xd8c9ad).fillRect(74, 320, 812, 210);
          g.lineStyle(3, 0x9e8e73).strokeRect(74, 320, 812, 210);
          for (let x = 112; x < 900; x += 86) {
            g.fillStyle(0xc7b697).fillRect(x, 326, 3, 198);
          }

          // Windows keep the scene visually grounded inside the company building.
          for (const x of [92, 322, 552, 782]) {
            g.fillStyle(0x263b50).fillRect(x, 60, 120, 90);
            g.fillStyle(0x89ced8).fillRect(x + 7, 67, 106, 76);
            g.fillStyle(0xffffff, 0.28).fillRect(x + 18, 72, 12, 62);
          }

          this.add
            .text(480, 177, "DAILY PROOF INC.  /  OPERATIONS FLOOR", {
              fontFamily: "monospace",
              fontSize: "16px",
              color: "#263044",
              fontStyle: "bold",
            })
            .setOrigin(0.5);

          // A fixed workstation destination for each agent.
          this.workPositions.forEach(({ x }) => {
            g.fillStyle(0x34465b).fillRect(x - 55, 226, 110, 12);
            g.fillStyle(0x72584a)
              .fillRect(x - 48, 238, 8, 48)
              .fillRect(x + 40, 238, 8, 48);
            g.fillStyle(0x263b50).fillRect(x - 27, 198, 54, 34);
            g.fillStyle(0x9de6ec).fillRect(x - 21, 204, 42, 22);
          });

          // Fixed home pads make each starting position explicit.
          this.homePositions.forEach(({ x }, index) => {
            const color = Phaser.Display.Color.HexStringToColor(agents[index].color).color;
            g.fillStyle(0x263b50).fillRect(x - 46, 537, 92, 8);
            g.fillStyle(color, 0.35).fillRect(x - 38, 545, 76, 6);
            this.add
              .text(x, 565, "HOME", {
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#5f574b",
              })
              .setOrigin(0.5);
          });

          agents.forEach((agent, index) => {
            const home = this.homePositions[index];
            const agentColor = Phaser.Display.Color.HexStringToColor(agent.color).color;
            const legs = this.add.rectangle(0, 4, 30, 10, 0x243144);
            const body = this.add.rectangle(0, -18, 24, 35, agentColor).setStrokeStyle(4, 0x243144);
            const head = this.add.rectangle(0, -44, 25, 22, 0xf2bb88).setStrokeStyle(4, 0x243144);
            const person = this.add.container(home.x, home.y, [legs, body, head]);

            const roleLabel = this.add
              .text(home.x, home.y - 76, agent.role.toUpperCase(), {
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#ffffff",
                backgroundColor: "#243144",
                padding: { x: 6, y: 3 },
              })
              .setOrigin(0.5);

            const statusLabel = this.add
              .text(home.x, home.y + 30, agent.status, {
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#223046",
                backgroundColor: "#f4f0dc",
                padding: { x: 5, y: 3 },
              })
              .setOrigin(0.5);

            const bubbleBox = this.add.rectangle(0, 0, 86, 30, 0xfffaf0).setStrokeStyle(3, 0x243144);
            const bubbleTail = this.add
              .triangle(-25, 19, 0, 0, 12, 0, 0, 12, 0xfffaf0)
              .setStrokeStyle(2, 0x243144);
            const bubbleText = this.add
              .text(0, 0, "ON IT!", {
                fontFamily: "monospace",
                fontSize: "11px",
                color: "#243144",
                fontStyle: "bold",
              })
              .setOrigin(0.5);
            const bubble = this.add
              .container(home.x, home.y - 116, [bubbleBox, bubbleTail, bubbleText])
              .setVisible(false);

            this.statusLabels.set(agent.role, statusLabel);
            this.people.set(agent.role, person);
            person.setData({ index, roleLabel, statusLabel, bubble });
          });

          this.game.events.on("agents:update", (nextAgents: Agent[]) => {
            nextAgents.forEach((agent) => {
              this.statusLabels.get(agent.role)?.setText(agent.status);
              const person = this.people.get(agent.role);
              if (!person) return;

              const index = person.getData("index") as number;
              const roleLabel = person.getData("roleLabel") as Phaser.GameObjects.Text;
              const statusLabel = person.getData("statusLabel") as Phaser.GameObjects.Text;
              const bubble = person.getData("bubble") as Phaser.GameObjects.Container;
              const target =
                agent.phase === "home" ? this.homePositions[index] : this.workPositions[index];

              bubble.setVisible(agent.phase === "working");
              this.tweens.killTweensOf([person, roleLabel, statusLabel, bubble]);

              if (agent.phase === "moving") {
                this.tweens.add({
                  targets: [person, roleLabel, statusLabel, bubble],
                  x: target.x,
                  y: (targetObject: Phaser.GameObjects.GameObject) => {
                    if (targetObject === person) return target.y;
                    if (targetObject === roleLabel) return target.y - 76;
                    if (targetObject === statusLabel) return target.y + 30;
                    return target.y - 116;
                  },
                  duration: WALK_DURATION,
                  ease: "Sine.easeInOut",
                });
                this.tweens.add({
                  targets: person,
                  angle: { from: -2, to: 2 },
                  duration: 125,
                  yoyo: true,
                  repeat: 3,
                });
              } else {
                person.setPosition(target.x, target.y).setAngle(0);
                roleLabel.setPosition(target.x, target.y - 76);
                statusLabel.setPosition(target.x, target.y + 30);
                bubble.setPosition(target.x, target.y - 116);
              }
            });
          });
        }
      }

      game.current = new Phaser.Game({
        type: Phaser.AUTO,
        parent: host.current,
        width: 960,
        height: 600,
        pixelArt: true,
        transparent: true,
        scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
        scene: CityScene,
      });
    }

    mountGame();
    return () => {
      disposed = true;
      game.current?.destroy(true);
      game.current = null;
    };
  }, []);

  useEffect(() => {
    game.current?.events.emit("agents:update", agents);
  }, [agents]);

  return (
    <div
      ref={host}
      className="game-canvas"
      aria-label="Pixel building interior view of Daily Proof Inc."
    />
  );
}
