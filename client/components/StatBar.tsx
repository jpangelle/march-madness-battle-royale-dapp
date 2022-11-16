import React from 'react';
import styles from '../styles/Home.module.css';

type StatBarProps = {
  totalEntries: number;
  survivingEntries: number;
  eliminatedEntries: number;
};

function StatBar(props: StatBarProps) {
  const { totalEntries, survivingEntries, eliminatedEntries } = props;
  const totalPool = props.totalEntries * 10;
  return (
    <div className={styles.statbar}>
      <div className={styles.stat} id="total-pool">
        <div className={styles.stat__title}>Total Pool: $</div>
        <div className={styles.stat__value}>{totalPool}</div>
      </div>
      <div className={styles.stat} id="total-entries">
        <div className={styles.stat__title}>Total Entries: </div>
        <div className={styles.stat__value}>{totalEntries}</div>
      </div>
      <div className={styles.stat} id="surviving-entries">
        <div className={styles.stat__title}>Surviving Entries: </div>
        <div className={styles.stat__value}>{survivingEntries}</div>
      </div>
      <div className={styles.stat} id="eliminated-entries">
        <div className={styles.stat__title}>Eliminated Entries: </div>
        <div className={styles.stat__value}>{eliminatedEntries}</div>
      </div>
    </div>
  );
}

export default StatBar;
