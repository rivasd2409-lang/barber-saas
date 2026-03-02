"use client";

import { useState } from "react";

type ServiceOption = {
  id: number;
  name: string;
  durationMin: number;
  price: number;
};

type BookingFormProps = {
  services: ServiceOption[];
};

const EXAMPLE_SLOTS = [
  "09:00",
  "09:15",
  "09:30",
  "09:45",
  "10:00",
  "10:15",
  "10:30",
  "10:45",
  "11:00",
];

export function BookingForm({ services }: BookingFormProps) {
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");

  return (
    <section>
      <label htmlFor="service">Servicio</label>
      <select
        id="service"
        name="service"
        value={selectedServiceId}
        onChange={(event) => setSelectedServiceId(event.target.value)}
        style={{ display: "block", marginTop: "0.5rem", marginBottom: "1rem" }}
      >
        <option value="">Selecciona un servicio</option>
        {services.map((service) => (
          <option key={service.id} value={String(service.id)}>
            {service.name} - {service.durationMin} min - ${service.price.toFixed(2)}
          </option>
        ))}
      </select>

      {selectedServiceId && (
        <div>
          <h2>Horarios disponibles (ejemplo)</h2>
          <ul>
            {EXAMPLE_SLOTS.map((slot) => (
              <li key={slot}>{slot}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
