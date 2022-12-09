import { Heading, useToast, Select } from '@chakra-ui/react'
import type { NextPage } from 'next'
import { Layout } from '../components/layout/Layout'
import StatBar from '../components/StatBar'
import { useIsMounted } from '../hooks/useIsMounted'
import styles from '../styles/Home.module.css'
import GameList from '../components/GameList'

const Home: NextPage = () => {
  const { isMounted } = useIsMounted()
  if (!isMounted) {
    return null
  }

  return (
    <Layout>
      <Heading as="h1" mb="8">
        March Madness Battle Royale
      </Heading>
      <StatBar
        totalEntries={500}
        survivingEntries={200}
        eliminatedEntries={300}
      />
      <main className={styles.main}>
        <div className={styles.main__header}>
          <div className={styles.main__header__text}>
            <p>Survivor Pick Sheet</p>
            <p className={styles.deadline}>
              {' '}
              Deadline: Sunday, 3/22/2023, 8:00 am CST
            </p>
          </div>
          <div className={styles.main__header__daySelector}>
            <Select placeholder="Select Day">
              <option value="option1">Day 1</option>
              <option value="option2">Day 2</option>
            </Select>
          </div>
        </div>

        <div className={styles.grid}>
          <GameList />
        </div>
      </main>
    </Layout>
  )
}

export default Home
