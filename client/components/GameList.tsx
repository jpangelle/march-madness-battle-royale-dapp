import React from 'react';
import GameCard from './GameCard';
import styles from '../styles/Home.module.css';

// https://www.espn.com/mens-college-basketball/teams

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

type GameList = Game[];

type GameListProps = {
  games?: GameList;
};

const exampleGame = {
  date: `${new Date().toDateString()} 7:00 PM CT`,
  homeTeam: { name: 'Ragin Cajuns', number: 1, logo: '/cajuns.png' },
  awayTeam: { name: 'Tigers', number: 2, logo: '/lsu.png' },
};

const exampleGame2 = {
  date: `March 23, 2023 7:00 PM CT`,
  homeTeam: { name: 'Wildcats', number: 3, logo: '/uk.png' },
  awayTeam: { name: 'Devils', number: 4, logo: '/duke.png' },
};

const exampleGameList = [
  exampleGame,
  exampleGame2,
  exampleGame,
  exampleGame2,
  exampleGame,
  exampleGame2,
  exampleGame,
  exampleGame2,
  exampleGame,
  exampleGame2,
  exampleGame,
  exampleGame2,
  exampleGame,
  exampleGame2,
];

function GameList(props: GameListProps) {
  const gameList = props.games || exampleGameList;
  return (
    <div className={styles['game-list']}>
      {gameList.map((game: Game, index) => (
        <GameCard game={game} key={index + 1000} />
      ))}
    </div>
  );
}

export default GameList;
