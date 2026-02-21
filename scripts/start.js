#!/usr/bin/env node

// This helper script detects the primary IPv4 address of the host machine
// and sets it as the packager hostname before launching Expo. Expo CLI uses
// the environment variable REACT_NATIVE_PACKAGER_HOSTNAME when generating the
// QR code for the local network connection. Without this, Expo sometimes picks
// the wrong interface (VPN adapters, docker, etc.) which leads to an invalid
// or unreachable address appearing in the QR code.

const { spawn } = require("child_process");
const os = require("os");

function getLocalIPv4() {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === "IPv4" && !net.internal) {
        candidates.push({ name, address: net.address });
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // drop any link-local addresses (169.254.x.x) unless that's all we have
  const workable = candidates.filter((c) => !c.address.startsWith("169.254."));

  // order preferences by interface name keywords; the arrays are checked in
  // order so Wi‑Fi comes first, followed by physical Ethernet. Virtual
  // adapters like VMware, VirtualBox, or Tailscale will not match these and
  // therefore are de‑prioritised.
  const preferences = ["Wi-Fi", "Wireless", "Ethernet", "Local Area Connection"];
  const pickFrom = (list) => {
    for (const pref of preferences) {
      const found = list.find((c) => c.name.includes(pref));
      if (found) return found.address;
    }
    return null;
  };

  let picked = pickFrom(workable) || pickFrom(candidates) || (workable[0] && workable[0].address) || candidates[0].address;

  // debug output so we can see what choices were available if something goes wrong
  console.debug("available addresses:", candidates.map((c) => `${c.name}=${c.address}`).join(", "));
  console.debug("selected address:", picked);

  return picked;
}

const localIp = getLocalIPv4();
if (localIp) {
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = localIp;
  console.log(`📡 using local IP address ${localIp} for Expo packager`);
} else {
  console.warn(
    "⚠️ could not detect a non‑internal IPv4 address; Expo will " +
      "use its default interface"
  );
}

// forward any args passed to this script to the expo CLI
const args = process.argv.slice(2);

const expo = spawn("npx", ["expo", "start", ...args], {
  stdio: "inherit",
  shell: true, // on Windows ensure command resolution works
});

expo.on("close", (code) => process.exit(code));
