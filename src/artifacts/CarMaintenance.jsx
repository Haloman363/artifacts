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

  function navigateToCar(carId) {
    setSelectedCarId(carId);
    setView("car");
  }

  if (view === "hub") {
    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">My Cars</h1>
            <button
              onClick={() => setView("add-car")}
              className="flex items-center gap-1 bg-green-700 hover:bg-green-600 active:scale-95 transition-transform px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              <Plus size={16} /> Add Car
            </button>
          </div>

          {cars.length === 0 && (
            <div className="text-center text-gray-500 mt-20">
              <Car size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm">No cars yet. Tap "Add Car" to get started.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {cars.map(car => {
              const status = carStatus(car);
              const StatusIcon = status === "red" ? XCircle : status === "yellow" ? AlertTriangle : CheckCircle;
              const statusColor = status === "red" ? "text-red-400" : status === "yellow" ? "text-yellow-400" : "text-green-400";
              const label = car.nickname || `${car.year} ${car.make} ${car.model}`.trim() || "Unnamed Car";
              const sub = car.nickname ? `${car.year} ${car.make} ${car.model}`.trim() : "";
              return (
                <button
                  key={car.id}
                  onClick={() => navigateToCar(car.id)}
                  className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 active:scale-98 transition-transform text-left w-full"
                >
                  <StatusIcon size={22} className={statusColor} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{label}</p>
                    {sub && <p className="text-xs text-gray-500 truncate">{sub}</p>}
                    <p className="text-xs text-gray-600">{car.currentMileage.toLocaleString()} mi</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-600 shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-950 text-white px-4 pt-6 text-gray-500 text-sm text-center">Loading...</div>;
}
