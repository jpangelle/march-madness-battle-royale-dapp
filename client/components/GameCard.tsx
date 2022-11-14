import React from 'react';
import styles from '../styles/Home.module.css';
import Image from 'next/image';

type Team = {
  name: string;
  number: number;
  logo: string;
};

type Game = {
  date: string;
  homeTeam: Team;
  awayTeam: Team;
};

type GameCardProps = {
  game: Game;
};

function GameCard(props: GameCardProps) {
  const { date, homeTeam, awayTeam } = props.game;

  return (
    <div className={styles['game-card']}>
      <p> {date} </p>
      <div className={styles['team-card']}>
        <Image src={homeTeam.logo} alt={homeTeam.name} width="30" height="30" />
        <div className={styles['team-name']}>{homeTeam.name}</div>
      </div>
      <div className={styles['team-card']}>
        <Image src={awayTeam.logo} alt={awayTeam.name} width="30" height="30" />
        <div className={styles['team-name']}>{awayTeam.name}</div>
      </div>
    </div>
  );
}

export default GameCard;
