import { useState, useMemo } from "react";
import { Search, MapPin, Clock, DollarSign, Star, Navigation, ChevronDown, ChevronUp, X } from "lucide-react";

// ── DATA ─────────────────────────────────────────────────────────────────────

const PORTS = [
  {
    id: "nassau",
    mapContext: "Nassau, Bahamas",
    name: "Nassau",
    flag: "🇧🇸",
    subtitle: "Bahamas",
    day: "Day 2 · Mon May 18",
    arrive: "9:00 AM",
    depart: "5:00 PM",
    note: null,
    items: [
      // ATTRACTIONS
      { id: 1, cat: "attraction", name: "Parliament Square", desc: "Iconic pink colonial-style government buildings at the heart of Nassau. One of the most photographed spots in the Bahamas.", price: "Free", hours: "Always open (exterior)", walk: true, rating: "4.5", tags: ["Historic", "Photo stop"] },
      { id: 2, cat: "attraction", name: "Nassau Straw Market", desc: "Bustling open-air market with thousands of handmade crafts, woven hats, bags, conch jewelry, and wood carvings. Bring small bills — prices are negotiable. Avoid 10 AM–2 PM peak hours.", price: "Free entry", hours: "Daily 8 AM – 8 PM", walk: true, rating: "3.5", tags: ["Shopping", "Local crafts", "Cash preferred"] },
      { id: 3, cat: "attraction", name: "Queen's Staircase", desc: "66 steps carved by hand from solid limestone in 1793–94. Named after Queen Victoria. Lush tropical foliage surrounds the staircase leading up to Fort Fincastle.", price: "Free", hours: "Daily 8 AM – 5 PM", walk: true, rating: "4.0", tags: ["Historic", "Scenic"] },
      { id: 4, cat: "attraction", name: "Fort Fincastle", desc: "Reached via the Queen's Staircase. Built in 1793 and shaped like a paddle-wheel steamboat. Offers panoramic views of the harbor and Paradise Island. Includes a water tower.", price: "$3.30/adult", hours: "Daily 8 AM – 4 PM", walk: true, rating: "4.0", tags: ["Historic", "Views"] },
      { id: 5, cat: "attraction", name: "Pirates of Nassau Museum", desc: "Interactive museum bringing Nassau's pirate golden age to life. Features a life-sized replica of a pirate ship interior, period costumes, and dioramas. Family-friendly.", price: "$14/adult · $7/child (4–17)", hours: "Mon–Sat 8:30 AM–5:30 PM · Sun 9 AM–2 PM", walk: false, rating: "4.5", tags: ["Museum", "Family", "15-min taxi"] },
      { id: 6, cat: "attraction", name: "Atlantis Paradise Island", desc: "World-famous mega-resort with a massive water park, marine habitat (Aquaventure), casino, and 40+ restaurants and bars. Day passes required — book in advance. The Dig is a free-access aquarium within the resort.", price: "~$170/adult · ~$120/child (day pass)", hours: "Daily 9 AM – 6 PM (water park)", walk: false, rating: "4.0", tags: ["Water park", "Family", "20-min taxi", "Book ahead"] },
      { id: 7, cat: "attraction", name: "The Retreat Garden", desc: "11-acre botanical garden featuring one of the world's finest collections of palms (90+ species). Peaceful and uncrowded. Guided tours available.", price: "$12/adult · $6/child · $9/senior", hours: "Mon, Wed & Fri 9 AM – 5 PM", walk: false, rating: "4.5", tags: ["Nature", "15-min taxi"] },
      // RESTAURANTS
      { id: 8, cat: "restaurant", name: "Arawak Cay Fish Fry", desc: "The most authentic Bahamian dining experience. A cluster of colorful shacks serving fresh conch salad, conch fritters, fried fish, peas & rice, and macaroni. Loud, fun, and local.", price: "$15–25/person", hours: "Daily 10 AM – 10 PM (closed Mondays)", walk: false, rating: "4.5", tags: ["Local", "Seafood", "Cash friendly", "Jitney bus #10"] },
      { id: 9, cat: "restaurant", name: "Café Matisse", desc: "One of Nassau's oldest and most respected restaurants. International seafood menu with a Bahamian twist — pappardelle with shrimp and lobster in pecorino cream is a standout. Patio dining available.", price: "$$$", hours: "Lunch & Dinner (closed Sun–Mon)", walk: true, rating: "4.5", tags: ["Upscale", "Seafood", "Patio"] },
      { id: 10, cat: "restaurant", name: "Dune", desc: "French-Asian-Bahamian fusion restaurant. Roasted Nassau Grouper and Bahamian Lobster Flatbread are highly rated. Beautiful water views.", price: "$$$$", hours: "Lunch & Dinner daily", walk: false, rating: "4.5", tags: ["Fusion", "Views", "Fine dining"] },
      { id: 11, cat: "restaurant", name: "Graycliff Restaurant", desc: "Nassau's most celebrated restaurant. Award-winning French-Bahamian cuisine, an extraordinary wine cellar, and live piano. 5-star experience in a historic colonial mansion on West Hill Street.", price: "$$$$", hours: "Lunch & Dinner daily", walk: false, rating: "5.0", tags: ["Fine dining", "Historic", "Reservations recommended", "15-min taxi"] },
      { id: 12, cat: "restaurant", name: "Chop House at Baha Mar", desc: "By acclaimed Chef Marcus Samuelsson. Upscale Bahamian dining on Cable Beach. Known for conch croquettes, island seafood rice, and exceptional cocktails.", price: "$$$$", hours: "Dinner nightly", walk: false, rating: "4.5", tags: ["Fine dining", "Cable Beach", "Taxi required"] },
      // BEACHES
      { id: 13, cat: "beach", name: "Junkanoo Beach", desc: "The closest beach to the cruise pier — about 10–15 minutes on foot. Calm, clean water with a lively atmosphere, beach bars, restrooms, and showers. Great for a quick beach stop without committing to transport.", price: "Free", hours: "Open daily", walk: true, rating: "3.5", tags: ["Closest to port", "Beach bars", "Calm water"] },
      { id: 14, cat: "beach", name: "Cabbage Beach", desc: "Consistently rated the best beach in the Nassau area. 2 miles of pristine white sand on Paradise Island with crystal-clear turquoise water. Umbrella and chair rentals available. $6 parking.", price: "Free · Chairs/umbrellas for rent", hours: "Open daily", walk: false, rating: "5.0", tags: ["Top rated", "Paradise Island", "20-min taxi"] },
      { id: 15, cat: "beach", name: "Cable Beach", desc: "3+ miles of white sand about 6 miles west of Nassau. Excellent water sports (jet ski, parasailing, kayak). Home to Baha Mar resort with 45+ food and drink options nearby.", price: "Free · Water sports fees vary", hours: "Open daily", walk: false, rating: "4.0", tags: ["Long beach", "Water sports", "20-min taxi"] },
      { id: 16, cat: "beach", name: "Saunders Beach", desc: "Family-friendly public beach with excellent facilities. Less crowded than Cable Beach. Clean and calm.", price: "Free", hours: "Open daily", walk: false, rating: "4.0", tags: ["Family-friendly", "15-min taxi"] },
      // SHOPPING
      { id: 17, cat: "shopping", name: "Bay Street Shops", desc: "Nassau's main commercial strip lined with duty-free stores, souvenir shops, jewelry retailers, and local boutiques. Walkable from the port and easy to browse.", price: "Varies", hours: "Daily ~9 AM – 6 PM", walk: true, rating: null, tags: ["Duty-free", "Walkable"] },
      { id: 18, cat: "shopping", name: "Crystal Court at Atlantis", desc: "High-end luxury retail inside Atlantis — Bulgari, Gucci, Cartier, Versace and more. Duty-free pricing.", price: "Luxury", hours: "Daily 10 AM – 8 PM", walk: false, rating: null, tags: ["Luxury", "Duty-free", "Paradise Island"] },
      { id: 19, cat: "shopping", name: "Marina Village at Atlantis", desc: "Colorful Bahamian-style shopping village along a scenic marina. Mix of upscale boutiques, local gifts, and dining options.", price: "Varies", hours: "Daily 10 AM – 6 PM", walk: false, rating: null, tags: ["Boutiques", "Scenic", "Paradise Island"] },
    ]
  },
  {
    id: "princess",
    mapContext: "Princess Cays, Eleuthera, Bahamas",
    name: "Princess Cays",
    flag: "🏝️",
    subtitle: "Bahamas (Private Island)",
    day: "Day 3 · Tue May 19",
    arrive: "8:00 AM",
    depart: "4:00 PM",
    note: null,
    items: [
      // BEACHES
      { id: 20, cat: "beach", name: "Little Bay Beach", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "The largest and most popular beach zone on Princess Cays. Located at the north end with live music during peak hours. Free lounge chairs. Best for being in the middle of the action.", price: "Free (chairs) · Umbrellas $25/ea", hours: "Open daily while ship is in port", walk: true, rating: "4.0", tags: ["Largest beach", "Live music", "Free chairs"] },
      { id: 21, cat: "beach", name: "Serenity Beach", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Adults-only section at the south end of the island. Quieter and more relaxed than Little Bay. Same beautiful water but fewer families and children.", price: "Free (chairs) · Umbrellas $25/ea", hours: "Open daily while ship is in port", walk: true, rating: "4.5", tags: ["Adults only", "Quiet", "South end"] },
      { id: 22, cat: "beach", name: "Bungalow Beach", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Private bungalow rental area. Exclusive to guests with reserved bungalows. Stunning water views and a more secluded setting.", price: "Bungalow: $229.95 (up to 4 people)", hours: "Open daily while ship is in port", walk: true, rating: "4.5", tags: ["Private rental", "Premium", "Priority tender included"] },
      { id: 23, cat: "beach", name: "Watersports Beach", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Dedicated zone for water activity rentals and departures — snorkeling, kayaks, banana boats, paddleboards, and aqua bikes all launch from here.", price: "See activities", hours: "Open daily while ship is in port", walk: true, rating: "4.0", tags: ["Water sports hub"] },
      // FOOD
      { id: 24, cat: "restaurant", name: "BBQ Lunch Buffet (Included)", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Complimentary buffet for all passengers. Menu includes grilled chicken, BBQ ribs, fish, beef burgers, hot dogs, salad bar, tropical fruit, brownies, and cookies. Water, lemonade, and iced tea included.", price: "FREE (included)", hours: "11:30 AM – 1:30 PM", walk: true, rating: "4.0", tags: ["Included", "BBQ", "All passengers"] },
      { id: 25, cat: "restaurant", name: "Island Bars (5 locations)", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Bahia Bar, Coconut Bar, Banana Beach Bar, Reef Runner Bar, and George's Bar. All serve cocktails, beer, wine, and soft drinks. Princess Plus/Premier beverage packages apply here.", price: "Charged to shipboard account", hours: "Open daily while in port", walk: true, rating: null, tags: ["Drinks", "Cashless", "Package accepted"] },
      // ACTIVITIES
      { id: 26, cat: "activity", name: "Snorkeling", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Most popular activity on Princess Cays. Rental gear includes mask, fins, and snorkel. Clear shallow water with tropical fish visible from the beach. Water shoes recommended for rocky entry points.", price: "$19.95/person", hours: "Available all day", walk: true, rating: "4.5", tags: ["Most popular", "Gear included"] },
      { id: 27, cat: "activity", name: "Ocean Kayak", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "2-person kayaks for exploring the cays coastline at your own pace. Rental by the hour.", price: "$19.95/person/hour", hours: "Available all day", walk: true, rating: "4.0", tags: ["2-person", "Self-guided"] },
      { id: 28, cat: "activity", name: "Banana Boat Ride", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Thrilling 15-minute group ride on an inflatable banana-shaped boat towed by a speedboat. Fun for all ages.", price: "$19.95/person", hours: "Available all day", walk: true, rating: "4.0", tags: ["Thrill", "Group", "15 min"] },
      { id: 29, cat: "activity", name: "Stand-Up Paddleboard", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Hourly SUP rentals from Watersports Beach. Calm shallow water makes it beginner-friendly.", price: "$20–30/hour", hours: "Available all day", walk: true, rating: "4.0", tags: ["Beginner friendly", "Hourly"] },
      { id: 30, cat: "activity", name: "Aqua Bikes", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Pedal-powered water bikes — a unique and fun way to explore the shoreline.", price: "Mid-$20s/hour", hours: "Available all day", walk: true, rating: "4.0", tags: ["Unique", "Relaxing"] },
      { id: 31, cat: "activity", name: "Guided Bike Tour", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "90-minute organized bike tour of Princess Cays with a guide covering the island's highlights.", price: "$30/person", hours: "Scheduled departures", walk: true, rating: "4.0", tags: ["Guided", "90 min", "Island tour"] },
      { id: 32, cat: "activity", name: "Private Bungalow", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Fully equipped private beach bungalow for up to 4 guests. Includes A/C, outdoor lounge chairs, cooler stocked with snacks and soft drinks, snorkel gear, float rentals, beach towels, and priority tender boarding.", price: "$229.95 (up to 4) · Sanctuary $260 (adults)", hours: "Full day", walk: true, rating: "5.0", tags: ["Premium", "A/C", "Priority tender", "Pre-book essential"] },
      // SHOPPING
      { id: 33, cat: "shopping", name: "Craft Market", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Local artisan vendors selling sea glass and shell jewelry, handwoven items, sterling silver pieces, and Bahamian crafts. Located just outside the resort area. Cash required — many vendors don't accept cards.", price: "Varies · Cash only", hours: "Open when ship is in port", walk: true, rating: "4.0", tags: ["Local artisans", "Cash only", "Handmade"] },
      { id: 34, cat: "shopping", name: "Bahama Treasures & Tropical Treasure Shop", mapQuery: "Princess Cays, Eleuthera, Bahamas", desc: "Two on-island gift shops. Bahama Treasures carries Princess logo merchandise and tropical apparel. Tropical Treasure has themed souvenirs for kids and adults. Charged to shipboard account.", price: "Varies", hours: "Open when ship is in port", walk: true, rating: null, tags: ["Souvenirs", "Cashless"] },
    ]
  },
  {
    id: "amber",
    mapContext: "Puerto Plata, Dominican Republic",
    name: "Amber Cove",
    flag: "🇩🇴",
    subtitle: "Dominican Republic",
    day: "Day 5 · Thu May 21",
    arrive: "8:00 AM",
    depart: "5:00 PM",
    note: null,
    items: [
      // ATTRACTIONS
      { id: 35, cat: "attraction", name: "Port Pool Complex", mapQuery: "Amber Cove Cruise Port, Puerto Plata, Dominican Republic", desc: "300,000-gallon resort-style pool with waterslides, lazy river, swim-up bar, free lounge chairs, and hammocks — all at the cruise port. No taxi needed. Arrives early for best chairs.", price: "Free (port entry)", hours: "Open while ship is in port", walk: true, rating: "4.5", tags: ["On-site", "No transport needed", "Waterslides", "Lazy river"] },
      { id: 36, cat: "attraction", name: "Dominican Amber Museum", desc: "World's largest amber collection inside a beautiful Victorian mansion in Puerto Plata. Features amber with preserved ancient insects, plants, and fossils. 20–30 minute visit. On-site gift shop.", price: "$3–4 USD (200 DOP)", hours: "Mon–Sat 9 AM – 5 PM", walk: false, rating: "4.0", tags: ["Museum", "20 min", "$20 taxi round-trip"] },
      { id: 37, cat: "attraction", name: "Fort San Felipe (1577)", desc: "Oldest Spanish fortress in the New World, built to defend against pirates. Cannons, military artifacts, and panoramic views of the coast. Audio guide in English included.", price: "$2–3 USD (100 DOP)", hours: "Tue–Sun 9 AM – 5 PM", walk: false, rating: "4.5", tags: ["Historic", "Views", "Audio guide", "$20 taxi round-trip"] },
      { id: 38, cat: "attraction", name: "Damajagua Falls (27 Charcos)", desc: "27 stunning natural cascading waterfalls with crystal-clear pools for jumping and sliding. Choose 7-falls (~2.5 hrs) or 12-falls option. Physically demanding — not for the faint of heart. Water shoes essential.", price: "$9–10 entry · Guided tours $58–120", hours: "8 AM – 3 PM", walk: false, rating: "5.0", tags: ["Adventure", "Physically demanding", "2.5–5 hrs", "Top rated"] },
      { id: 39, cat: "attraction", name: "Mount Isabel Cable Car", desc: "Caribbean's only cable car ascending to 2,565 ft with a Christ the Redeemer statue and 35-acre botanical garden. Stunning views — visit early before clouds roll in. Note: verify operational status before visiting (intermittent closures reported).", price: "~$70/person (via tour)", hours: "Morning to afternoon", walk: false, rating: "4.0", tags: ["Views", "Unique", "Verify open", "30-min drive"] },
      { id: 40, cat: "attraction", name: "Ocean World Adventure Park", desc: "Largest man-made dolphin habitat in the Caribbean. Also features sea lions, sharks, stingrays, birds, an aquarium, and waterslides. Highly rated for cleanliness and staff. Swim-with-dolphins experiences available.", price: "Day pass + activities vary · Buffet $14/adult", hours: "9 AM – 6 PM", walk: false, rating: "4.5", tags: ["Marine life", "Family", "Full day recommended"] },
      { id: 41, cat: "attraction", name: "Downtown Puerto Plata Walk", desc: "Colorful Parque Central, the famous Umbrella Street canopy (perfect for photos), Cathedral of St. Philip, cobblestone lanes with artisan crafts, and colonial architecture. 45–90 min self-guided walk.", price: "Free", hours: "Daytime", walk: false, rating: "4.0", tags: ["Self-guided", "Photo ops", "Umbrella Street", "$20 taxi round-trip"] },
      { id: 42, cat: "attraction", name: "Monkeyland Safari", desc: "Interactive monkey sanctuary where soft, gentle monkeys roam freely. 4.5-hour experience including guide and transport. Especially popular with families. Combo tours available with waterfalls or buggy rides.", price: "From $69/person", hours: "Scheduled tours", walk: false, rating: "4.5", tags: ["Family", "Animals", "4.5 hrs", "Tour required"] },
      // RESTAURANTS
      { id: 43, cat: "restaurant", name: "Coco Caña (Port)", mapQuery: "Coco Cana Amber Cove, Puerto Plata, Dominican Republic", desc: "Main restaurant at Amber Cove. Poolside and oceanfront Victorian-style seating. Caribbean and international menu with generous portions. Piña Coladas and frozen cocktails are a highlight.", price: "Mains $14–21 · Cocktails $8+", hours: "Open while ship is in port", walk: true, rating: "4.1", tags: ["On-site", "Caribbean", "Scenic seating"] },
      { id: 44, cat: "restaurant", name: "Port Bars (4 locations)", mapQuery: "Amber Cove Cruise Port, Puerto Plata, Dominican Republic", desc: "Cafe Cibao, Sky Bar, Cabana Bar, and Coco Caña Pool Lounge. All serve food and cocktails throughout the day.", price: "Varies", hours: "Open while ship is in port", walk: true, rating: null, tags: ["On-site", "Casual", "Multiple options"] },
      { id: 45, cat: "restaurant", name: "Casa 40 (Puerto Plata)", desc: "Charming colorful restaurant just 50 meters from Parque Central. International menu — burgers, crepes, shrimp, salads, vegetarian options. Great ambiance at excellent value.", price: "$$", hours: "11:30 AM – 11 PM · 9 AM weekends", walk: false, rating: "4.5", tags: ["Local", "Downtown", "Good value", "Taxi required"] },
      // BEACHES
      { id: 46, cat: "beach", name: "Amber Cove Port Beach", mapQuery: "Amber Cove Cruise Port, Puerto Plata, Dominican Republic", desc: "Right at the port. Free lounge chairs and hammocks included. Umbrellas $22/day. Clear water — some rocks at the direct entry point, easier 50 ft either side. Arrive early for best spots. Praised for seclusion and service.", price: "Free (chairs) · Umbrellas $22", hours: "Open while ship is in port", walk: true, rating: "4.0", tags: ["On-site", "No transport", "Water shoes helpful"] },
      { id: 47, cat: "beach", name: "La Playita & Teco Beach", desc: "Two small local beaches adjacent to the port. La Playita is a short walk; Teco Beach is a bit further. Authentic local atmosphere and beautiful views. Good for a quiet morning swim.", price: "Free", hours: "Open daily", walk: true, rating: "4.0", tags: ["Local", "Walkable", "Authentic"] },
      { id: 48, cat: "beach", name: "Costambar Beach", desc: "Calm turquoise water in a quiet, safe residential community 4 km from port. Quieter and less touristy. Multiple on-site restaurants. Activities include paddleboarding, snorkeling, and volleyball.", price: "Free · Chairs/umbrellas rentable", hours: "Open daily", walk: false, rating: "4.5", tags: ["Quiet", "15-min taxi", "~$10 taxi", "Multiple restaurants"] },
      { id: 49, cat: "beach", name: "Playa Dorada (Golden Beach)", desc: "1.9 km of beautiful white sand adjacent to Blue JackTar resort. Crystal-clear water with excellent amenities — cafes, loungers, showers, changing rooms. Water sports available. Day passes required for resort beach access.", price: "Day pass required (book ahead)", hours: "Open daily", walk: false, rating: "4.5", tags: ["Beautiful", "10-min taxi", "Amenities", "Book ahead"] },
      { id: 50, cat: "beach", name: "Sosúa Beach & Snorkeling", desc: "Excellent snorkeling at multiple sites including The Canyon (deep crevice), Cabezos (rocky formations), and Sosúa Bay (calm, beginner-friendly). Highly praised guides. 30–45 min drive — best as a dedicated outing.", price: "Snorkel tour ~$40–60/person", hours: "Morning tours recommended", walk: false, rating: "4.5", tags: ["Snorkeling", "30-min drive", "Guided recommended"] },
      // SHOPPING
      { id: 51, cat: "shopping", name: "Dufry Duty-Free (Port)", mapQuery: "Amber Cove Cruise Port, Puerto Plata, Dominican Republic", desc: "First shop upon entering Amber Cove. Large selection of spirits, rums, perfume, cosmetics, tobacco, confectionery, and local food products.", price: "Duty-free", hours: "Open while ship is in port", walk: true, rating: null, tags: ["Duty-free", "On-site", "Rum selection"] },
      { id: 52, cat: "shopping", name: "Diamonds International & Effy (Port)", mapQuery: "Diamonds International Amber Cove, Puerto Plata, Dominican Republic", desc: "Two jewelry stores at the port. Diamonds International carries diamonds and luxury timepieces. Effy is known for panther designs and distinctive gemstone pieces.", price: "Luxury", hours: "Open while ship is in port", walk: true, rating: null, tags: ["Jewelry", "Duty-free", "On-site"] },
      { id: 53, cat: "shopping", name: "Aurora Cigars & Artisan Market (Port)", mapQuery: "Amber Cove Cruise Port, Puerto Plata, Dominican Republic", desc: "Aurora Cigar Shop offers authentic handmade Dominican cigars. The adjacent colonial-style artisan marketplace has local crafts, handmade goods, and Dominican souvenirs.", price: "Varies", hours: "Open while ship is in port", walk: true, rating: null, tags: ["Cigars", "Local crafts", "On-site"] },
      { id: 54, cat: "shopping", name: "Cigar Factories (Downtown)", desc: "Multiple factories including Espigón and Tabacalera Cremo. Watch Cuban master rollers at work and roll your own souvenir cigar. Tours available for groups. One of the most unique experiences in Puerto Plata.", price: "Tour varies · Cigars $5–25+", hours: "Mon–Sat 9 AM – 5 PM", walk: false, rating: "5.0", tags: ["Unique experience", "Taxi required", "Handmade cigars"] },
      { id: 55, cat: "shopping", name: "Rum Distilleries (Downtown)", desc: "Brugal Bottling Plant (museum + purchase, Extra Viejo ~$3.50), Macorix House of Rum (tasting of 6–8 varieties with history video), and La Cueva del Pirata. Brugal is the most well-known Dominican rum brand.", price: "Free–$10 for tastings", hours: "Mon–Sat 9 AM – 5 PM", walk: false, rating: "4.5", tags: ["Rum tasting", "Taxi required", "Great value"] },
    ]
  },
  {
    id: "grandturk",
    mapContext: "Grand Turk, Turks and Caicos",
    name: "Grand Turk",
    flag: "🇹🇨",
    subtitle: "Turks & Caicos",
    day: "Day 6 · Fri May 22",
    arrive: "7:00 AM",
    depart: "4:00 PM",
    note: null,
    items: [
      // ATTRACTIONS
      { id: 56, cat: "attraction", name: "Margaritaville at Cruise Center", mapQuery: "Margaritaville Grand Turk, Turks and Caicos", desc: "Largest Margaritaville in the Caribbean, steps from the ship. Swim-up bar, DJ on busy days, and a lively beach atmosphere. Only open when cruise ships are in port. Free entry.", price: "Free entry · Food & drinks extra", hours: "Open when ship is in port", walk: true, rating: "4.0", tags: ["On-site", "Swim-up bar", "Lively"] },
      { id: 57, cat: "attraction", name: "FlowRider Wave Machine", mapQuery: "Grand Turk Cruise Center, Grand Turk, Turks and Caicos", desc: "Artificial surfing and bodyboarding attraction at the cruise center. Both stand-up surfing and body boarding available. Fun for kids and adults.", price: "Fee applies", hours: "Open when ship is in port", walk: true, rating: "4.0", tags: ["On-site", "Surfing", "Thrilling"] },
      { id: 58, cat: "attraction", name: "Turks & Caicos National Museum", desc: "Features the Molasses Reef Wreck — the oldest European shipwreck in the Western Hemisphere. Also covers natural history, island culture, and Taino artifacts. Museum shop stocks 60+ items from local Middle Caicos artisans.", price: "$5/adult · Under 12 free", hours: "Open from 9 AM (when ship is in port)", walk: false, rating: "4.5", tags: ["Museum", "Historic", "Worth a visit", "$5 taxi"] },
      { id: 59, cat: "attraction", name: "Grand Turk Lighthouse (1852)", desc: "Cast-iron lighthouse from 1852 with scenic coastal trails along marine limestone cliffs. Cannot enter the lighthouse itself, but the grounds and ocean views are beautiful. Small café nearby.", price: "$3 (credited toward café)", hours: "Daytime", walk: false, rating: "4.0", tags: ["Scenic", "Historic", "20-min taxi"] },
      { id: 60, cat: "attraction", name: "H.M. Prison Museum", desc: "Self-guided tour of a former British colonial prison in Cockburn Town. Tells the story of prisoners and the famous Great Hurricane prison escape of 1866. Unique and little-visited.", price: "Small fee", hours: "Open when ship is in port", walk: false, rating: "3.5", tags: ["Unique", "Historic", "Cockburn Town"] },
      { id: 61, cat: "attraction", name: "Cockburn Town Colonial Walk", desc: "1-mile walkable waterfront strip with beautifully preserved 18th and 19th-century Bermudian-influenced buildings along Duke and Font Streets. Free self-guided walk.", price: "Free", hours: "Daytime", walk: false, rating: "4.0", tags: ["Self-guided", "Architecture", "$5 taxi to town"] },
      // RESTAURANTS
      { id: 62, cat: "restaurant", name: "Jimmy Buffett's Margaritaville", desc: "Right at the cruise center. American comfort food with a Caribbean twist. Burgers ~$17.95, sandwiches ~$16.95, key lime pie. Swim-up bar with signature frozen drinks. Noted as pricey but very convenient.", price: "$$$ · Mains $16–22", hours: "Open when ship is in port", walk: true, rating: "3.5", tags: ["On-site", "American", "Convenient", "Pricey"] },
      { id: 63, cat: "restaurant", name: "Jack's Shack Bar & Grill", mapQuery: "Jack's Shack Grand Turk, Turks and Caicos", desc: "Casual beachfront eatery at the cruise complex. Grilled burgers, jerk dishes, BBQ, and seafood. Budget-friendly option right on the beach.", price: "$", hours: "Open when ship is in port", walk: true, rating: "4.0", tags: ["Budget", "Beachfront", "On-site"] },
      { id: 64, cat: "restaurant", name: "Peaches Restaurant", desc: "Beloved local spot in Cockburn Town. TripAdvisor: 4.5/5. Grilled snapper, oxtail stew, jerk chicken — classic Caribbean comfort food at excellent prices. Jerk chicken large plate ~$11.", price: "$ · Mains ~$10–15", hours: "Open when ship is in port", walk: false, rating: "4.5", tags: ["Local favorite", "Best value", "$5 taxi"] },
      { id: 65, cat: "restaurant", name: "Dee's Diner", desc: "Tiny local gem with a TripAdvisor rating of 5.0/5. Daily specials like baked chicken with peas, rice, and coleslaw. 'Fresh made food, very quick service.' Cash-focused.", price: "$", hours: "Open when ship is in port", walk: false, rating: "5.0", tags: ["Top rated", "Local", "Daily specials", "$5 taxi"] },
      { id: 66, cat: "restaurant", name: "Sandbar Restaurant", desc: "Caribbean and seafood menu with a beautiful deck overlooking the ocean. Conch fritters and rum punch are standouts. 'Stunning view, attentive and friendly service.'", price: "$$", hours: "Lunch & Dinner", walk: false, rating: "4.5", tags: ["Ocean views", "Seafood", "Conch fritters"] },
      // BEACHES
      { id: 67, cat: "beach", name: "Cruise Center Beach", mapQuery: "Grand Turk Cruise Center, Grand Turk, Turks and Caicos", desc: "Steps from the gangway. Free lounge chairs. Shallow, calm, and crystal clear — ideal for immediate beach access. Snorkel gear rentals available at $15. Great first stop right off the ship.", price: "Free · Snorkel gear $15", hours: "Open when ship is in port", walk: true, rating: "4.0", tags: ["On-site", "Immediate access", "Snorkeling"] },
      { id: 68, cat: "beach", name: "Governor's Beach ★ Top Pick", desc: "Consistently rated the best beach on Grand Turk. Wide white sand, 6–8 ft max depth, casuarina tree shade, and spectacular snorkeling visibility. Quieter than the cruise center. Chair rentals $10/day, umbrellas $20. About 1 mile north of port.", price: "Free · Chairs $10 · Umbrellas $20", hours: "Open daily", walk: false, rating: "5.0", tags: ["Top rated", "Best on island", "Snorkeling", "~$4 taxi or 20-min walk (no sidewalks)"] },
      { id: 69, cat: "beach", name: "Pillory Beach", desc: "Good snorkeling in calm, clear water. Less visited than Governor's Beach. Local and peaceful.", price: "Free", hours: "Open daily", walk: false, rating: "4.0", tags: ["Snorkeling", "Quiet", "Local"] },
      // SHOPPING
      { id: 70, cat: "shopping", name: "Cruise Center Shops (45,000 sq ft)", mapQuery: "Grand Turk Cruise Center, Grand Turk, Turks and Caicos", desc: "Large complex at the port including a duty-free shop, Ron Jon Surf Shop (beachwear, GT merchandise), multiple jewelry stores, Starbucks, and souvenir shops. All open only when ships are in port.", price: "Varies", hours: "Open when ship is in port", walk: true, rating: null, tags: ["On-site", "Duty-free", "Ron Jon", "Starbucks"] },
      { id: 71, cat: "shopping", name: "Grand Turk Sea Salt", desc: "Hand-harvested from historic salt ponds — a uniquely local product. Available plain or herb-infused. Grand Turk's most distinctive souvenir.", price: "$8–20", hours: "Varies", walk: false, rating: "5.0", tags: ["Local product", "Unique souvenir"] },
      { id: 72, cat: "shopping", name: "Bambarra Rum", desc: "Island-made rum in coconut, spiced, and reserve blend varieties. Best bought at local shops in Cockburn Town for authenticity and value.", price: "$15–30", hours: "Varies", walk: false, rating: "4.5", tags: ["Local rum", "Cockburn Town"] },
      { id: 73, cat: "shopping", name: "National Museum Gift Shop", desc: "The best place for authentic locally-made goods. Stocks 60+ products from Middle Caicos artisans including queen conch jewelry, straw items, and handcrafted gifts. Located inside the museum ($5 entry).", price: "Varies", hours: "Open when ship is in port", walk: false, rating: "5.0", tags: ["Most authentic", "Local artisans", "Museum entry required"] },
      // ACTIVITIES
      { id: 74, cat: "activity", name: "Grand Turk Wall Snorkeling", desc: "One of the top snorkeling/dive sites in the Caribbean. The reef wall drops from 25 ft to over 7,000 ft. Can snorkel from Governor's Beach with rented gear or book a guided 2.5-hour boat tour.", price: "Self-guided from ~$15 gear · Tour ~$100–110/person", hours: "Morning tours recommended", walk: false, rating: "5.0", tags: ["World-class", "Top activity", "Guided recommended"] },
      { id: 75, cat: "activity", name: "Golf Cart Island Tour", mapQuery: "Grand Turk Cruise Center, Grand Turk, Turks and Caicos", desc: "The best way to independently explore Grand Turk. Rentals come with a detailed island map and insider tips from the rental vendor. The island is small — hard to get lost. Combine with lighthouse, museum, and Governor's Beach.", price: "Rental fee at cruise center", hours: "Available when ship is in port", walk: true, rating: "4.5", tags: ["Independent", "Best exploration", "Map included"] },
    ]
  }
];

// ── CATEGORY CONFIG ───────────────────────────────────────────────────────────

const CATS = [
  { id: "all",        label: "All",         color: "bg-gray-700 text-gray-300",          active: "bg-gray-200 text-gray-900" },
  { id: "attraction", label: "Attractions", color: "bg-blue-900 text-blue-300",          active: "bg-blue-500 text-white" },
  { id: "beach",      label: "Beaches",     color: "bg-cyan-900 text-cyan-300",          active: "bg-cyan-500 text-white" },
  { id: "restaurant", label: "Dining",      color: "bg-orange-900 text-orange-300",      active: "bg-orange-500 text-white" },
  { id: "shopping",   label: "Shopping",    color: "bg-purple-900 text-purple-300",      active: "bg-purple-500 text-white" },
  { id: "activity",   label: "Activities",  color: "bg-green-900 text-green-300",        active: "bg-green-500 text-white" },
];

const CAT_BADGE = {
  attraction: "bg-blue-900 text-blue-300",
  beach:      "bg-cyan-900 text-cyan-300",
  restaurant: "bg-orange-900 text-orange-300",
  shopping:   "bg-purple-900 text-purple-300",
  activity:   "bg-green-900 text-green-300",
};

const CAT_LABEL = {
  attraction: "Attraction",
  beach:      "Beach",
  restaurant: "Dining",
  shopping:   "Shopping",
  activity:   "Activity",
};

// ── HELPERS ───────────────────────────────────────────────────────────────────

function Stars({ rating }) {
  if (!rating) return null;
  const r = parseFloat(rating);
  return (
    <span className="flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
      <Star size={12} fill="currentColor" />
      {rating}
    </span>
  );
}

function WalkBadge({ walk }) {
  return walk
    ? <span className="text-xs bg-emerald-900 text-emerald-300 px-2 py-0.5 rounded-full font-medium">Walkable</span>
    : <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full font-medium">Taxi/Transport</span>;
}

// ── CARD ─────────────────────────────────────────────────────────────────────

function Card({ item, mapContext }) {
  const [open, setOpen] = useState(false);
  const mapUrl = `https://maps.apple.com/?q=${encodeURIComponent(item.mapQuery || (item.name + ", " + mapContext))}`;
  return (
    <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 overflow-hidden">
      <button
        className="w-full text-left p-4"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CAT_BADGE[item.cat]}`}>
                {CAT_LABEL[item.cat]}
              </span>
              <WalkBadge walk={item.walk} />
              {item.rating && <Stars rating={item.rating} />}
            </div>
            <p className="font-semibold text-white text-sm leading-snug">{item.name}</p>
            {!open && (
              <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.desc}</p>
            )}
          </div>
          <div className="shrink-0 text-gray-500 mt-1">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {/* Quick info row */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
          {item.price && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <DollarSign size={11} className="text-gray-500" />{item.price}
            </span>
          )}
          {item.hours && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={11} className="text-gray-500" />{item.hours}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-3">
          <p className="text-sm text-gray-300 leading-relaxed">{item.desc}</p>
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {item.tags.map(t => (
                <span key={t} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-blue-400 bg-blue-950 border border-blue-800 px-3 py-1.5 rounded-full active:opacity-70"
          >
            <MapPin size={12} />
            Open in Maps
          </a>
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────

export default function CruiseGuide() {
  const [activePort, setActivePort] = useState("nassau");
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const port = PORTS.find(p => p.id === activePort);

  const filtered = useMemo(() => {
    let items = port.items;
    if (activeCategory !== "all") items = items.filter(i => i.cat === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.desc.toLowerCase().includes(q) ||
        (i.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return items;
  }, [port, activeCategory, search]);

  // count per category for badge
  const counts = useMemo(() => {
    const c = {};
    port.items.forEach(i => { c[i.cat] = (c[i.cat] || 0) + 1; });
    c.all = port.items.length;
    return c;
  }, [port]);

  return (
    <div className="min-h-screen bg-gray-950 font-sans">

      {/* ── HEADER ── */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-white leading-none">🚢 2026 Cruise Guide</h1>
              <p className="text-xs text-gray-500 mt-0.5">May 17–24 · Port Canaveral</p>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search restaurants, beaches, activities…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-gray-800 text-white placeholder-gray-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* ── PORT TABS ── */}
        <div className="max-w-2xl mx-auto">
          <div className="flex overflow-x-auto gap-1 px-4 pb-3 scrollbar-hide">
            {PORTS.map(p => (
              <button
                key={p.id}
                onClick={() => { setActivePort(p.id); setActiveCategory("all"); setSearch(""); }}
                className={`shrink-0 flex flex-col items-start px-3 py-2 rounded-xl text-left transition-all ${
                  activePort === p.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                <span className="text-base leading-none">{p.flag}</span>
                <span className="text-xs font-semibold mt-0.5 leading-none">{p.name}</span>
                <span className="text-xs opacity-70 leading-none mt-0.5">{p.day}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PORT INFO BANNER ── */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-white">{port.flag} {port.name}</p>
              <p className="text-xs text-gray-400">{port.subtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-300">{port.day}</p>
              <p className="text-xs text-gray-400">
                <span className="text-green-400 font-semibold">{port.arrive}</span>
                {" – "}
                <span className="text-red-400 font-semibold">{port.depart}</span>
              </p>
            </div>
          </div>
          {port.note && (
            <p className="text-xs text-amber-300 bg-amber-900 rounded-lg px-3 py-2 mt-2 leading-snug">
              {port.note}
            </p>
          )}
        </div>
      </div>

      {/* ── CATEGORY CHIPS ── */}
      <div className="max-w-2xl mx-auto px-4 mt-3">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === c.id ? c.active : c.color
              }`}
            >
              {c.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeCategory === c.id ? "bg-black bg-opacity-20" : "bg-black bg-opacity-20"
              }`}>
                {counts[c.id] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── RESULTS ── */}
      <div className="max-w-2xl mx-auto px-4 mt-3 pb-8">
        {search && (
          <p className="text-xs text-gray-500 mb-2">{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"</p>
        )}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-600">
            <Search size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No results found</p>
            <button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="text-xs text-blue-400 mt-2">Clear filters</button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(item => <Card key={item.id} item={item} mapContext={port.mapContext} />)}
          </div>
        )}
      </div>
    </div>
  );
}
