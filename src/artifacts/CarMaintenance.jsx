import { useState, useEffect } from "react";
import { Car, Wrench, Plus, ChevronRight, CheckCircle, AlertTriangle, XCircle, X, Edit2 } from "lucide-react";

const STORAGE_KEY = "car-maintenance-v1";

const DEFAULT_SERVICES = [
  { name: "Oil Change",         intervalMiles: 5000,  intervalMonths: 6  },
  { name: "Tire Rotation",      intervalMiles: 7500,  intervalMonths: 6  },
  { name: "Air Filter",         intervalMiles: 15000, intervalMonths: 12 },
  { name: "Cabin Air Filter",   intervalMiles: 15000, intervalMonths: 12 },
  { name: "Brake Inspection",   intervalMiles: 20000, intervalMonths: 12 },
  { name: "Battery Check",      intervalMiles: 30000, intervalMonths: 24 },
  { name: "Coolant Flush",      intervalMiles: 30000, intervalMonths: 24 },
  { name: "Transmission Fluid", intervalMiles: 30000, intervalMonths: 24 },
  { name: "Spark Plugs",        intervalMiles: 30000, intervalMonths: 36 },
  { name: "Wiper Blades",       intervalMiles: 12000, intervalMonths: 12 },
];

function loadCars() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCars(cars) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
}

function makeId() {
  return crypto.randomUUID();
}

function makeDefaultServices() {
  return DEFAULT_SERVICES.map(s => ({
    id: makeId(),
    name: s.name,
    intervalMiles: s.intervalMiles,
    intervalMonths: s.intervalMonths,
    lastServiceMileage: null,
    lastServiceDate: null,
  }));
}

// Returns "green" | "yellow" | "red"
// If no service history exists, returns "yellow" (unknown/needs attention)
function serviceStatus(service, currentMileage) {
  const { lastServiceMileage, lastServiceDate, intervalMiles, intervalMonths } = service;

  if (lastServiceMileage == null && lastServiceDate == null) return "yellow";

  let mileStatus = "green";
  if (lastServiceMileage != null) {
    const milesDone = currentMileage - lastServiceMileage;
    const milesLeft = intervalMiles - milesDone;
    if (milesLeft <= 0) mileStatus = "red";
    else if (milesLeft <= 500) mileStatus = "yellow";
  }

  let dateStatus = "green";
  if (lastServiceDate != null) {
    const last = new Date(lastServiceDate);
    const now = new Date();
    const msLeft = last.getTime() + intervalMonths * 30.44 * 86400000 - now.getTime();
    const daysLeft = msLeft / 86400000;
    if (daysLeft <= 0) dateStatus = "red";
    else if (daysLeft <= 30) dateStatus = "yellow";
  }

  // Worst of the two
  if (mileStatus === "red" || dateStatus === "red") return "red";
  if (mileStatus === "yellow" || dateStatus === "yellow") return "yellow";
  return "green";
}

// Returns worst status across all services for a car
function carStatus(car) {
  const statuses = car.services.map(s => serviceStatus(s, car.currentMileage));
  if (statuses.length === 0) return "yellow";
  if (statuses.includes("red")) return "red";
  if (statuses.includes("yellow")) return "yellow";
  return "green";
}

export default function CarMaintenance() {
  const [cars, setCars] = useState(loadCars);
  const [view, setView] = useState("hub"); // "hub" | "car" | "add-car" | "edit-car" | "log-service"
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  useEffect(() => { saveCars(cars); }, [cars]);

  const selectedCar = cars.find(c => c.id === selectedCarId) ?? null;
  const selectedService = selectedCar?.services.find(s => s.id === selectedServiceId) ?? null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <p className="text-center text-gray-500 pt-20">Car Maintenance — scaffold</p>
    </div>
  );
}
