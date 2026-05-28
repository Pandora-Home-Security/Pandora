import type { ReactNode } from 'react';
import './DataStates.css';

/*
 * Zajedničke komponente za stanja podataka: učitavanje, greška i prazno stanje.
 * Koriste se na svim stranicama da prikaz bude dosljedan.
 */

/** Spinner dok se podaci učitavaju. */
export function LoadingState({ message = 'Učitavanje...' }: { message?: string }) {
  return (
    <div className="data-state">
      <div className="data-state-spinner" aria-hidden="true" />
      <p className="data-state-text">{message}</p>
    </div>
  );
}

/** Poruka o grešci s opcionalnim gumbom za ponovni pokušaj. */
export function ErrorState({
  message = 'Došlo je do greške pri dohvaćanju podataka.',
  onRetry,
  children,
}: {
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="data-state" role="alert">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="data-state-icon data-state-icon-error" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p className="data-state-text">{message}</p>
      {onRetry && (
        <button type="button" className="data-state-retry" onClick={onRetry}>
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
          </svg>
          Pokušaj ponovno
        </button>
      )}
      {children}
    </div>
  );
}

/** Prazno stanje kad nema podataka za prikaz. Ikonu je moguće prilagoditi po stranici. */
export function EmptyState({ message, icon }: { message: string; icon?: ReactNode }) {
  return (
    <div className="data-state">
      <span className="data-state-icon data-state-icon-empty" aria-hidden="true">
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
        )}
      </span>
      <p className="data-state-text">{message}</p>
    </div>
  );
}
