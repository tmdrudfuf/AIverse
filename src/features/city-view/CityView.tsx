import CitySceneCanvas from "./CitySceneCanvas";

export function CityView() {
  return (
    <main className="city-view-shell">
      <header className="city-view-header">
        <div><p className="city-view-kicker">DISTRICT 01 / COMPANY CAMPUS</p><h1>AI CITY</h1></div>
        <div className="city-view-status"><span /> CITY VIEW</div>
      </header>
      <section className="city-view-frame" aria-labelledby="city-view-title">
        <div className="city-view-framebar">
          <div><p>SPRINT 02</p><h2 id="city-view-title">Company District</h2></div>
          <div className="city-view-key"><span><i className="active-key" /> ACTIVE COMPANY</span><span><i className="future-key" /> FUTURE SITE</span></div>
        </div>
        <CitySceneCanvas />
        <footer className="city-view-footer"><span>3 BUILDINGS</span><strong>DAILY PROOF INC. IS ACTIVE</strong><span>NO TRANSIT ROUTES</span></footer>
      </section>
    </main>
  );
}
