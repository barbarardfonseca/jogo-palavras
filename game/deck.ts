import { Vowels, Cards } from './cards';
import { Room, Card } from "~~/types";

export function getTableCards(deck: Card[]){
  const table = [];
  
  for(let i in Array.from(Array(4))){
    table.push(deck[0]);
    deck.shift();
  }

  return {
    table, deck
  }
}

export function getHand(deck: Card[]){
  const hand = [];
  
  for(let i in Array.from(Array(7))){
    hand.push(deck[0]);
    deck.shift();
  }

  return {
    hand, deck
  }
}

export function getDeckProfile(maxPlayers: number){
  let config = {
    atk: 4, consonants: 2, joker: 4, vowels: 2
  }

  if(maxPlayers > 2 && maxPlayers <= 4){
    config = {
      atk: 8, consonants: 2, joker: 6, vowels: 2
    }
  }
  else if(maxPlayers > 4 && maxPlayers <= 6){
    config = {
      atk: 12, consonants: 3, joker: 10, vowels: 3
    }
  }
  else if(maxPlayers > 6 && maxPlayers <= 8){
    config = {
      atk: 16, consonants: 3, joker: 12, vowels: 3
    }
  }
  else{
    config = {
      atk: 20, consonants: 4, joker: 16, vowels: 5
    }
  }

  return createDeck(config);
}

/* deck básico:  3 vogais de cada, 2 consoantes, 4 atk, 4 coringas */
export function createDeck({ vowels, consonants, joker, atk }: DeckConfig){
  const deck: Card[] = [];

  for(let i in Array.from(Array(vowels))){
    Vowels.forEach(v => deck.push(Cards[v]));
  }

  for(let i in Array.from(Array(consonants))){
    Object.keys(Cards).forEach(k => {
      if(!Vowels.includes(k) && k !== "?" && k !== "ATK"){
        deck.push(Cards[k])
      }
    });
  }

  for(let i in Array.from(Array(joker))){
   deck.push(Cards["?"]);
  }
  
  for(let i in Array.from(Array(atk))){
    deck.push(Cards["ATK"]);
  }

  return shuffle(deck);
}

export function shuffle<T = any>(arr: Array<T>){
  return arr.map(v => ({ v, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ v }) => v)
}

interface DeckConfig { 
  vowels: number;
  consonants: number;
  joker: number;
  atk: number;
}