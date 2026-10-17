const fs = require('fs');

async function test() {
  const r = await fetch("https://link-pair-go.base44.app/static/index-BZKFpdeA.js");
  const code = await r.text();
  console.log("Bundle length:", code.length);

  // Search for page components or text in German/English
  const germanTexts = code.match(/["'][^"']*(?:Koppeln|Verbindung|Gerät|WebRTC|Peer|Kamera|Mikrofon|Datei|Chat|Sitzung|Code)[^"']*["']/gi) || [];
  console.log("German strings sample:", germanTexts.slice(0, 25));

  // Search for page names
  const pageMatches = code.match(/(?:pages\/|src\/pages\/|[A-Z][a-zA-Z0-9]+Page)/g) || [];
  console.log("Page matches:", [...new Set(pageMatches)].slice(0, 20));

  // Check base44 entity names or functions
  const entities = code.match(/base44\.entities\.[a-zA-Z0-9_]+/g) || [];
  console.log("Entities:", [...new Set(entities)]);
}
test().catch(console.error);
