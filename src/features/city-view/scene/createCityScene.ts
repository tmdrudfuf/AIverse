import type Phaser from "phaser";

type PhaserRuntime = typeof Phaser;
const C = { ink: 0x253247, grass: 0x79b45d, grassDark: 0x5b9748, road: 0x4a5262, roadEdge: 0x353c4b, sidewalk: 0xc9c3ad, sidewalkLight: 0xe1dbc5, yellow: 0xf4c85d };

export function createCityScene(PhaserRuntime: PhaserRuntime) {
  return class CityScene extends PhaserRuntime.Scene {
    create() {
      this.cameras.main.setBackgroundColor("#79b45d");
      const g = this.add.graphics();
      g.fillStyle(C.grass).fillRect(0, 0, 1200, 720);
      for (let y = 28; y < 720; y += 48) for (let x = (y / 48) % 2 ? 24 : 48; x < 1200; x += 72) {
        g.fillStyle(C.grassDark, .42).fillRect(x, y, 4, 9).fillRect(x - 4, y + 5, 4, 4).fillRect(x + 4, y + 4, 4, 4);
      }

      // Roads and sidewalks are isolated layers that can later feed navigation data.
      g.fillStyle(C.sidewalk).fillRect(0, 278, 1200, 164).fillRect(486, 0, 172, 720);
      g.fillStyle(C.sidewalkLight).fillRect(0, 286, 1200, 8).fillRect(0, 426, 1200, 8).fillRect(494, 0, 8, 720).fillRect(642, 0, 8, 720);
      g.fillStyle(C.roadEdge).fillRect(0, 304, 1200, 112).fillRect(512, 0, 120, 720);
      g.fillStyle(C.road).fillRect(0, 312, 1200, 96).fillRect(520, 0, 104, 720);
      g.fillStyle(C.yellow);
      for (let x = 20; x < 480; x += 62) g.fillRect(x, 357, 34, 6);
      for (let x = 672; x < 1200; x += 62) g.fillRect(x, 357, 34, 6);
      for (let y = 16; y < 272; y += 60) g.fillRect(569, y, 6, 32);
      for (let y = 448; y < 720; y += 60) g.fillRect(569, y, 6, 32);
      g.fillStyle(0xf2edda);
      for (let x = 520; x < 624; x += 20) g.fillRect(x, 316, 11, 30).fillRect(x, 374, 11, 30);
      for (let y = 312; y < 408; y += 20) g.fillRect(476, y, 30, 11).fillRect(638, y, 30, 11);

      this.drawBuilding(g, { x: 72, y: 72, width: 344, height: 180, wall: 0xe76f51, roof: 0x263b50, accent: C.yellow, name: "DAILY PROOF INC.", active: true });
      this.drawBuilding(g, { x: 735, y: 78, width: 326, height: 168, wall: 0x7397c2, roof: 0x34465b, accent: 0x9de6ec, name: "AI LAB", active: false });
      this.drawBuilding(g, { x: 760, y: 490, width: 350, height: 166, wall: 0xa67bb8, roof: 0x493c5a, accent: 0xf0b7d2, name: "PORTFOLIO STUDIO", active: false });
      [[32,238],[452,92],[690,54],[1138,232],[84,506],[194,594],[384,506],[696,548],[1152,502],[702,222]].forEach(([x,y]) => this.drawTree(g,x,y));
      this.add.text(34, 678, "DISTRICT 01", { fontFamily: "monospace", fontSize: "13px", color: "#335038", fontStyle: "bold" });
    }

    private drawBuilding(g: Phaser.GameObjects.Graphics, b: { x:number; y:number; width:number; height:number; wall:number; roof:number; accent:number; name:string; active:boolean }) {
      const { x,y,width,height,wall,roof,accent,name,active } = b;
      g.fillStyle(0x314233,.28).fillRect(x+12,y+15,width,height);
      if (active) { g.fillStyle(C.yellow,.28).fillRect(x-14,y-14,width+28,height+28); g.lineStyle(6,C.yellow).strokeRect(x-9,y-9,width+18,height+18); }
      g.fillStyle(C.ink).fillRect(x-8,y-16,width+16,30); g.fillStyle(roof).fillRect(x,y,width,36); g.fillStyle(wall).fillRect(x,y+36,width,height-36); g.fillStyle(0x233044,.2).fillRect(x,y+height-13,width,13);
      for (let wx=x+28; wx<x+width-35; wx+=62) { g.fillStyle(C.ink).fillRect(wx,y+57,38,48); g.fillStyle(accent).fillRect(wx+5,y+62,28,38); g.fillStyle(0xffffff,.35).fillRect(wx+9,y+65,5,30); }
      g.fillStyle(C.ink).fillRect(x+width/2-25,y+height-64,50,64); g.fillStyle(0xe7d9b4).fillRect(x+width/2-17,y+height-55,34,55); g.fillStyle(C.ink).fillRect(x+width/2+8,y+height-30,4,4);
      this.add.text(x+width/2,y-1,name,{ fontFamily:"monospace",fontSize:active?"18px":"17px",color:"#ffffff",fontStyle:"bold" }).setOrigin(.5);
      this.add.text(x+width/2,y+height+12,active?"ACTIVE COMPANY":"COMING SOON",{ fontFamily:"monospace",fontSize:"13px",color:active?"#253247":"#ffffff",backgroundColor:active?"#f4c85d":"#596171",fontStyle:"bold",padding:{x:10,y:6} }).setOrigin(.5,0).setAlpha(active?1:.94);
    }

    private drawTree(g: Phaser.GameObjects.Graphics,x:number,y:number) {
      g.fillStyle(0x3b6540,.25).fillRect(x-18,y+22,48,14); g.fillStyle(0x76513a).fillRect(x-5,y+3,12,31); g.fillStyle(0x315b3e).fillRect(x-22,y-14,48,28).fillRect(x-14,y-27,32,52); g.fillStyle(0x5d9e4c).fillRect(x-15,y-21,27,28); g.fillStyle(0x8bc461).fillRect(x-9,y-17,9,9);
    }
  };
}
