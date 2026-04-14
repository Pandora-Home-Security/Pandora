/**
 * Placeholder stranica za sekcije koje još nisu implementirane.
 * Prikazuje naslov i "uskoro dolazi" poruku.
 * Koristi se za Kamere, Senzori, Alarmi, Analitika, Korisnici
 * dok se ti milestone-ovi ne dovrše (M3–M7).
 */
function PlaceholderPage({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">{icon}</div>
      <h2>{title}</h2>
      <p>Ova sekcija dolazi u sljedećem milestone-u.</p>
    </div>
  );
}

export default PlaceholderPage;
