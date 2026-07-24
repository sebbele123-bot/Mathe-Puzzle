import { chromium } from "playwright";
const SP="/tmp/claude-0/-home-user-Mathe-Puzzle/f6fcffed-6290-5840-8b90-cbb902648761/scratchpad";
const b=await chromium.launch({executablePath:"/opt/pw-browsers/chromium",ignoreDefaultArgs:["--headless"],args:["--headless=new","--no-sandbox"]});
const p=await b.newPage({viewport:{width:900,height:1500},deviceScaleFactor:2});
const errs=[];p.on("pageerror",e=>errs.push(String(e)));
// scope taps to the Vorräte section (contains both shelves; excludes bench & protocol)
const pool=()=>p.locator("section").filter({has:p.getByText("Schlussregeln",{exact:true})});
const pick=t=>pool().getByText(t,{exact:true}).first();
const hammer=()=>p.getByRole("button",{name:/Hammer/}).click();
const leeren=()=>p.getByRole("button",{name:/^leeren/}).click();
await p.goto("http://localhost:5173/",{waitUntil:"networkidle"});
await p.getByText("Beweis-Baukasten").first().waitFor();
await p.getByRole("button",{name:/Ü4.1 — Cosinus-Satz/}).click();
await p.getByText("Begriffs-Check").first().waitFor();
await pick("Ankathete").click(); await pick("Hypotenuse").click(); await pick("÷").click(); await pick(":=").click();
await hammer(); await p.waitForTimeout(1900);
await pick("Gegenkathete").click(); await pick("Hypotenuse").click(); await pick("÷").click(); await pick(":=").click();
await hammer(); await p.waitForTimeout(1900);
await p.getByText("Zu zeigen").first().waitFor();
// full "Standard" 5-step proof (default depth after gate)
await pick("A in Koordinaten").click(); await pick("cos").click(); await pick("sin").click(); await pick("C=(0,0), B=(a,0), ∠γ").click(); await hammer(); await p.waitForTimeout(700); await leeren();
await pick("Lot auf die Grundlinie").click(); await pick("A = (b·cosγ, b·sinγ)").click(); await hammer(); await p.waitForTimeout(700); await leeren();
await pick("Katheten ablesen").click(); await pick("A = (b·cosγ, b·sinγ)").click(); await pick("X = (b·cosγ, 0)").click(); await hammer(); await p.waitForTimeout(700); await leeren();
await pick("Pythagoras").click(); await pick("Katheten: b·sinγ und a − b·cosγ").click(); await hammer(); await p.waitForTimeout(700); await leeren();
await pick("ausmultiplizieren").click(); await pick("c² = (b·sinγ)² + (a − b·cosγ)²").click(); await pick("sin²γ + cos²γ = 1").click(); await hammer();
await p.getByText("Beweis geschafft").first().waitFor({timeout:4000});
await p.screenshot({path:SP+"/nb-cos-win.png"});
console.log("Ü4.1 full flow (cos/sin gate → 5-step Cosinus-Satz): OK | errors:",errs.length?errs:"none");
await b.close();process.exit(errs.length?1:0);
