import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

// -----------------------
// 1) Fixed brand + fixed Mahindra vehicle list (as provided)
// -----------------------
const BRAND_OPTIONS = ["Mahindra"]; // you can add more later

const CAR_OPTIONS = [
  "Alfa Champion 3 Wheeler",
  "Armada",
  "Bolero",
  "Bolero Camper",
  "Bolero Invader",
  "Bolero Neo",
  "Bolero Pickup",
  "Genio",
  "Imperio",
  "Jeep",
  "Jeeto",
  "KUV100",
  "Logan",
  "Mahindra Tractor",
  "Mahindra Arjun Tractor",
  "Maxximo",
  "Maxi Truck",
  "Maxx Pickup",
  "MHawk",
  "Nuvosport",
  "Quanto",
  "Scorpio",
  "Scorpio Getaway",
  "Scorpio Pickup",
  "Scorpio-N",
  "Supro",
  "Supro Truck",
  "Thar",
  "Thar Roxx",
  "Tractor 8000 Series",
  "TUV300",
  "XUV",
  "XUV300",
  "XUV 3XO",
  "XUV400 EV",
  "XUV500",
  "Xylo",
  "XD3P",
  "Generator Maxforce",
];

// -----------------------
// 2) Category rules (best-effort, based on Product Name)
// -----------------------
const CATEGORY_SECTIONS = [
  { key: "Suspension", icon: "🛞" },
  { key: "Brake", icon: "🛑" },
  { key: "Light", icon: "💡" },
  { key: "Clutch", icon: "🧲" },
  { key: "Filters", icon: "🧽" },
  { key: "Electrical", icon: "⚡" },
  { key: "Engine & Cooling", icon: "🧊" },
  { key: "Steering", icon: "🧭" },
  { key: "Body", icon: "🚪" },
  { key: "Transmission", icon: "⚙️" },
  { key: "Fuel", icon: "⛽" },
  { key: "HVAC", icon: "🌬️" },
  { key: "Other", icon: "🧰" },
];

const CATEGORY_RULES = [
  {
    key: "Clutch",
    match: [
      "clutch",
      "pressure plate",
      "release bearing",
      "clutch plate",
      "clutch kit",
      "clutch disc",
      "clutch cover",
      "clutch master",
      "clutch slave",
      "clutch cable",
    ],
  },
  {
    key: "Brake",
    match: [
      "brake",
      "disc",
      "drum",
      "caliper",
      "pad",
      "shoe",
      "master cylinder",
      "wheel cylinder",
      "abs",
      "booster",
      "servo",
    ],
  },
  {
    key: "Suspension",
    match: [
      "shocker",
      "shock",
      "strut",
      "spring",
      "link rod",
      "ball joint",
      "tie rod",
      "stabilizer",
      "bush",
      "bushing",
      "suspension",
    ],
  },
  {
    key: "Steering",
    match: ["steering", "rack", "tie rod", "power steering", "steering pump", "steering box"],
  },
  {
    key: "Filters",
    match: ["filter", "oil filter", "fuel filter", "air filter", "cabin filter"],
  },
  {
    key: "Light",
    match: [
      "lamp",
      "light",
      "headlamp",
      "head lamp",
      "tail lamp",
      "tail light",
      "indicator",
      "bulb",
      "fog",
      "projector",
    ],
  },
  {
    key: "Electrical",
    match: [
      "battery",
      "alternator",
      "starter",
      "relay",
      "fuse",
      "switch",
      "wiring",
      "sensor",
      "ecu",
      "harness",
      "motor",
      "horn",
    ],
  },
  {
    key: "Engine & Cooling",
    match: [
      "radiator",
      "thermostat",
      "water pump",
      "fan",
      "hose",
      "coolant",
      "belt",
      "timing",
      "gasket",
      "cylinder",
      "piston",
      "valve",
      "injector",
      "turbo",
      "intercooler",
      "engine",
    ],
  },
  {
    key: "Transmission",
    match: [
      "gear",
      "transmission",
      "axle",
      "differential",
      "propeller",
      "shaft",
      "cv joint",
      "bearing",
      "hub",
      "clutch release",
    ],
  },
  {
    key: "Body",
    match: [
      "door",
      "bonnet",
      "bumper",
      "mirror",
      "glass",
      "windshield",
      "seat",
      "handle",
      "lock",
      "panel",
      "trim",
      "dashboard",
      "grill",
      "grille",
    ],
  },
  {
    key: "Fuel",
    match: ["fuel", "fuel tank", "fuel pump", "injector", "rail", "nozzle"],
  },
  {
    key: "HVAC",
    match: ["ac", "a/c", "compressor", "condenser", "evaporator", "blower", "heater"],
  },
];

function detectCategory(productName) {
  const s = String(productName || "").toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.match.some((m) => s.includes(m))) return rule.key;
  }
  return "Other";
}

// -----------------------
// 3) Vehicle name normalization
//    Excel may contain variants; this tries to map to your fixed list.
// -----------------------
// Key normalizer: removes spaces/symbols so "BoleroPickup" == "Bolero Pickup"
function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

const VEHICLE_MATCHERS = [
  { car: "Bolero Pickup", keys: ["bolero pickup", "bolero pick", "pickup bolero"] },
  { car: "Scorpio Pickup", keys: ["scorpio pickup", "scorpio pick"] },
  { car: "Scorpio Getaway", keys: ["scorpio getaway", "getaway"] },
  { car: "Scorpio-N", keys: ["scorpio n", "scorpio-n", "scorpion"] },
  { car: "Bolero Neo", keys: ["bolero neo"] },
  { car: "Bolero Camper", keys: ["bolero camper", "camper"] },
  { car: "Bolero Invader", keys: ["bolero invader", "invader"] },
  { car: "Genio", keys: ["genio"] },
  { car: "Jeeto", keys: ["jeeto"] },
  { car: "KUV100", keys: ["kuv100", "kuv 100"] },
  { car: "Logan", keys: ["logan"] },
  { car: "Maxximo", keys: ["maxximo"] },
  { car: "Maxi Truck", keys: ["maxi truck"] },
  { car: "Maxx Pickup", keys: ["maxx pickup", "maxx pick"] },
  { car: "MHawk", keys: ["mhawk"] },
  { car: "Nuvosport", keys: ["nuvosport", "nuvo sport"] },
  { car: "Quanto", keys: ["quanto"] },
  { car: "Supro", keys: ["supro"] },
  { car: "Supro Truck", keys: ["supro truck"] },
  { car: "Thar Roxx", keys: ["thar roxx", "roxx"] },
  { car: "Thar", keys: ["thar"] },
  { car: "TUV300", keys: ["tuv300", "tuv 300"] },
  { car: "XUV 3XO", keys: ["xuv 3xo", "3xo"] },
  { car: "XUV300", keys: ["xuv300", "xuv 300"] },
  { car: "XUV400 EV", keys: ["xuv400", "xuv 400", "ev"] },
  { car: "XUV500", keys: ["xuv500", "xuv 500"] },
  { car: "XUV", keys: ["xuv"] },
  { car: "Xylo", keys: ["xylo"] },
  { car: "XD3P", keys: ["xd3p"] },
  { car: "Imperio", keys: ["imperio"] },
  { car: "Armada", keys: ["armada"] },
  { car: "Jeep", keys: ["jeep"] },
  { car: "Bolero", keys: ["bolero"] },
  { car: "Scorpio", keys: ["scorpio"] },
  { car: "Alfa Champion 3 Wheeler", keys: ["alfa", "champion", "3 wheeler", "three wheeler"] },
  { car: "Generator Maxforce", keys: ["generator", "maxforce"] },
  { car: "Mahindra Arjun Tractor", keys: ["arjun tractor", "mahindra arjun"] },
  { car: "Tractor 8000 Series", keys: ["8000 series", "tractor 8000"] },
  { car: "Mahindra Tractor", keys: ["tractor", "mahindra tractor"] },
];

function mapVehicleToFixedList(vehicleFromSheet) {
  const v = normKey(vehicleFromSheet);
  if (!v) return "";

  // 1) Exact key match (works for BoleroPickup vs Bolero Pickup)
  for (const c of CAR_OPTIONS) {
    if (normKey(c) === v) return c;
  }

  // 2) Best-effort keyword matchers
  for (const m of VEHICLE_MATCHERS) {
    if (m.keys.some((k) => v.includes(normKey(k)))) return m.car;
  }

  // 3) Loose contains match (fallback)
  for (const c of CAR_OPTIONS) {
    const ck = normKey(c);
    if (ck && (v.includes(ck) || ck.includes(v))) return c;
  }

  return "";
}

// -----------------------
// 4) App
// -----------------------
export default function App() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const [brand, setBrand] = useState("Mahindra");
  const [car, setCar] = useState("");
  const [category, setCategory] = useState("");

  // showAllData = ignore category and show complete car data
  const [showAllData, setShowAllData] = useState(false);

  useEffect(() => {
    async function loadXlsx() {
      try {
        const res = await fetch("/data.xlsx");
        if (!res.ok) throw new Error("data.xlsx not found in /public");
        const buf = await res.arrayBuffer();

        const wb = XLSX.read(buf, { type: "array" });
        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(ws, { defval: "" });

        const normalized = json
          .map((r) => {
            const productName = r["Product Name"] ?? r["Product"] ?? r["Item"] ?? r["Description"] ?? "";
            const oe = r["O.E. No."] ?? r["OE"] ?? r["OE No"] ?? r["Part No"] ?? r["PartNo"] ?? "";
            const vehicle = r["Vehicle"] ?? r["Car"] ?? r["Model"] ?? "";

            const fixedCar = mapVehicleToFixedList(vehicle);
            if (!fixedCar) return null;

            return {
              brand: "Mahindra",
              car: fixedCar,
              category: detectCategory(productName),
              productName: String(productName || "").trim(),
              oe: String(oe || "").trim(),
              // Original vehicle text from Excel (exact fitment info)
              vehicleInfo: String(vehicle || "").trim(),
            };
          })
          .filter(Boolean);

        setRows(normalized);
      } catch (e) {
        console.error(e);
        alert("Excel load nahi hua. public/data.xlsx check karo (name EXACT data.xlsx). ");
      } finally {
        setLoading(false);
      }
    }

    loadXlsx();
  }, []);

  const availableCars = useMemo(() => {
    // Must show only your provided list (even if no data in Excel)
    return CAR_OPTIONS;
  }, []);

  const availableCategories = useMemo(() => {
    // show fixed sections (as requested)
    return CATEGORY_SECTIONS;
  }, []);

  const results = useMemo(() => {
    return rows.filter((r) => {
      if (brand && r.brand !== brand) return false;
      if (car && r.car !== car) return false;
      if (!showAllData && category && r.category !== category) return false;
      return true;
    });
  }, [rows, brand, car, category, showAllData]);

  const uniqueOeCount = useMemo(() => {
    const s = new Set(results.map((x) => x.oe).filter(Boolean));
    return s.size;
  }, [results]);

  function reset() {
    setBrand("Mahindra");
    setCar("");
    setCategory("");
    setShowAllData(false);
  }

  function copy(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
  }

  function shareWhatsApp(item) {
    const fitment = item.vehicleInfo ? `\nFitment: ${item.vehicleInfo}` : "";
    const text = `Mahindra Parts Required:\nBrand: ${brand || "-"}\nCar: ${car || "-"}\nCategory: ${category || "-"}\nItem: ${item.productName}\nO.E. No.: ${item.oe || "-"}${fitment}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Loading Mahindra Parts…</div>
          <div style={{ marginTop: 8, opacity: 0.8 }}>Database: public/data.xlsx</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Fix: dropdown options white bg + white text issue */}
      <style>{`
        select { color-scheme: dark; }
        select option { color: #111 !important; background: #fff !important; }
      `}</style>
      <div style={styles.header}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 950 }}>Mahindra Parts Finder</div>
          <div style={{ opacity: 0.8, marginTop: 2 }}>UI only • Customer-friendly • No typing needed</div>
        </div>
        <button style={styles.btnDanger} onClick={reset}>Reset</button>
      </div>

      {/* 1) BRAND */}
      <div style={styles.card}>
        <div style={styles.title}>1) Brand</div>
        <div style={styles.row}>
          <select style={styles.select} value={brand} onChange={(e) => setBrand(e.target.value)}>
            {BRAND_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <div style={{ opacity: 0.75 }}>Currently only Mahindra vehicles</div>
        </div>
      </div>

      {/* 2) CAR */}
      <div style={{ ...styles.card, marginTop: 12 }}>
        <div style={styles.title}>2) Car Name</div>
        <select
          style={styles.select}
          value={car}
          onChange={(e) => {
            setCar(e.target.value);
            setCategory("");
            setShowAllData(false);
          }}
        >
          <option value="">Select car…</option>
          {availableCars.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div style={{ marginTop: 10, opacity: 0.8, fontSize: 13 }}>
          Tip: Customer sirf dropdown se select kare — spelling ki problem nahi.
        </div>
      </div>

      {/* 3) CATEGORY */}
      <div style={{ ...styles.card, marginTop: 12 }}>
        <div style={styles.title}>3) Category / Section</div>
        <div style={styles.grid}>
          {availableCategories.map((c) => (
            <button
              key={c.key}
              style={{
                ...styles.bigTile,
                borderColor: category === c.key ? "rgba(225,29,72,0.8)" : "rgba(255,255,255,0.14)",
                background: category === c.key ? "rgba(225,29,72,0.18)" : "rgba(255,255,255,0.06)",
              }}
              onClick={() => {
                setCategory(c.key);
                setShowAllData(false);
              }}
              disabled={!car}
              title={!car ? "Select car first" : ""}
            >
              <div style={{ fontSize: 30 }}>{c.icon}</div>
              <div style={{ marginTop: 8, fontWeight: 900 }}>{c.key}</div>
              <div style={{ marginTop: 4, opacity: 0.75, fontSize: 12 }}>{car ? "Tap" : "Select car"}</div>
            </button>
          ))}
        </div>
      </div>

      {/* OUTPUT */}
      <div style={{ ...styles.card, marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={styles.title}>Output</div>
            <div style={{ opacity: 0.85, marginTop: -6 }}>
              Brand: <b>{brand}</b> • Car: <b>{car || "-"}</b> • Category: <b>{showAllData ? "(All)" : (category || "-")}</b>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={styles.btnGhost}
              onClick={() => {
                if (!car) return;
                setShowAllData((v) => !v);
              }}
              disabled={!car}
              title={!car ? "Select car first" : ""}
            >
              {showAllData ? "Category wise" : "Show all data"}
            </button>
            <div style={{ opacity: 0.8, alignSelf: "center" }}>
              Items: <b>{results.length}</b> • Unique O.E.: <b>{uniqueOeCount}</b>
            </div>
          </div>
        </div>

        {!car ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>
            Please select <b>Car Name</b>.
          </div>
        ) : (!showAllData && !category) ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>
            Select a <b>Category</b> OR press <b>Show all data</b>.
          </div>
        ) : results.length === 0 ? (
          <div style={{ marginTop: 12, opacity: 0.8 }}>
            No matching items found in your Excel for this selection.
          </div>
        ) : (
          <div style={{ ...styles.results, marginTop: 12 }}>
            {results.slice(0, 200).map((item, idx) => (
              <div key={`${item.oe}-${idx}`} style={styles.resultCard}>
                <div style={{ fontWeight: 950 }}>{item.productName || "(No name)"}</div>
                <div style={{ marginTop: 6, opacity: 0.9 }}>
                  O.E. No.: <b style={{ fontSize: 16 }}>{item.oe || "-"}</b>
                </div>

                <div style={{ marginTop: 6, opacity: 0.8 }}>
                  Fits / Vehicle Info: <b>{item.vehicleInfo || item.car || "-"}</b>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  <button style={styles.btnPrimary} onClick={() => copy(item.oe)} disabled={!item.oe}>
                    Copy O.E.
                  </button>
                  <button style={styles.btnGhost} onClick={() => shareWhatsApp(item)}>
                    WhatsApp
                  </button>
                </div>
              </div>
            ))}

            {results.length > 200 && (
              <div style={{ opacity: 0.75, marginTop: 8 }}>
                Showing first 200 results. (We can add paging / search next.)
              </div>
            )}
          </div>
        )}
      </div>

      <div style={styles.footer}>
        <div style={{ opacity: 0.75 }}>
          Next upgrades: add item photos, voice selection, and exact OE mapping per model.
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0b0f14",
    color: "#eaf2ff",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
    padding: 18,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  card: {
    borderRadius: 18,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: 16,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
  },
  title: {
    fontSize: 18,
    fontWeight: 950,
    marginBottom: 10,
  },
  row: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  select: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.16)",
    padding: "12px 12px",
    color: "#eaf2ff",
    outline: "none",
    fontSize: 16,
    fontWeight: 800,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
  },
  bigTile: {
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: 14,
    cursor: "pointer",
    textAlign: "left",
    color: "#eaf2ff",
    outline: "none",
  },
  results: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },
  resultCard: {
    borderRadius: 16,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: 14,
  },
  btnPrimary: {
    borderRadius: 12,
    background: "#e11d48",
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "10px 12px",
    cursor: "pointer",
    color: "white",
    fontWeight: 900,
  },
  btnGhost: {
    borderRadius: 12,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.16)",
    padding: "10px 12px",
    cursor: "pointer",
    color: "#eaf2ff",
    fontWeight: 800,
  },
  btnDanger: {
    borderRadius: 12,
    background: "rgba(225,29,72,0.18)",
    border: "1px solid rgba(225,29,72,0.5)",
    padding: "10px 12px",
    cursor: "pointer",
    color: "#ffd5df",
    fontWeight: 900,
  },
  footer: {
    marginTop: 12,
    padding: 10,
    opacity: 0.9,
  },
};
