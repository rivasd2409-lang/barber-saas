import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container">
      <h1>Barber SaaS</h1>
      <Link href="/book">Ir a reservas</Link>
    </main>
  );
}
