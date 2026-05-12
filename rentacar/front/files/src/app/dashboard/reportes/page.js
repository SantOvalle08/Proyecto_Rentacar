'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { rnfResults, sessionTestSummary } from '@/data/rnf-report';

const filters = [
  { id: 'all', label: 'Todos' },
  { id: 'evidence', label: 'Con evidencia de test' },
  { id: 'partial', label: 'Evidencia parcial' },
  { id: 'missing', label: 'Sin evidencia' }
];

const statusMeta = {
  evidence: {
    label: 'Con evidencia de test',
    className: styles.statusEvidence,
    tone: 'test'
  },
  partial: {
    label: 'Evidencia parcial',
    className: styles.statusPartial,
    tone: 'partial'
  },
  missing: {
    label: 'Sin evidencia',
    className: styles.statusMissing,
    tone: 'missing'
  }
};

export default function ReportesRNFPage() {
  const [activeFilter, setActiveFilter] = useState('all');

  const visibleResults = activeFilter === 'all'
    ? rnfResults
    : rnfResults.filter((item) => item.bucket === activeFilter);

  const counts = rnfResults.reduce((accumulator, item) => {
    accumulator[item.bucket] += 1;
    return accumulator;
  }, { evidence: 0, partial: 0, missing: 0 });

  const missingItems = rnfResults.filter((item) => item.bucket === 'missing');

  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlow} />
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <Link href="/dashboard" className={styles.backLink}>
            ← Volver al dashboard
          </Link>
          <span className={styles.pill}>Panel de evidencias RNF</span>
        </div>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Resultados de tests y analisis</p>
            <h1 className={styles.title}>RNF del sistema Rentacar</h1>
            <p className={styles.subtitle}>
              Vista consolidada de los requisitos no funcionales solicitados, con evidencia de pruebas reales,
              validaciones parciales y un bloque explicito de requisitos que siguen sin captura.
            </p>

            <div className={styles.heroActions}>
              <Link href="/dashboard/entregas" className={styles.primaryAction}>
                Ver flujo de entregas
              </Link>
              <Link href="/dashboard/reservas" className={styles.secondaryAction}>
                Ver reservas
              </Link>
            </div>
          </div>

          <aside className={styles.heroPanel}>
            <div className={styles.panelHeader}>
              <span className={styles.panelLabel}>Corrida ejecutada en esta sesion</span>
              <strong>{sessionTestSummary.suites} suites / {sessionTestSummary.tests} tests</strong>
            </div>

            <div className={styles.metricGrid}>
              <article className={styles.metricCard}>
                <span>Con evidencia</span>
                <strong>{counts.evidence}</strong>
              </article>
              <article className={styles.metricCard}>
                <span>Parciales</span>
                <strong>{counts.partial}</strong>
              </article>
              <article className={styles.metricCard}>
                <span>Sin evidencia</span>
                <strong>{counts.missing}</strong>
              </article>
              <article className={styles.metricCard}>
                <span>Aprobados hoy</span>
                <strong>{sessionTestSummary.passed}</strong>
              </article>
            </div>
          </aside>
        </section>

        <section className={styles.legendRow}>
          <div className={styles.legendCard}>
            <span>Con evidencia de test</span>
            <strong>{counts.evidence}</strong>
          </div>
          <div className={styles.legendCard}>
            <span>Evidencia parcial</span>
            <strong>{counts.partial}</strong>
          </div>
          <div className={styles.legendCard}>
            <span>Sin evidencia</span>
            <strong>{counts.missing}</strong>
          </div>
        </section>

        {missingItems.length > 0 && (
          <section className={styles.missingBanner}>
            <div>
              <p className={styles.bannerKicker}>RNF sin evidencia (faltan capturas)</p>
              <h2>Estos requisitos siguen pendientes de prueba o captura formal</h2>
              <p>
                Los siguientes RNF no tienen evidencia ejecutable o captura asociada en esta vista y deben
                completarse antes de considerarlos cerrados.
              </p>
            </div>

            <div className={styles.missingChips}>
              {missingItems.map((item) => (
                <span key={item.id} className={styles.missingChip}>{item.id}</span>
              ))}
            </div>
          </section>
        )}

        <section className={styles.filterBar} aria-label="Filtro de resultados RNF">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`${styles.filterButton} ${activeFilter === filter.id ? styles.filterButtonActive : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </section>

        <section className={styles.cardGrid}>
          {visibleResults.map((item) => {
            const status = statusMeta[item.bucket];

            return (
              <article key={item.id} className={`${styles.card} ${styles[item.bucket]}`}>
                <header className={styles.cardHeader}>
                  <div>
                    <p className={styles.cardId}>{item.id}</p>
                    <h3>{item.title}</h3>
                  </div>
                  <span className={`${styles.statusBadge} ${status.className}`}>
                    {status.label}
                  </span>
                </header>

                <p className={styles.processTag}>{item.process}</p>
                <p className={styles.cardSummary}>{item.summary}</p>

                <div className={styles.sectionLabel}>Paso a paso</div>
                <ol className={styles.stepList}>
                  {item.steps.map((step) => (
                    <li key={step} className={styles.stepItem}>
                      <span className={styles.stepDot} />
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>

                <details className={styles.evidenceBox}>
                  <summary>Ver evidencia y observaciones</summary>
                  <div className={styles.evidenceContent}>
                    <dl className={styles.evidenceList}>
                      {item.evidence.map((evidence) => (
                        <div key={`${item.id}-${evidence.label}`} className={styles.evidenceRow}>
                          <dt>{evidence.label}</dt>
                          <dd>{evidence.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </details>
              </article>
            );
          })}
        </section>

        <footer className={styles.footer}>
          <p>
            Esta pagina consolida los tests ejecutados en esta sesion con la documentacion tecnica existente.
            Los RNF marcados como sin evidencia requieren captura o prueba adicional antes de cerrarse.
          </p>
        </footer>
      </div>
    </main>
  );
}
