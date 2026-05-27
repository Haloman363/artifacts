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
  if (statuses.includes("red")) return "red";
  if (statuses.includes("yellow")) return "yellow";
  return "green";
}

function StatusBadge({ status }) {
  if (status === "red")    return <XCircle    size={18} className="text-red-400    shrink-0" />;
  if (status === "yellow") return <AlertTriangle size={18} className="text-yellow-400 shrink-0" />;
  return                          <CheckCircle  size={18} className="text-green-400 shrink-0" />;
}

function serviceSubtitle(service) {
  const parts = [];
  if (service.lastServiceDate) {
    const d = new Date(service.lastServiceDate);
    parts.push(`Last: ${d.toLocaleDateString()}`);
  }
  if (service.lastServiceMileage != null) {
    const next = service.lastServiceMileage + service.intervalMiles;
    parts.push(`Next: ${next.toLocaleString()} mi`);
  }
  if (parts.length === 0) return "No history";
  return parts.join(" · ");
}

function MileageUpdater({ currentMileage, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(currentMileage.toString());

  function submit() {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0) onUpdate(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          autoFocus
          type="number"
          min="0"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setEditing(false); }}
          className="flex-1 bg-gray-800 border border-green-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
        />
        <button onClick={submit} className="text-green-400 text-sm font-medium active:opacity-60">Save</button>
        <button onClick={() => setEditing(false)} className="text-gray-500 text-sm active:opacity-60">Cancel</button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setVal(currentMileage.toString()); setEditing(true); }}
      className="text-sm text-gray-400 mt-1 active:opacity-60"
    >
      {currentMileage.toLocaleString()} mi · <span className="text-green-600">update</span>
    </button>
  );
}

function LogServiceForm({ service, car, onSave, onCancel }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate]     = useState(service.lastServiceDate ?? today);
  const [mileage, setMileage] = useState(
    service.lastServiceMileage?.toString() ?? car.currentMileage.toString()
  );

  function handleSubmit(e) {
    e.preventDefault();
    const parsedMileage = parseInt(mileage, 10);
    onSave({
      lastServiceDate: date || null,
      lastServiceMileage: !isNaN(parsedMileage) ? parsedMileage : null,
    });
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-green-600";
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full max-w-sm px-5 py-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Log Service</h2>
          <button onClick={onCancel}><X size={20} className="text-gray-400" /></button>
        </div>
        <p className="text-sm text-gray-400 mb-4">{service.name}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Service Date</label>
            <input className={inputCls} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Mileage at Service</label>
            <input className={inputCls} type="number" min="0" value={mileage} onChange={e => setMileage(e.target.value)} />
          </div>
          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-600 active:scale-95 transition-transform rounded-xl py-3 font-semibold text-sm mt-1"
          >
            Save Service Record
          </button>
        </form>
      </div>
    </div>
  );
}

function CarForm({ initial, onSave, onCancel }) {
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [year, setYear]         = useState(initial?.year ?? "");
  const [make, setMake]         = useState(initial?.make ?? "");
  const [model, setModel]       = useState(initial?.model ?? "");
  const [color, setColor]       = useState(initial?.color ?? "");
  const [vin, setVin]           = useState(initial?.vin ?? "");
  const [plate, setPlate]       = useState(initial?.plate ?? "");
  const [mileage, setMileage]   = useState(initial?.currentMileage?.toString() ?? "");

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      nickname: nickname.trim(),
      year: year.trim(),
      make: make.trim(),
      model: model.trim(),
      color: color.trim(),
      vin: vin.trim(),
      plate: plate.trim(),
      currentMileage: parseInt(mileage, 10) || 0,
    });
  }

  const inputCls = "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-green-600";
  const labelCls = "block text-xs text-gray-400 mb-1";

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center" onClick={onCancel}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-t-2xl w-full max-w-sm px-5 py-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">{initial ? "Edit Car" : "Add Car"}</h2>
          <button onClick={onCancel}><X size={20} className="text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className={labelCls}>Nickname</label>
            <input className={inputCls} placeholder="e.g. Jaymes's Truck" value={nickname} onChange={e => setNickname(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Year</label>
              <input className={inputCls} placeholder="2020" value={year} onChange={e => setYear(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Make</label>
              <input className={inputCls} placeholder="Toyota" value={make} onChange={e => setMake(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Model</label>
            <input className={inputCls} placeholder="Tacoma" value={model} onChange={e => setModel(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Current Mileage</label>
            <input className={inputCls} placeholder="45000" type="number" min="0" value={mileage} onChange={e => setMileage(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Color (optional)</label>
              <input className={inputCls} placeholder="Silver" value={color} onChange={e => setColor(e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Plate (optional)</label>
              <input className={inputCls} placeholder="ABC-1234" value={plate} onChange={e => setPlate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelCls}>VIN (optional)</label>
            <input className={inputCls} placeholder="1HGCM82633A..." value={vin} onChange={e => setVin(e.target.value)} />
          </div>
          <button
            type="submit"
            className="w-full bg-green-700 hover:bg-green-600 active:scale-95 transition-transform rounded-xl py-3 font-semibold text-sm mt-2"
          >
            {initial ? "Save Changes" : "Add Car"}
          </button>
        </form>
      </div>
    </div>
  );
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

  function handleAddCar(fields) {
    const newCar = {
      id: makeId(),
      ...fields,
      services: makeDefaultServices(),
    };
    setCars(prev => [...prev, newCar]);
    setSelectedCarId(newCar.id);
    setView("car");
  }

  function handleEditCar(fields) {
    setCars(prev => prev.map(c => c.id === selectedCarId ? { ...c, ...fields } : c));
    setView("car");
  }

  function handleDeleteCar(carId) {
    setCars(prev => prev.filter(c => c.id !== carId));
    setSelectedCarId(null);
    setView("hub");
  }

  function handleLogService(fields) {
    setCars(prev => prev.map(c => {
      if (c.id !== selectedCarId) return c;
      return {
        ...c,
        services: c.services.map(s =>
          s.id === selectedServiceId ? { ...s, ...fields } : s
        ),
      };
    }));
    setSelectedServiceId(null);
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
                  className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 active:scale-95 transition-transform text-left w-full"
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

  if (view === "add-car") {
    return <CarForm onSave={handleAddCar} onCancel={() => setView("hub")} />;
  }

  if (view === "edit-car" && selectedCar) {
    return <CarForm initial={selectedCar} onSave={handleEditCar} onCancel={() => setView("car")} />;
  }

  if (view === "log-service" && selectedCar && selectedService) {
    return (
      <LogServiceForm
        service={selectedService}
        car={selectedCar}
        onSave={handleLogService}
        onCancel={() => { setSelectedServiceId(null); setView("car"); }}
      />
    );
  }

  if (view === "car" && selectedCar) {
    const label = selectedCar.nickname || `${selectedCar.year} ${selectedCar.make} ${selectedCar.model}`.trim() || "Unnamed Car";

    return (
      <div className="min-h-screen bg-gray-950 text-white px-4 pb-10 pt-6">
        <div className="max-w-sm mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <button onClick={() => setView("hub")} className="text-gray-400 text-sm active:opacity-60">← Back</button>
            <button
              onClick={() => setView("edit-car")}
              className="text-gray-400 active:opacity-60"
            >
              <Edit2 size={16} />
            </button>
          </div>
          <h1 className="text-xl font-bold mb-0.5">{label}</h1>
          <p className="text-sm text-gray-500 mb-1">
            {[selectedCar.year, selectedCar.make, selectedCar.model].filter(Boolean).join(" ")}
          </p>

          {/* Mileage update */}
          <MileageUpdater
            currentMileage={selectedCar.currentMileage}
            onUpdate={miles => {
              setCars(prev => prev.map(c => c.id === selectedCarId ? { ...c, currentMileage: miles } : c));
            }}
          />

          {/* Service list */}
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mt-5 mb-3">Services</h2>
          <div className="flex flex-col gap-2">
            {selectedCar.services.map(service => {
              const st = serviceStatus(service, selectedCar.currentMileage);
              return (
                <button
                  key={service.id}
                  onClick={() => { setSelectedServiceId(service.id); setView("log-service"); }}
                  className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-left w-full active:scale-95 transition-transform"
                >
                  <StatusBadge status={st} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{service.name}</p>
                    <p className="text-xs text-gray-500 truncate">{serviceSubtitle(service)}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Delete car */}
          <button
            onClick={() => { if (confirm(`Delete ${label}?`)) handleDeleteCar(selectedCar.id); }}
            className="mt-8 w-full text-xs text-red-700 hover:text-red-500 active:opacity-60 py-2"
          >
            Delete this car
          </button>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-950 text-white px-4 pt-6 text-gray-500 text-sm text-center">Loading...</div>;
}
