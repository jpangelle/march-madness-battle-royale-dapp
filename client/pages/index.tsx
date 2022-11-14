import Head from 'next/head';
import Image from 'next/image';
import GameList from '../components/GameList';
import StatBar from '../components/StatBar';
import styles from '../styles/Home.module.css';
import { NativeSelect } from '@mantine/core';
import { Button } from '@mantine/core';

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>March Madness Survivor Pool</title>
        <meta name="description" content="March Madness Survivor Pool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav className={styles.nav}>
        <div className={styles.navbar}>
          <div className={styles.navbar__title}>
            <p> March Madness Survivor Pool</p>
          </div>
          <div className={styles.navbar__button}>
            <Button variant="outline" uppercase>
              Connect Wallet
            </Button>
          </div>
        </div>
        <StatBar totalEntries={500} survivingEntries={200} eliminatedEntries={300} />
      </nav>

      <main className={styles.main}>
        <div className={styles.main__header}>
          <div className={styles.main__header__text}>
            <p>Survivor Pick Sheet</p>
            <p className={styles.deadline}> Deadline: Sunday, 3/22/2023, 8:00 am CST</p>
          </div>
          <div className={styles.main__header__daySelector}>
            <NativeSelect
              data={['Day 1', 'Day 2', 'Day 3', 'Day 4']}
              label="Select Day"
              radius="xs"
            />
          </div>
        </div>

        <div className={styles.grid}>
          <GameList />
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by BooshCoin
        </a>
      </footer>
    </div>
  );
}
