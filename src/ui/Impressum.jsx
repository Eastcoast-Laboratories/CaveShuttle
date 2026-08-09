import React from 'react';
import './LegalPages.css';

// Static Impressum page linked from the main menu.
export default function Impressum({ onBack }) {
  return (
    <div className="modal-page">
      <div className="modal-page-inner">
        <button className="back-button" onClick={onBack}>
          Zurück
        </button>

        <h1>Impressum</h1>

        <h2>Verantwortlich für den Inhalt der Seite</h2>
        <p>Ruben Barkow-Kuder</p>

        <h2>Postanschrift</h2>
        <p>
          eastcoast laboratories<br />
          Knickweg 16<br />
          D-24114 Kiel
        </p>

        <h2>Kontakt</h2>
        <p>Telefon: (+49) Kiel - 53 678 64</p>
        <p>E-Mail: rbk-at-eclabs.de</p>

        <h2>Steuerdaten</h2>
        <p>Steuernummer: 19 222 22158</p>
        <p>USt-IdNr: DE235640206</p>
      </div>
    </div>
  );
}
