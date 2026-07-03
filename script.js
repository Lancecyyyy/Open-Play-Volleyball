/* ============================================================
   OPEN PLAY — Volleyball Sign-Up
   Demonstrates: getElementById, querySelector, querySelectorAll,
   getElementsByClassName, getElementsByTagName, getElementsByName,
   createElement, appendChild, removeChild, setAttribute,
   and control structures: for, while, if/else, switch, ternary.
   ============================================================ */

// ---- PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL HERE ----
// See SETUP.md for step-by-step deployment instructions.
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyYGqI04SI5ZSCYwkfCPrFhGTT5_MRJLsfZDAuwR_YnKKvnEkr6EHJfo2ddFyx_aQTj/exec";

const MAX_PER_TEAM = 6;

let roster = [];    // confirmed players: {name, block, contact, position, team, slot}
let waitlist = [];  // overflow players: {name, block, contact, position}

/* ---------------- position labels (switch) ---------------- */
function positionLabel(slotNum){
  switch(slotNum){
    case 1: return "Back Right · Server";
    case 2: return "Front Right";
    case 3: return "Front Center · Setter";
    case 4: return "Front Left";
    case 5: return "Back Left";
    case 6: return "Back Center · Libero";
    default: return "Position " + slotNum;
  }
}

/* ---------------- next open-play date (loop over days) ---------------- */
function nextSessionLabel(){
  const now = new Date();
  const target = new Date(now);

  // control structure: step forward a day at a time until we land on Friday
  while(target.getDay() !== 5){
    target.setDate(target.getDate() + 1);
  }
  if(now.getDay() === 5 && now.getHours() >= 16){
    target.setDate(target.getDate() + 7); // today's session already started/passed
  }

  const opts = { weekday: "long", month: "short", day: "numeric" };
  return target.toLocaleDateString(undefined, opts) + " · 4:00 PM";
}

/* ---------------- build the court (for loop + createElement) ---------------- */
function buildSlots(containerId, team){
  const container = document.getElementById(containerId);
  for(let i = 1; i <= 6; i++){
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.id = "slot-" + team + "-" + i;
    slot.setAttribute("data-team", team);
    slot.setAttribute("data-slot", i);
    slot.innerHTML =
      '<span class="pos-num">P' + i + '</span>' +
      '<span class="pos-label">' + positionLabel(i) + "</span>";
    container.appendChild(slot);
  }
}
buildSlots("slotsA", "A");
buildSlots("slotsB", "B");

/* ---------------- helpers ---------------- */
function initials(name){
  return name
    .split(" ")
    .filter(Boolean)
    .map(function(w){ return w[0].toUpperCase(); })
    .slice(0, 2)
    .join("");
}

// scans a team's slots for the first open one — while loop
function findOpenSlot(team){
  let i = 1;
  while(i <= MAX_PER_TEAM){
    const el = document.getElementById("slot-" + team + "-" + i);
    if(el && !el.classList.contains("filled")) return i;
    i++;
  }
  return null;
}

// balances teams — ternary based on current headcount
function chooseTeam(){
  const aCount = roster.filter(function(p){ return p.team === "A"; }).length;
  const bCount = roster.filter(function(p){ return p.team === "B"; }).length;
  return aCount <= bCount ? "A" : "B";
}

function showMsg(text, kind){
  const msg = document.getElementById("formMsg");
  msg.textContent = text;
  msg.className = "form-msg show " + kind;
}

function bounceBall(){
  const ball = document.getElementById("ball");
  ball.classList.remove("serve");
  void ball.offsetWidth; // restart animation
  ball.classList.add("serve");
}

function bumpScore(el){
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

/* ---------------- fill / clear a court slot ---------------- */
function fillSlot(team, slotNum, player, silent){
  // querySelector() — locate the exact slot by its data attributes
  const el = document.querySelector('.slot[data-team="' + team + '"][data-slot="' + slotNum + '"]');
  if(!el) return;
  el.classList.add("filled");
  el.innerHTML =
    '<span class="chip-initials">' + initials(player.name) + "</span>" +
    '<span class="chip-name">' + player.name.split(" ")[0] + "</span>";
  if(!silent) bounceBall();
}

function clearSlot(team, slotNum){
  const el = document.querySelector('.slot[data-team="' + team + '"][data-slot="' + slotNum + '"]');
  if(!el) return;
  el.classList.remove("filled");
  el.innerHTML =
    '<span class="pos-num">P' + slotNum + "</span>" +
    '<span class="pos-label">' + positionLabel(slotNum) + "</span>";
}

/* ---------------- roster list rendering ---------------- */
function addRosterRow(player){
  const list = document.getElementById("rosterList");

  const emptyMsg = list.querySelector(".empty");
  if(emptyMsg !== null) list.removeChild(emptyMsg);

  const li = document.createElement("li");
  li.className = "roster-row";
  li.id = "roster-" + player.team + player.slot;
  li.innerHTML =
    '<span class="r-team team-' + player.team + '">' + player.team + "</span>" +
    '<span class="r-name">' + player.name + "</span>" +
    '<span class="r-pos">' + (player.position === "Any" ? positionLabel(player.slot) : player.position) + "</span>" +
    '<button class="r-leave" type="button">Leave</button>';
  list.appendChild(li);

  li.querySelector(".r-leave").addEventListener("click", function(){
    handleLeave(player.team, player.slot, li);
  });
}

function renderWaitlistEmptyState(){
  const list = document.getElementById("waitlistList");
  list.innerHTML = "";
  if(waitlist.length === 0){
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Waitlist is empty.";
    list.appendChild(li);
    return;
  }
  for(let i = 0; i < waitlist.length; i++){
    const li = document.createElement("li");
    li.innerHTML =
      '<span class="w-num">' + (i + 1) + "</span>" +
      '<span class="r-name">' + waitlist[i].name + "</span>" +
      '<span class="r-pos">' + waitlist[i].position + "</span>";
    list.appendChild(li);
  }
}

function clearRosterEmptyStateIfNeeded(){
  if(roster.length > 0) return;
  const list = document.getElementById("rosterList");
  if(list.querySelector(".empty")) return;
  const empty = document.createElement("li");
  empty.className = "empty";
  empty.textContent = "No players yet — be the first to join.";
  list.appendChild(empty);
}

/* ---------------- leaving the game (removeChild) ---------------- */
function handleLeave(team, slotNum, li){
  const leaving = roster.find(function(p){ return p.team === team && p.slot === slotNum; });

  clearSlot(team, slotNum);
  roster = roster.filter(function(p){ return !(p.team === team && p.slot === slotNum); });
  li.parentElement.removeChild(li);
  clearRosterEmptyStateIfNeeded();

  if(leaving){
    postAction("leave", { team: team, slot: slotNum, name: leaving.name, contact: leaving.contact });
  }

  promoteFromWaitlist();
  updateScoreboard();
}

/* ---------------- promote waitlisted players (while + break/continue) ---------------- */
function promoteFromWaitlist(){
  while(waitlist.length > 0){
    let team = chooseTeam();
    let slotNum = findOpenSlot(team);

    if(slotNum === null){
      const otherTeam = (team === "A") ? "B" : "A";
      const otherSlot = findOpenSlot(otherTeam);
      if(otherSlot === null) break; // court is genuinely full, stop promoting
      team = otherTeam;
      slotNum = otherSlot;
    }

    const person = waitlist.shift();
    const promoted = {
      name: person.name, block: person.block, contact: person.contact,
      position: person.position, team: team, slot: slotNum
    };
    roster.push(promoted);
    fillSlot(team, slotNum, promoted);
    addRosterRow(promoted);

    postAction("waitlist_remove", { name: promoted.name, contact: promoted.contact });
    postAction("join", {
      name: promoted.name, block: promoted.block, contact: promoted.contact,
      position: promoted.position, team: team, slot: slotNum, status: "Confirmed (from waitlist)"
    });
  }
  renderWaitlistEmptyState();
}

/* ---------------- scoreboard + status refresh ---------------- */
function updateScoreboard(){
  // querySelectorAll() — count every filled slot on the court
  const filled = document.querySelectorAll(".slot.filled").length;
  const filledEl = document.getElementById("filledCount");
  const waitEl = document.getElementById("waitCount");

  if(filledEl.textContent !== String(filled)) bumpScore(filledEl);
  if(waitEl.textContent !== String(waitlist.length)) bumpScore(waitEl);

  filledEl.textContent = filled;
  waitEl.textContent = waitlist.length;

  // getElementsByClassName() — flag a team panel once it reaches 6/6
  const panels = document.getElementsByClassName("team-panel");
  for(let i = 0; i < panels.length; i++){
    const teamKey = panels[i].classList.contains("team-a") ? "A" : "B";
    const count = roster.filter(function(p){ return p.team === teamKey; }).length;
    if(count >= MAX_PER_TEAM){
      panels[i].classList.add("full");
    } else {
      panels[i].classList.remove("full");
    }
  }

  // getElementsByTagName() — stagger the reveal of every list row
  const rows = document.getElementsByTagName("li");
  for(let i = 0; i < rows.length; i++){
    rows[i].style.animationDelay = (i * 0.04) + "s";
  }
}

/* ---------------- reset the preferred-position field (getElementsByName) ---------------- */
function resetPositionField(){
  const posEls = document.getElementsByName("pPosition");
  if(posEls.length > 0) posEls[0].value = "Any";
}

/* ---------------- talk to Apps Script ---------------- */
function postAction(action, payload){
  if(!SCRIPT_URL || SCRIPT_URL.indexOf("PASTE_YOUR") !== -1){
    console.warn("SCRIPT_URL is not set yet — see SETUP.md to connect this to a Google Sheet.");
    return Promise.resolve({ sent: false, reason: "no-url" });
  }
  const params = Object.assign({ action: action }, payload);
  const body = new URLSearchParams(params);

  // Apps Script Web Apps don't send back CORS headers, so a normal
  // "cors" fetch reports failure even when the write succeeded server-side.
  // "no-cors" fires the request reliably; we just can't read the reply.
  return fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", body: body })
    .then(function(){ return { sent: true }; })
    .catch(function(err){
      console.error("Could not reach the Apps Script URL:", err);
      return { sent: false, reason: "network" };
    });
}

function loadStateFromSheet(){
  if(!SCRIPT_URL || SCRIPT_URL.indexOf("PASTE_YOUR") !== -1) return;

  fetch(SCRIPT_URL, { method: "GET" })
    .then(function(res){ return res.json(); })
    .then(function(data){
      if(!data || data.result !== "success") return;

      data.court.forEach(function(entry){
        const player = {
          name: entry.name, block: entry.block, contact: entry.contact,
          position: entry.position, team: entry.team, slot: Number(entry.slot)
        };
        roster.push(player);
        fillSlot(player.team, player.slot, player, true); // silent, no ball bounce
        addRosterRow(player);
      });

      data.waitlist.forEach(function(entry){
        waitlist.push({
          name: entry.name, block: entry.block,
          contact: entry.contact, position: entry.position
        });
      });

      clearRosterEmptyStateIfNeeded();
      renderWaitlistEmptyState();
      updateScoreboard();
    })
    .catch(function(err){
      console.warn("Could not load existing signups from the sheet (starting from an empty court):", err);
    });
}

/* ---------------- form submission ---------------- */
const form = document.getElementById("signupForm");
const joinBtn = document.getElementById("joinBtn");

form.addEventListener("submit", function(e){
  e.preventDefault();

  // getElementById() — read each field
  const name = document.getElementById("pName").value.trim();
  const block = document.getElementById("pBlock").value.trim();
  const contact = document.getElementById("pContact").value.trim();
  const posPref = document.getElementById("pPosition").value;

  if(name === "" || block === "" || contact === ""){
    showMsg("Please complete all fields before joining.", "error");
    return;
  }

  joinBtn.disabled = true;
  joinBtn.textContent = "Joining…";

  const courtFull = roster.length >= MAX_PER_TEAM * 2;
  let team, slotNum, syncPromise;
  const basePlayer = { name: name, block: block, contact: contact, position: posPref };

  if(courtFull){
    waitlist.push(basePlayer);
    renderWaitlistEmptyState();
    syncPromise = postAction("waitlist_add", basePlayer);
    showMsg("Court is full — " + name + " is on the waitlist.", "info");
  } else {
    team = chooseTeam();
    slotNum = findOpenSlot(team);

    if(slotNum === null){
      team = (team === "A") ? "B" : "A";
      slotNum = findOpenSlot(team);
    }

    if(slotNum === null){
      waitlist.push(basePlayer);
      renderWaitlistEmptyState();
      syncPromise = postAction("waitlist_add", basePlayer);
      showMsg("Court is full — " + name + " is on the waitlist.", "info");
    } else {
      const player = Object.assign({ team: team, slot: slotNum }, basePlayer);
      roster.push(player);
      fillSlot(team, slotNum, player);
      addRosterRow(player);
      syncPromise = postAction("join", Object.assign({ status: "Confirmed" }, player));

      const teamName = team === "A" ? "Ignite" : "Tide";
      showMsg(name + " is in! Team " + teamName + ", Position P" + slotNum + ".", "success");
    }
  }

  form.reset();
  resetPositionField();
  updateScoreboard();

  syncPromise.then(function(result){
    joinBtn.disabled = false;
    joinBtn.textContent = "🏐 Join Open Play";
    if(result.reason === "network"){
      showMsg("Saved on this page, but couldn't reach the sheet — check your internet or the Apps Script deployment.", "error");
    }
  });
});

/* ---------------- initial paint ---------------- */
document.getElementById("sessionInfo").textContent =
  "Next Open Play: " + nextSessionLabel() + " · Covered Court, DLSU-D";

updateScoreboard();
loadStateFromSheet();