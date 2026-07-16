import { useState } from "react";

const WIKI = "https://callofduty.fandom.com/wiki/";

const DATA = [
  {
    id: "waw", name: "World at War", ix: "01", year: "2008", sub: "The origin. Treyarch's first zombies — only Der Riese has a true quest.",
    maps: [
      { n: "Nacht der Untoten", q: "No main quest — survival only", noee: true, diff: 0, players: "1–4",
        blurb: "The map that started it all. No quest, no Pack-a-Punch, no perks. Pure survival in a bombed-out bunker.",
        easter: "Hidden song: shoot the radio to the right of the Mystery Box in the Help Room to trigger the track \"WTF\". (In later remasters, shoot the 9 red barrels outside for \"Undone\".)" },
      { n: "Verrückt", q: "No main quest — survival only", noee: true, diff: 0, players: "1–4",
        blurb: "The asylum. Introduced Perk-a-Colas and the power switch. No completable quest.",
        easter: "Hidden song \"Lullaby for a Dead Man\": flush one of the toilets three times." },
      { n: "Shi No Numa", q: "No main quest — survival only", noee: true, diff: 0, players: "1–4",
        blurb: "The Swamp of Death. Introduced the Wunderwaffe DG-2, the Zombie Monkeys round break, and the four-character crew. No main quest in the original.",
        easter: "Hidden song: shoot the four hanging pans inside the Fishing Hut." },
      { n: "Der Riese", q: "Fly Trap", url: "Fly_Trap", diff: 1, players: "1–4", reward: "Permanently unlocks Pack-a-Punch", accuracy: "High",
        blurb: "The Giant. The first-ever Zombies Easter egg. There's no cutscene reward — completing it simply unlocks the Pack-a-Punch teleporter sequence and plays a buzzing fly / teddy bear sound.",
        req: ["Power turned on (back room)", "Knowledge of all 3 teleporter locations", "Enough zombies alive to survive the link runs"],
        steps: [
          "<b>Turn on the power</b> in the rear of the map.",
          "Go to <b>Teleporter A, B or C</b>, stand on the pad and <b>activate it</b> to start the link timer.",
          "Sprint to the <b>mainframe</b> in the central courtyard and interact to <b>link that teleporter</b> before the timer runs out.",
          "<b>Repeat for all three teleporters.</b> Once all three are linked, the mainframe becomes the Pack-a-Punch.",
          "Stand on any linked teleporter and activate to be sent to <b>Pack-a-Punch</b> (available for ~30s per teleport).",
          "Pack-a-Punch a weapon to confirm. The fly swarm / bear sound marks the loop complete."],
        tips: ["Linking teleporters also lets you teleport for quick escapes mid-horde.", "Do this early — Pack-a-Punch access is the whole point of the map."] }
    ]
  },

  {
    id: "bo1", name: "Black Ops", ix: "02", year: "2010", sub: "Easter eggs become real questlines with reward cutscenes, starting with Ascension.",
    maps: [
      { n: "Kino der Toten", q: "No main quest", noee: true, diff: 0, players: "1–4",
        blurb: "The theater. The first map to feature teleporters tied to Pack-a-Punch as a core mechanic, plus the three teddy bears. No completable main quest.",
        easter: "Hidden song \"115\" by Elena Siegman: activate the three meteor rocks (one near spawn, one in the dressing room, one in the alley)." },
      { n: '"Five"', q: "No main quest", noee: true, diff: 0, players: "1–4",
        blurb: "The Pentagon, with JFK, Nixon, McNamara and Castro. Has a DEFCON/teleporter side activity and the Pentagon Thief, but no rewarded main quest.",
        easter: "Hidden song \"Won't Back Down\" by Eminem: activate three red phones around the map." },
      { n: "Ascension", q: "Casimir Mechanism", url: "Casimir_Mechanism", diff: 2, players: "Co-op (4 recommended)", reward: "Free perk drop + lore audio reels", accuracy: "Shape only", rand: true,
        blurb: "The Soviet cosmodrome. The first true rewarded main quest — free the trapped scientist Gersh by powering the Casimir Mechanism.",
        req: ["Power on", "Gersh Devices (from the Mystery Box) — central to the quest", "Lunar Landers to reach all areas", "Best done with 3–4 players for the simultaneous steps"],
        steps: [
          "Turn on the power and get the map running.",
          "Locate and <b>activate the hidden eclipse / focusing-stone objects</b> around the map to begin the sequence.",
          "Use <b>Gersh Devices</b> at the marked device pedestals to feed power into the mechanism.",
          "Complete the <b>lunar-lander and centrifuge steps</b> in order, coordinating across players.",
          "Finish the final activation to <b>free Gersh</b> and trigger the reward (a free Perk-a-Cola drop) and lore reels."],
        tips: ["Hold the early rounds — you need points for the box to fish for Gersh Devices.", "Camp the lander areas; the steps move you all over the map."] },
      { n: "Call of the Dead", q: "Ensemble Cast (co-op) / Stand-in (solo)", url: "Ensemble_Cast", diff: 2, players: "1 (Stand-in) or 4 (Ensemble Cast)", reward: "Vril Rod weapon + frees George Romero", accuracy: "Shape only", rand: true,
        blurb: "A horror-movie set with the celebrity cast (Romero, Buff, Rooker, Hardin, Cross) and the original WaW crew via radios. Free director George A. Romero, who roams the map as a mini-boss.",
        req: ["Power on", "Scavenger sniper / Wunderwaffe DG-2 (from the box)", "Cooperation to lead Romero into the water"],
        steps: [
          "Turn on the power and build access to the lighthouse and ship.",
          "<b>Free the V-R11</b> / gather the wonder weapons needed for the steps.",
          "Complete the <b>lighthouse and Vril-rod assembly</b> objectives in sequence.",
          "<b>Lure George Romero</b> into the electrified water / shock him per the final step to weaken and release him.",
          "Claim the <b>Vril Rod</b> reward and the achievement."],
        tips: ["Don't shoot George with normal bullets early — it only enrages and speeds him up.", "The V-R11 turns zombies human, key to controlling George."] },
      { n: "Shangri-La", q: "Time Travel Will Tell", url: "Time_Travel_Will_Tell", diff: 3, players: "Co-op (2+)", reward: "Focusing Stone + permanent Pack-a-Punch perk", accuracy: "Shape only", rand: true,
        blurb: "A tropical temple with the Primis-era crew. A puzzle-heavy quest involving the map's geyser/mine-cart traversal, the focusing stone, and time manipulation.",
        req: ["Power / map traversal unlocked", "The map's wonder weapons (31-79 JGb215 + Shrink Ray steps)", "2+ players for simultaneous switches"],
        steps: [
          "Open the map and reach the upper temple via geysers and mine carts.",
          "Complete the <b>eclipse / waterfall and pressure-plate</b> puzzles.",
          "Use the <b>Shrink Ray and the crystal objectives</b> to charge the focusing stone.",
          "Solve the <b>net-trap / quicksand and meteor</b> steps in order.",
          "Finish to receive the <b>Focusing Stone</b> reward and continue the Aether storyline."],
        tips: ["This is one of the most coordination-heavy BO1 quests — voice comms help.", "Several steps require two players standing on switches at once."] },
      { n: "Moon", q: "Richtofen's Grand Scheme", url: "Richtofen%27s_Grand_Scheme", diff: 3, players: "Co-op (recommended)", reward: "Richtofen takes control of the zombies (story-defining)", accuracy: "Shape only", rand: true,
        blurb: "Area 51 → the Moon base. The climax of the BO1 story: complete the \"Cryogenic Slumber Party\" setup, then Richtofen's Grand Scheme to swap souls and seize the Aether. Optionally help Maxis instead (\"Big Bang Theory\").",
        req: ["Hacker tool (picked up on the map)", "Wave Gun / box weapons", "P.E.S helmet awareness (vacuum sections)", "3–4 players strongly recommended"],
        steps: [
          "Travel through Area 51 to the Moon; turn on the power and grab the <b>Hacker</b>.",
          "Complete the <b>Cryogenic Slumber Party</b> setup (gather and place the canisters at the pyramid/M.P.D).",
          "Excavate by detonating the tunnels and route Richtofen's plan with the <b>Gersh Devices and switches</b>.",
          "Charge the <b>pyramid (M.P.D)</b> through the required steps.",
          "Choose your side: complete <b>Richtofen's Grand Scheme</b> (swap him into the Aether) — or Maxis' alternate path.",
          "Trigger the finale — three rockets strike Earth and Richtofen assumes control of the undead."],
        tips: ["Keep the P.E.S helmet up in vacuum zones or you'll suffocate.", "This quest ends the original timeline — it leads directly into Black Ops II's story."] }
    ]
  },

  {
    id: "bo2", name: "Black Ops II", ix: "03", year: "2012", sub: "The branching Maxis vs. Richtofen saga, plus Mob of the Dead and Origins.",
    maps: [
      { n: "TranZit", q: "Tower of Babble", url: "Tower_of_Babble", diff: 3, players: "Co-op (4 recommended)", reward: "Aligns the storyline with Maxis or Richtofen", accuracy: "Shape only", rand: true,
        blurb: "The bus route through the fog. Build the obelisk Tower and power it for either Maxis or Richtofen by feeding zombie souls into it.",
        req: ["Build the Turbine, Navcard, and key buildables", "Jet Gun / Galvaknuckles", "Electric Cherry / lots of perks", "Knowledge of the bus route + power station"],
        steps: [
          "Turn on the power at the Power Station and build the core buildables (Turbine etc.).",
          "Travel the bus route and <b>place EMP grenades / Turbines</b> at the lamp posts as directed.",
          "<b>Charge the Tower</b> by killing zombies near it after the lamps are linked.",
          "Choose a side — follow <b>Maxis'</b> instructions (galvaknuckle the EMP'd zombie) or <b>Richtofen's</b> (kill in the Tower's beam).",
          "Complete the final charge to lock in your faction's ending."],
        tips: ["Avenged Sevenfold's \"Carry On\" plays via three teddy bears around the route.", "The fog hides the Denizens — keep a light/turbine handy."] },
      { n: "Die Rise", q: "High Maintenance", url: "High_Maintenance", diff: 3, players: "Co-op (4 recommended)", reward: "Continues the Maxis/Richtofen branch", accuracy: "Shape only", rand: true,
        blurb: "The collapsing skyscrapers of China. Build the Trample Steam, feed the Tower (again Maxis vs. Richtofen), and use elevators and the Sliquifier.",
        req: ["Sliquifier (buildable wonder weapon)", "Trample Steam", "Ballistic knife + Sliquifier for steps", "Mahjong tile and shrine knowledge"],
        steps: [
          "Drop down, build the <b>Sliquifier</b> and the Trample Steam, turn on power.",
          "Find and align the <b>four mahjong-style symbols / shrine objects</b> as instructed.",
          "Use Trample Steams to <b>launch through the broken buildings</b> to required spots.",
          "Charge the objective for <b>Maxis or Richtofen</b> by killing zombies in the right state/location.",
          "Complete the final step to advance your chosen side."],
        tips: ["The Sliquifier's chain damage is your best high-round tool.", "Use the elevators as quick traps — they crush zombies."] },
      { n: "Mob of the Dead", q: "Pop Goes the Weasel  ·  No One Escapes Alive (fly the Icarus)", url: "Pop_Goes_the_Weasel", diff: 4, players: "1–4", reward: "Free perks + the Golden Spork; flying the Icarus completes the loop", accuracy: "Shape (plane parts vary)", rand: true,
        blurb: "Alcatraz with the gangster crew. Build the Icarus plane to escape, complete the bridge/electric-chair steps, then optionally feed the acid (Hell's Retriever → Redeemer) to reveal the true cycle.",
        req: ["Build the plane (parts spawn in 5 random spots — afterlife mode to grab some)", "Hell's Retriever → Redeemer tomahawk", "Blundergat → Acidgat / Vitriolic Withering", "Afterlife mechanic mastery"],
        steps: [
          "Build the <b>Icarus plane</b> from the five scattered parts, then fly to the bridge.",
          "On the bridge, complete the <b>electric-chair and Cerberus head</b> objectives.",
          "Upgrade the <b>Hell's Retriever into the Redeemer</b> by feeding it souls at the three dog locations.",
          "Use the afterlife mode to <b>activate the hidden steps</b> (cracking the wall code, plates, etc.).",
          "Complete <b>Pop Goes the Weasel</b> on the bridge; fly the plane again for <b>No One Escapes Alive</b> to close the time loop."],
        tips: ["The Blundergat → Acidgat is essential — pack-a-punch via the acid trap.", "Use afterlife strategically; you can revive teammates and reach locked switches."] },
      { n: "Buried", q: "Mined Games  ·  Richtofen's & Maxis' Endgame", url: "Mined_Games", diff: 3, players: "Co-op (2+)", reward: "Faction win; Endgame (Pylon) sets up the final allegiance", accuracy: "Shape only", rand: true,
        blurb: "The underground Western town with the giant Leroy and the Ghost witches. Choose Maxis or Richtofen one final time, then both factions' Endgame charges the Pylon.",
        req: ["Free/befriend Leroy the giant (give him candy/booze)", "Paralyzer (buildable)", "Subsurface Resonator + Time Bomb", "2 players for the simultaneous orb steps"],
        steps: [
          "Drop into the town, build the <b>Paralyzer</b> and free <b>Leroy</b> the giant to smash barriers.",
          "Power the map and complete the <b>maze / ghost-house</b> objectives.",
          "Charge the floating orbs for <b>Maxis or Richtofen</b> using the right kills and switches.",
          "Finish <b>Mined Games</b> for your side.",
          "Across maps, complete both sides' <b>Endgame</b> to activate the Pylon and decide the saga's victor."],
        tips: ["Leroy is your wrecking ball — feed him to befriend, punch him to enrage him onto zombies.", "The Paralyzer can also let you float — useful for some steps."] },
      { n: "Origins", q: "Little Lost Girl", url: "Little_Lost_Girl", diff: 4, players: "Co-op (2–3 ideal)", reward: "Reach Samantha — major story reset; finale cutscene", accuracy: "Verified (parts vary)", rand: true,
        blurb: "WWI France with the Primis crew, mud, giant robots and the Elemental Staffs. Build and upgrade all four staffs, then perform the ritual to free the little lost girl, Samantha. Budget 1–2 hours — it's one of the longest quests in the series.",
        req: ["All 6 generators powered", "Gramophone + Black Disc (disc spawns in one of three spots) to open the Crazy Place crafting table", "All 4 Elemental Staffs (Fire, Ice, Lightning, Wind) built, then upgraded to Ultimate form", "Maxis Drone + G-Strike grenades + the One Inch Punch / Thunder Fists"],
        steps: [
          "<b>Setup (Step 0):</b> power all generators, assemble the <b>Gramophone + Black Disc</b> to open the Crazy Place table, and build the <b>Maxis Drone</b> and <b>G-Strike</b> grenades.",
          "<b>Build all four staffs.</b> Each needs three parts (e.g. Fire: the ritual chest at Gen 6, shoot the plane over Excavation, and the Panzersoldat's drop on ~round 8), craft at its elemental statue, then take the crystal from the Crazy Place altar.",
          "<b>Get the One Inch Punch:</b> fill the four chests with 30 zombie souls each (keep the giant robot Odin off them or they reset).",
          "<b>Upgrade each staff to Ultimate</b> — four sub-steps per staff: a Crazy Place puzzle, a main-map puzzle, arranging the colored rings in Excavation, then charging it with kills around the staff.",
          "<b>Power the staffs:</b> place them and light the candles / power them in the required simultaneous sequence.",
          "Use the <b>Thunder Fists</b> and <b>G-Strike</b> to clear the marked steps and zombies.",
          "Place all four <b>Ultimate staffs</b> on the Crazy Place altars (where the crystals were) — \"Little Lost Girl\" completes here.",
          "<b>Optional finale (ends the game):</b> punch knight zombies with Thunder Fists so their souls open the rift, then drop in to watch the cutscene that frees Samantha."],
        tips: ["The robots' feet are temporary shelter and a fast way across the map.", "Start upgrading staffs the moment you build one — they're your best high-round weapons and it saves rounds.", "Part spawns (Black Disc, ring puzzles) vary per game — pair with a live guide for exact spots."] }
    ]
  },

  {
    id: "bo3", name: "Black Ops III", ix: "04", year: "2015", sub: "The Primis saga in full — bow upgrades, summoning keys, and the road to Revelations.",
    maps: [
      { n: "Shadows of Evil", q: "Apocalypse Averted", url: "Apocalypse_Averted", diff: 4, players: "Co-op (4 recommended)", reward: "Summon and defeat the Shadow Man's plan; obtain summoning key lore", accuracy: "Shape only", rand: true,
        blurb: "1940s Morg City with the noir crew and the Beast/Margwa monsters. Empower the gateworms, build the apothicon sword, and complete the Shadow Man's ritual.",
        req: ["Beast Mode traversal (grapple/scream)", "Apothicon Servant (buildable wonder weapon)", "Margwa heart melee weapon", "Pack-a-Punch + gateworms"],
        steps: [
          "Use <b>Beast Mode</b> to power the three districts and unlock the pods/rituals.",
          "Complete each district's <b>ritual</b> to grow the <b>gateworms</b>.",
          "Build the <b>Apothicon Servant</b> and upgrade the ritual altar.",
          "Feed the rituals and complete the <b>symbol / pod</b> steps for the Shadow Man.",
          "Perform the final summoning and finish <b>Apocalypse Averted</b>."],
        tips: ["Master Beast Mode early — it powers perks, the box, and traversal.", "The Margwa needs all three heads popped before the kill."] },
      { n: "The Giant", q: "Paradoxical Prologue (minor)", url: "Fly_Trap#Black_Ops_III", noee: true, diff: 1, players: "1–4",
        blurb: "A remaster of Der Riese opening the BO3 saga. No full rewarded main quest — just the classic teleporter link (a nod to the original Fly Trap) and a story-setup cutscene that plays on launch.",
        easter: "Link the three teleporters to the mainframe (as in Der Riese) to unlock Pack-a-Punch. The opening cutscene establishes Primis Richtofen's plan." },
      { n: "Der Eisendrache", q: "My Brother's Keeper", url: "My_Brother%27s_Keeper", diff: 3, players: "1–4", reward: "Cutscene — Primis erase Ultimis Dempsey; rockets destroy the Moon", accuracy: "Verified",
        blurb: "An Austrian castle with wonder-spheres and the four elemental bows. Upgrade a bow, free the Keeper, charge the ritual circles and fire the rockets at the Moon. One upgraded bow per player is needed for the late steps (just one in solo).",
        req: ["Wrath of the Ancients bow — feed 6 zombies to each of the 3 dragon heads (past Double Tap by the box, in the castle near Speed Cola, in the Undercroft by the pyramid)", "One upgraded elemental bow per player (Fire / Wolf / Storm / Void) — solo needs just one; all four in a private match", "Ragnarok DG-4 (buildable) — required for the boss teleport", "Juggernog + a strong setup; aim to finish bows before ~round 20"],
        steps: [
          "Turn on power and earn the <b>Wrath of the Ancients</b> bow by feeding the three dragon heads.",
          "<b>Upgrade your bow</b> via its element's puzzle (e.g. Storm/Lightning: shoot the weather vane and mountain symbols, do the zero-gravity wisp wall-run in the Undercroft, then electrify arrows from the sparking canisters and re-hit the pyres). Charge it in the pyramid box.",
          "With an upgraded bow held, re-equip <b>Wrath of the Ancients</b> and shoot the orbs above the Undercroft teleporter — a Margwa growl confirms it.",
          "Shoot the <b>wisps in the correct order</b>; when the teleporter glows purple, take it to <b>the past</b>.",
          "In the past, open the <b>935 box</b> for the Keeper's tablet; recover the <b>golden rod</b> from the crashed pod and place it under the knight's tomb to summon the <b>Keeper</b>.",
          "Charge the <b>three ritual circles</b> with kills — matching each circle's element to your bow (the screen tint tells you which). Build the <b>Ragnarok DG-4</b>.",
          "Place the soul canisters in the <b>pyramid room</b>, then set your Ragnarok on the pressure plate(s) to teleport to the <b>boss arena</b>.",
          "<b>Defeat the boss</b> — keep circling; when he charges his lightning attack, take cover behind a pillar.",
          "Insert the key at the <b>clock-tower terminal</b> — rockets fire and destroy the Moon. \"My Brother's Keeper\" completes with the cutscene."],
        tips: ["You only need one upgraded bow to finish solo, but all four are worth it for high rounds.", "The Ragnarok DG-4 doubles as mobility — slam to clear hordes.", "The Storm/Lightning bow is the easiest first upgrade and great crowd control."] },
      { n: "Zetsubou No Shima", q: "Seeds of Doubt", url: "Seeds_of_Doubt", diff: 4, players: "Co-op (4 recommended)", reward: "Defeat the giant Thrasher; story progression", accuracy: "Shape only", rand: true,
        blurb: "A Pacific island lab overrun with plants and the spider/Thrasher enemies. Grow the Skull of Nan Sapwe, manage the plant pods, and complete the underwater steps.",
        req: ["Grow plants with water buckets / zombie blood", "KT-4 (buildable acid wonder weapon)", "Skull of Nan Sapwe (upgraded)", "Masks for the spider-lair gas areas"],
        steps: [
          "Power the bunkers and grow the <b>guardian plant</b> with the bucket + zombie blood loop.",
          "Build the <b>KT-4</b> and upgrade it via the spider lair.",
          "Obtain and upgrade the <b>Skull of Nan Sapwe</b> through its steps.",
          "Complete the <b>seed / pod and underwater</b> objectives across the island.",
          "Trigger and defeat the boss sequence to finish <b>Seeds of Doubt</b>."],
        tips: ["Zombie Blood (from digging) lets you do steps invisibly — invaluable here.", "Keep the plants fed; they gate progression and drop perks."] },
      { n: "Gorod Krovi", q: "Love and War", url: "Love_and_War", diff: 4, players: "Co-op (recommended)", reward: "Cutscene; key Richtofen/Maxis lore", accuracy: "Shape only", rand: true,
        blurb: "A dragon-and-mech battlefield of Stalingrad. Tame the dragon, build the GKZ-45 Mk3, and complete the valve/soul-box steps against the Valkyrie drones.",
        req: ["Free and ride the baby dragon (feed it)", "GKZ-45 Mk3 (built from the Gauntlet + dragon network)", "Soul boxes + the dragon's strikes", "Strong perks for the boss waves"],
        steps: [
          "Power the map and complete the <b>dragon-freeing</b> steps to gain dragon strikes.",
          "Build the <b>GKZ-45 Mk3</b> via the Gauntlet of Siegfried network.",
          "Fill the required <b>soul boxes</b> and complete the valve/pylon steps.",
          "Use the dragon and Mk3 to destroy the <b>targets</b> in the boss sequence.",
          "Finish <b>Love and War</b> for the cutscene."],
        tips: ["The dragon is a powerful ally — direct its fire onto hordes.", "Manticore / valkyrie drones are the real threat; prioritize them."] },
      { n: "Revelations", q: "For The Good Of All  ·  A Better Tomorrow", url: "For_The_Good_Of_All", diff: 4, players: "Co-op (recommended)", reward: "Ends the Aether saga; A Better Tomorrow = 1,000,000 XP if all prior EEs done", accuracy: "Shape only", rand: true,
        blurb: "The convergence of every map in the Aether story, hosted by the Shadow Man and Dr. Monty. Gather the gateworms and summoning key, complete the corruption-engine steps, and end the cycle.",
        req: ["Apothicon Servant + summoning key knowledge", "Gateworms from the ritual areas", "Pack-a-Punch + the map's portals", "4 players for the simultaneous final steps"],
        steps: [
          "Open the portals and power the corruption engines across the merged map areas.",
          "Complete each engine's <b>defense / soul</b> step to claim the gateworms.",
          "Use the <b>summoning key</b> to capture the required souls.",
          "Complete the <b>symbol and pylon</b> steps with the Shadow Man.",
          "Finish <b>For The Good Of All</b> to end the Aether story. Completing every prior main EE first unlocks <b>A Better Tomorrow</b> (1,000,000 XP + RK5 starter)."],
        tips: ["This is a victory lap — bring your best high-round setup.", "A Better Tomorrow requires having finished all earlier main quests on your account."] }
    ]
  },

  {
    id: "bo4", name: "Black Ops 4", ix: "05", year: "2018", sub: "Two timelines — Chaos (Voyage, IX, Dead of the Night, Ancient Evil) and Aether (Blood, Classified, Alpha Omega, Tag der Toten).",
    maps: [
      { n: "Voyage of Despair", q: "Abandon Ship", url: "Abandon_Ship", diff: 4, players: "Co-op (recommended)", reward: "Chaos-story cutscene", accuracy: "Shape only", rand: true,
        blurb: "The RMS Titanic. The opening Chaos map — build the Kraken wonder weapon, gather the sentinel artifact's power, and complete the ship-wide ritual steps.",
        req: ["Kraken (buildable wonder weapon)", "Sentinel Artifact", "Pack-a-Punch in the boiler rooms", "Knowledge of the ship's decks"],
        steps: [
          "Power the ship and build the <b>Kraken</b> wonder weapon.",
          "Complete the <b>clock / time</b> steps and align the required symbols.",
          "Charge the <b>artifact</b> through the soul and beam objectives across decks.",
          "Complete the <b>ritual</b> steps in sequence.",
          "Trigger the finale to complete <b>Abandon Ship</b>."],
        tips: ["The ship is a maze — learn the deck transitions early.", "Elemental Pop-style perks and the Kraken carry high rounds."] },
      { n: "IX", q: "Venerated Warrior", url: "Venerated_Warrior", diff: 3, players: "Co-op (recommended)", reward: "Chaos-story cutscene", accuracy: "Shape only", rand: true,
        blurb: "A Roman gladiator colosseum with tiger gods and the gauntlet. Win the arena trials, empower the four animal-god statues, and complete the blood ritual.",
        req: ["Death of Orion / the map wonder weapons", "Four god-statue challenges (tiger, etc.)", "Blood vials from challenge rooms", "Pack-a-Punch"],
        steps: [
          "Power the colosseum and complete the <b>challenge / trial rooms</b> for each god.",
          "Fill the <b>blood vials</b> and place them at the statues.",
          "Complete the <b>tiger-statue and arena</b> steps in order.",
          "Empower the central altar via the required kills/symbols.",
          "Finish the ritual to complete <b>Venerated Warrior</b>."],
        tips: ["The challenge rooms reward strong items — clear them early.", "Watch for the Blightfather (giant) attached to certain steps."] },
      { n: "Blood of the Dead", q: "Most Escape Alive", url: "Most_Escape_Alive", diff: 5, players: "1–4", reward: "Aether-story cutscene; Primis Richtofen arc", accuracy: "Shape only", rand: true,
        blurb: "A reimagined Alcatraz (a spin on Mob of the Dead) with Primis. Use the Spectral Shield and the warden's gauntlet, complete the bridge and afterlife steps, and free the crew from the cycle.",
        req: ["Spectral Shield (buildable)", "Magmagat / Blundergat → upgraded", "Warden's Key + gauntlet steps", "Pack-a-Punch via the warden's house; afterlife-style mode"],
        steps: [
          "Build the <b>Spectral Shield</b> and power the prison.",
          "Complete the <b>three skull / clock</b> objectives around the island.",
          "Upgrade the <b>Blundergat</b> and charge the bridge sequence.",
          "Use the shield and gauntlet to complete the <b>plane / bridge</b> steps.",
          "Finish <b>Most Escape Alive</b> to break the loop."],
        tips: ["This is one of BO4's hardest — strong perks and the shield are mandatory.", "Learn the dog-round / spectral spots; many steps tie to them."] },
      { n: "Classified", q: "Main quest (reward cutscene)", url: "Classified", diff: 3, players: "1–4", accuracy: "Map page only",
        blurb: "A remaster of \"Five\" set in the Groom Lake / Pentagon facility with Primis. It has a main Easter egg with a cutscene reward (not listed under a single canonical name on the main-quest index). Steps mirror the Aether-saga style: power the teleporters, gather the required items, and complete the soul/ritual sequence.",
        req: ["Power on; teleporter network", "The map's wonder weapon (box)", "Soul-collection steps", "Pack-a-Punch"],
        steps: [
          "Power the facility and unlock the teleporter network.",
          "Complete the early <b>fuse / item</b> gathering steps.",
          "Charge the required objectives via soul collection.",
          "Complete the <b>symbol / device</b> sequence.",
          "Trigger the finale cutscene."],
        note: "Classified isn't listed on the wiki's main-quest index under a single name; treat these as the general shape and follow the linked map page (and a current video) for the exact, ordered steps.",
        tips: ["The Winter's Howl returns here — a strong crowd-control tool.", "Layout follows the old \"Five\" — use that knowledge for routing."] },
      { n: "Dead of the Night", q: "Trial by Ordeal", url: "Trial_by_Ordeal", diff: 4, players: "Co-op (recommended)", reward: "Chaos-story cutscene", accuracy: "Shape only", rand: true,
        blurb: "A gothic manor (with Scarlett's crew, voiced cast incl. Charles Dance/Kiefer Sutherland). Build the Alistair's Folly / Savage Impaler, manage the werewolf-style enemies, and complete the manor ritual.",
        req: ["Alistair's Folly (buildable wonder weapon)", "Savage Impaler / pitchfork", "Sentinel Artifact steps", "Silver / the manor's keys"],
        steps: [
          "Power the manor and grounds; build <b>Alistair's Folly</b>.",
          "Gather the required <b>keys / items</b> and open the locked rooms.",
          "Complete the <b>artifact and statue</b> objectives.",
          "Perform the <b>ritual</b> steps in order.",
          "Finish <b>Trial by Ordeal</b> for the cutscene."],
        tips: ["The Pack-a-Punch is gated behind early steps — prioritize it.", "Manage the Pestilent Manglers; they punish open play."] },
      { n: "Ancient Evil", q: "Greek Tragedy", url: "Greek_Tragedy", diff: 4, players: "Co-op (recommended)", reward: "Final Chaos-story cutscene", accuracy: "Shape only", rand: true,
        blurb: "Delphi, Greece — the Chaos finale with the Oracle, medusa-style enemies and the gods. Empower the relics, complete the constellation steps, and confront the divine forces.",
        req: ["Death of Orion / Ekat's wonder items", "Relics from the temple challenges", "Constellation / star alignment steps", "Pack-a-Punch"],
        steps: [
          "Power the ruins and complete the early <b>relic</b> objectives.",
          "Align the <b>constellation / star</b> steps as instructed.",
          "Charge the temple via soul and symbol steps.",
          "Complete the <b>Oracle / god</b> sequence.",
          "Finish <b>Greek Tragedy</b> to end the Chaos story."],
        tips: ["This closes the Chaos timeline — bring a tuned setup.", "The map is vertical; learn the temple routes for kiting."] },
      { n: "Alpha Omega", q: "Electromagnetic Awakening Party", url: "Electromagnetic_Awakening_Party", diff: 4, players: "1–4", reward: "Aether-story cutscene", accuracy: "Shape only", rand: true,
        blurb: "Nuketown / Camp Edward with both Primis and Ultimis crews. Build the Ray Gun Mk3, manage the perk-stealing enemies, and complete the bunker ritual.",
        req: ["Ray Gun Mark III (buildable)", "Galvaknuckles + the map's items", "Soul-collection steps", "Pack-a-Punch; knowledge of Nuketown houses"],
        steps: [
          "Power the camp and build the <b>Ray Gun Mk3</b>.",
          "Gather the required <b>parts / vials</b> around Nuketown and the bunker.",
          "Complete the <b>soul / device</b> charging steps.",
          "Perform the <b>symbol and beam</b> ritual sequence.",
          "Finish <b>Electromagnetic Awakening Party</b>."],
        tips: ["The Nuketown houses are tight — use the open camp for kiting.", "Watch the Brutus / perk-stealers; they undo your loadout fast."] },
      { n: "Tag der Toten", q: "Salvation Lies Above", url: "Salvation_Lies_Above", diff: 5, players: "1–4", reward: "Ends the Aether saga (the true finale)", accuracy: "Shape only", rand: true,
        blurb: "A reimagined Call of the Dead (Siberian facility) with Primis. The grand conclusion of the entire Aether storyline — free the souls, complete the lighthouse/ship steps, and end the cycle for good.",
        req: ["Tundra Gun / Wave Gun-style wonder weapon", "Sentinel Artifact + soul steps", "Lighthouse and ship traversal", "Strong perks for the long final fight"],
        steps: [
          "Power the facility and obtain the map's wonder weapon.",
          "Complete the <b>lighthouse and ship</b> objectives (echoing Call of the Dead).",
          "Charge the <b>artifact</b> via the soul-collection steps.",
          "Complete the <b>symbol / ritual</b> sequence in order.",
          "Trigger the finale to complete <b>Salvation Lies Above</b> — the end of the Aether saga."],
        tips: ["This is the canonical ending of the Aether story — savor it.", "One of the longer quests; stock up perks and an upgraded wonder weapon first."] }
    ]
  }
];

const totalMaps = DATA.reduce((a, g) => a + g.maps.length, 0);

function diffPips(d) {
  return (
    <div className="pips" aria-label={`difficulty ${d} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={"pip" + (i <= d ? " on" : "")} />
      ))}
    </div>
  );
}

function Sheet({ game, map, open, onClose }) {
  if (!map) return null;
  const url = WIKI + (map.url || map.n.replace(/[^A-Za-z0-9]/g, "_"));
  const q = encodeURIComponent(
    map.n + " " + game.name + " zombies easter egg " + (map.noee ? "song" : "guide")
  );
  const yt = "https://www.youtube.com/results?search_query=" + q;

  return (
    <div className={"sheet" + (open ? " open" : "")} role="dialog" aria-modal="true">
      <div className="sheet-top">
        <button className="back" aria-label="Back to map list" onClick={onClose}>
          ‹
        </button>
        <div>
          <div className="st">{map.n}</div>
          <div className="sq">{map.noee ? "No main quest" : map.q}</div>
        </div>
      </div>
      <div className="sheet-body">
        <div className="stat-strip">
          <div className="stat">
            <div className="k">Difficulty</div>
            <div className="v">{map.noee ? "—" : map.diff + " / 5"}</div>
          </div>
          <div className="stat">
            <div className="k">Players</div>
            <div className="v">{map.players || "1–4"}</div>
          </div>
          {map.accuracy ? (
            <div className="stat">
              <div className="k">Detail</div>
              <div className="v acc">{map.accuracy}</div>
            </div>
          ) : map.noee ? (
            <div className="stat">
              <div className="k">Type</div>
              <div className="v acc">Survival</div>
            </div>
          ) : null}
        </div>

        <p className="blurb">{map.blurb}</p>

        {map.reward && (
          <>
            <div className="sec r">Reward</div>
            <div className="tip" style={{ borderColor: "rgba(230,162,58,.3)" }}>
              {map.reward}
            </div>
          </>
        )}

        {map.noee && map.easter && (
          <>
            <div className="sec">Hidden / Side Easter Egg</div>
            <div className="tip">{map.easter}</div>
          </>
        )}

        {map.req && (
          <>
            <div className="sec">Required Setup</div>
            <ul className="req">
              {map.req.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </>
        )}

        {map.steps && (
          <>
            <div className="sec">Walkthrough — Major Steps</div>
            {map.rand && (
              <div className="note">
                <span className="ic">⚠</span>
                <div>
                  <b>Randomized steps.</b> Parts of this quest (symbol sequences,
                  item locations) change every game. Use these beats for the
                  overall flow, but follow the linked guide live for the exact
                  inputs in your match.
                </div>
              </div>
            )}
            <ol className="steps">
              {map.steps.map((s, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: s }} />
              ))}
            </ol>
          </>
        )}

        {map.note && (
          <div className="note">
            <span className="ic">ℹ</span>
            <div>{map.note}</div>
          </div>
        )}

        {map.tips && (
          <>
            <div className="sec">Field Tips</div>
            <div className="tips">
              {map.tips.map((t, i) => (
                <div className="tip" key={i}>
                  {t}
                </div>
              ))}
            </div>
          </>
        )}

        <div className="btnrow">
          <a className="vidbtn" href={yt} target="_blank" rel="noopener">
            <span className="pl">▶</span> Watch video guides
          </a>
          <a className="wikibtn" href={url} target="_blank" rel="noopener">
            Full written guide — CoD Wiki <span>↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ZombiesEEManual() {
  const [active, setActive] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMap, setSheetMap] = useState(null);

  const game = DATA[active];

  function openSheet(m) {
    setSheetMap(m);
    setSheetOpen(true);
  }
  function closeSheet() {
    setSheetOpen(false);
  }

  return (
    <div className="zee-manual">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Oswald:wght@400;500;600;700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .zee-manual{
          --bg:#0c0d0b; --bg2:#14150f; --panel:#191a13; --panel2:#20221a; --line:#2e3124;
          --bone:#e6e2d3; --bone-dim:#a39f8e; --mute:#6f6c5d;
          --c115:#3fe0c6; --c115-dim:#1f8f80; --blood:#c0392b; --blood-deep:#7a1f17;
          --amber:#e6a23a; --aether:#9b6bd8; --radius:3px;
          min-height:100vh;
          background:var(--bg);
          color:var(--bone);
          font-family:"Inter",system-ui,sans-serif;
          line-height:1.5;
          overflow-x:hidden;
          background-image:
            radial-gradient(120% 60% at 50% -10%, rgba(63,224,198,.07), transparent 60%),
            repeating-linear-gradient(0deg, rgba(255,255,255,.014) 0 1px, transparent 1px 3px);
        }
        .zee-manual *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}

        .zee-manual header{
          position:sticky;top:0;z-index:30;
          background:linear-gradient(180deg, rgba(12,13,11,.97), rgba(12,13,11,.86));
          backdrop-filter:blur(8px);
          border-bottom:1px solid var(--line);
          padding:14px 16px 0;
        }
        .zee-manual .brand{display:flex;align-items:center;gap:11px}
        .zee-manual .core{
          width:30px;height:30px;border-radius:50%;flex:0 0 auto;position:relative;
          background:radial-gradient(circle at 50% 40%, #bafff3 0%, var(--c115) 38%, var(--c115-dim) 70%, #073b35 100%);
          box-shadow:0 0 14px rgba(63,224,198,.65), inset 0 0 6px rgba(0,0,0,.4);
          animation:zee-pulse 2.6s ease-in-out infinite;
        }
        .zee-manual .core::after{content:"115";position:absolute;inset:0;display:grid;place-items:center;
          font:700 9px/1 "Space Mono",monospace;color:#04221d;letter-spacing:.5px}
        @keyframes zee-pulse{0%,100%{box-shadow:0 0 10px rgba(63,224,198,.5),inset 0 0 6px rgba(0,0,0,.4)}50%{box-shadow:0 0 20px rgba(63,224,198,.9),inset 0 0 6px rgba(0,0,0,.4)}}
        .zee-manual h1{font-family:"Black Ops One",cursive;font-size:19px;letter-spacing:.5px;margin:0;line-height:1.1;color:var(--bone)}
        .zee-manual h1 small{display:block;font-family:"Space Mono",monospace;font-weight:400;font-size:9.5px;letter-spacing:2.5px;color:var(--c115);margin-top:3px}

        .zee-manual .tabs{display:flex;gap:6px;overflow-x:auto;padding:13px 0 11px;margin:0 -16px;padding-left:16px;padding-right:16px;scrollbar-width:none}
        .zee-manual .tabs::-webkit-scrollbar{display:none}
        .zee-manual .tab{
          flex:0 0 auto;border:1px solid var(--line);background:var(--panel);
          color:var(--bone-dim);font-family:"Oswald",sans-serif;font-weight:600;
          font-size:12.5px;letter-spacing:.6px;text-transform:uppercase;
          padding:8px 13px;border-radius:var(--radius);cursor:pointer;white-space:nowrap;
          transition:.18s;position:relative;
        }
        .zee-manual .tab .yr{font-family:"Space Mono",monospace;font-size:9px;display:block;color:var(--mute);letter-spacing:0;margin-top:1px;text-align:left}
        .zee-manual .tab.active{color:#04221d;background:var(--c115);border-color:var(--c115);box-shadow:0 0 14px rgba(63,224,198,.4)}
        .zee-manual .tab.active .yr{color:#063c34}

        .zee-manual main{padding:18px 16px 60px;max-width:680px;margin:0 auto}
        .zee-manual .gtitle{font-family:"Oswald",sans-serif;text-transform:uppercase;letter-spacing:1px;font-weight:700;
          font-size:14px;color:var(--bone);display:flex;align-items:baseline;gap:8px;margin:6px 0 4px}
        .zee-manual .gtitle .ix{font-family:"Space Mono",monospace;font-size:11px;color:var(--c115)}
        .zee-manual .gsub{font-size:12px;color:var(--mute);margin:0 0 16px;font-family:"Space Mono",monospace;letter-spacing:.3px}

        .zee-manual .card{
          background:linear-gradient(180deg,var(--panel),var(--bg2));
          border:1px solid var(--line);border-left:3px solid var(--c115-dim);
          border-radius:var(--radius);padding:13px 14px;margin-bottom:11px;cursor:pointer;
          transition:.16s;position:relative;
        }
        .zee-manual .card:active{transform:scale(.992)}
        .zee-manual .card.noee{border-left-color:#3a3d2d;opacity:.92}
        .zee-manual .card .mname{font-family:"Oswald",sans-serif;font-weight:600;font-size:16.5px;letter-spacing:.3px;color:var(--bone);line-height:1.15}
        .zee-manual .card .qname{font-size:12.5px;color:var(--c115);margin-top:3px;font-weight:500}
        .zee-manual .card.noee .qname{color:var(--mute)}
        .zee-manual .card .row{display:flex;align-items:center;gap:10px;margin-top:9px;flex-wrap:wrap}
        .zee-manual .pips{display:flex;gap:3px;align-items:center}
        .zee-manual .pip{width:7px;height:7px;border-radius:1px;background:#33362708;border:1px solid var(--line)}
        .zee-manual .pip.on{background:var(--blood);border-color:var(--blood);box-shadow:0 0 5px rgba(192,57,43,.5)}
        .zee-manual .meta{font-family:"Space Mono",monospace;font-size:10px;color:var(--mute);letter-spacing:.4px;text-transform:uppercase}
        .zee-manual .go{margin-left:auto;color:var(--c115);font-size:18px;line-height:1;opacity:.8}
        .zee-manual .card.noee .go{color:var(--mute)}

        .zee-manual .sheet{position:fixed;inset:0;z-index:50;background:var(--bg);overflow-y:auto;
          transform:translateX(100%);transition:transform .26s cubic-bezier(.4,0,.2,1);
          -webkit-overflow-scrolling:touch}
        .zee-manual .sheet.open{transform:translateX(0)}
        .zee-manual .sheet-top{position:sticky;top:0;z-index:5;background:rgba(12,13,11,.96);backdrop-filter:blur(8px);
          border-bottom:1px solid var(--line);padding:11px 16px;
          display:flex;align-items:center;gap:12px}
        .zee-manual .back{border:1px solid var(--line);background:var(--panel);color:var(--bone);border-radius:var(--radius);
          width:38px;height:38px;flex:0 0 auto;font-size:18px;cursor:pointer;display:grid;place-items:center;line-height:1}
        .zee-manual .back:active{background:var(--panel2)}
        .zee-manual .sheet-top .st{font-family:"Oswald",sans-serif;font-weight:600;font-size:16px;letter-spacing:.4px;text-transform:uppercase;line-height:1.1}
        .zee-manual .sheet-top .sq{font-size:11px;color:var(--c115);font-family:"Space Mono",monospace}
        .zee-manual .sheet-body{padding:18px 16px 60px;max-width:680px;margin:0 auto}

        .zee-manual .stat-strip{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px}
        .zee-manual .stat{flex:1 1 0;min-width:84px;background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:9px 10px}
        .zee-manual .stat .k{font-family:"Space Mono",monospace;font-size:8.5px;letter-spacing:1.5px;color:var(--mute);text-transform:uppercase}
        .zee-manual .stat .v{font-family:"Oswald",sans-serif;font-weight:600;font-size:14px;color:var(--bone);margin-top:3px;letter-spacing:.3px}
        .zee-manual .stat .v.acc{color:var(--c115)}

        .zee-manual .blurb{font-size:14.5px;color:var(--bone-dim);margin:0 0 20px;border-left:2px solid var(--blood-deep);padding-left:13px}

        .zee-manual .sec{font-family:"Oswald",sans-serif;text-transform:uppercase;letter-spacing:1.4px;font-weight:700;font-size:12px;
          color:var(--c115);margin:24px 0 12px;display:flex;align-items:center;gap:9px}
        .zee-manual .sec::before{content:"";width:14px;height:1px;background:var(--c115);box-shadow:0 0 6px var(--c115)}
        .zee-manual .sec.r{color:var(--amber)}
        .zee-manual .sec.r::before{background:var(--amber);box-shadow:0 0 6px var(--amber)}

        .zee-manual ul.req{list-style:none;margin:0;padding:0;display:grid;gap:7px}
        .zee-manual ul.req li{display:flex;gap:10px;font-size:13.5px;color:var(--bone-dim);align-items:flex-start}
        .zee-manual ul.req li::before{content:"▣";color:var(--c115-dim);font-size:12px;line-height:1.4;flex:0 0 auto}

        .zee-manual ol.steps{list-style:none;margin:0;padding:0;counter-reset:s}
        .zee-manual ol.steps li{counter-increment:s;position:relative;padding:0 0 16px 40px;font-size:14px;color:var(--bone-dim)}
        .zee-manual ol.steps li::before{content:counter(s,decimal-leading-zero);position:absolute;left:0;top:-1px;
          font-family:"Space Mono",monospace;font-weight:700;font-size:12px;color:var(--c115);
          border:1px solid var(--c115-dim);border-radius:var(--radius);width:27px;height:24px;display:grid;place-items:center;
          background:rgba(63,224,198,.06)}
        .zee-manual ol.steps li::after{content:"";position:absolute;left:13px;top:25px;bottom:2px;width:1px;background:var(--line)}
        .zee-manual ol.steps li:last-child::after{display:none}
        .zee-manual ol.steps li b{color:var(--bone);font-weight:600}

        .zee-manual .note{background:rgba(230,162,58,.07);border:1px solid rgba(230,162,58,.3);border-radius:var(--radius);
          padding:12px 13px;font-size:12.5px;color:var(--amber);margin:18px 0;display:flex;gap:10px;align-items:flex-start}
        .zee-manual .note b{color:#f3c073}
        .zee-manual .note .ic{flex:0 0 auto;font-size:14px;line-height:1.3}

        .zee-manual .tips{display:grid;gap:8px}
        .zee-manual .tip{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:10px 12px;font-size:13px;color:var(--bone-dim)}
        .zee-manual .tip b{color:var(--c115);font-weight:600}

        .zee-manual .btnrow{display:grid;gap:10px;margin-top:24px}
        .zee-manual .vidbtn{display:flex;align-items:center;justify-content:center;gap:10px;
          background:var(--panel);color:var(--bone);border:1px solid var(--line);border-radius:var(--radius);
          padding:14px;font-family:"Oswald",sans-serif;font-weight:600;letter-spacing:.8px;text-transform:uppercase;
          font-size:13px;text-decoration:none}
        .zee-manual .vidbtn .pl{color:#ff3b30;font-size:13px;text-shadow:0 0 8px rgba(255,59,48,.5)}
        .zee-manual .vidbtn:active{background:var(--panel2)}
        .zee-manual .wikibtn{display:flex;align-items:center;justify-content:center;gap:9px;
          background:var(--blood);color:#fff;border:1px solid var(--blood);border-radius:var(--radius);
          padding:14px;font-family:"Oswald",sans-serif;font-weight:600;letter-spacing:.8px;text-transform:uppercase;
          font-size:13px;text-decoration:none;box-shadow:0 0 18px rgba(192,57,43,.3)}
        .zee-manual .wikibtn:active{background:var(--blood-deep)}
        .zee-manual .wikibtn span{font-family:"Space Mono",monospace;font-size:14px}

        .zee-manual .intro{background:linear-gradient(180deg,var(--panel),var(--bg2));border:1px solid var(--line);
          border-left:3px solid var(--amber);border-radius:var(--radius);padding:13px 14px;margin-bottom:18px;font-size:12.5px;color:var(--bone-dim)}
        .zee-manual .intro b{color:var(--amber)}
        .zee-manual footer{text-align:center;padding:26px 16px 30px;color:var(--mute);
          font-family:"Space Mono",monospace;font-size:10px;letter-spacing:.6px;line-height:1.7}
        @media (prefers-reduced-motion:reduce){
          .zee-manual .core{animation:none}.zee-manual .sheet{transition:none}
        }
      `}</style>

      <header>
        <div className="brand">
          <div className="core" aria-hidden="true" />
          <h1>
            Easter Egg Field Manual
            <small>WORLD AT WAR → BLACK OPS 4 // MAIN QUESTS</small>
          </h1>
        </div>
        <nav className="tabs" aria-label="Select game">
          {DATA.map((g, i) => (
            <button
              key={g.id}
              className={"tab" + (i === active ? " active" : "")}
              onClick={() => {
                setActive(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {g.name}
              <span className="yr">{g.year}</span>
            </button>
          ))}
        </nav>
      </header>

      <main>
        <div className="gtitle">
          <span className="ix">{game.ix}</span>
          {game.name}
        </div>
        <p className="gsub">{game.sub}</p>

        {active === 0 && (
          <div className="intro">
            <b>How to use this manual.</b> Each entry gives the quest name, setup,
            major beats and reward. Open any map for two buttons at the bottom:{" "}
            <b>Watch video guides</b> (the best way to see the actual map visuals
            in motion) and the <b>full written guide</b> on the CoD Wiki. Steps
            that are <b>randomized every match</b> (symbol orders, part spawns) are
            flagged — follow a live video for those exact inputs.
          </div>
        )}

        {game.maps.map((m, j) => (
          <div
            key={j}
            className={"card" + (m.noee ? " noee" : "")}
            onClick={() => openSheet(m)}
          >
            <div className="mname">{m.n}</div>
            <div className="qname">{m.q}</div>
            <div className="row">
              {m.noee ? (
                <span className="meta">No quest · {m.players || "1–4"}</span>
              ) : (
                <>
                  {diffPips(m.diff)}
                  <span className="meta">{m.players}</span>
                </>
              )}
              <span className="go">›</span>
            </div>
          </div>
        ))}
      </main>

      <footer>
        FIELD MANUAL // 5 GAMES · {totalMaps} MAPS
        <br />
        Major-beat reference. Verify randomized steps with a live guide.
        <br />
        Source: Call of Duty Wiki (Fandom) · Not affiliated with Activision/Treyarch.
      </footer>

      <Sheet game={game} map={sheetMap} open={sheetOpen} onClose={closeSheet} />
    </div>
  );
}
