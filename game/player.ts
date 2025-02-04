import { WebSocket } from 'ws';
import { sumWordPoints } from '~~/game';

export function addPlayerInRoom({ idRoom, idUser, name = "", }: PlayerData, ws: WebSocket): boolean {
  const room = getRoom(idRoom);

  if(room){
    const playerInRoom = room.players.find(p => p.id === idUser);
    // player reconnect in room
    if(playerInRoom){
      playerInRoom.ws.close();
      playerInRoom.ws = ws;

      return true;
    }else{
      // quantidade maxima de jogadores
      if(room.players.length <= room.maxPlayers){
        room.players.push({
          ws,
          name,
          cards: [],
          id: idUser,
          isReady: false,
          specialCards: [],
        });

        return true;
      }

      return false;
    }
  }

  return false;
}

export function getHandCardsPlayers(idRoom: string): HandCardsPerPlayer[] {
  const room = getRoom(idRoom);

  if(room){
    return room.players.map(p => ({
      idPlayer: p.id,
      handCards: p.handCards,
    }));
  }

  return [];
}

export function getServerDataPlayerInRoom(idRoom: string): ServerDataPlayerInRoom[] {
  const room = getRoom(idRoom);

  if(room){
    return room.players.map(p => ({
      id: p.id,
      name: p.name,
      image: p.image,
      isReady: p.isReady,
      isOnline: p.isOnline,
      totalScore: p?.totalScore ?? 0,
    })) ?? [];
  }

  return [];
}

export function getHandCardsPlayer(idRoom: string, idPlayer: string){
  return connectRoom(idRoom, idPlayer).then(({ player }) => {
    return player.handCards;    
  }).catch(err => {
    console.log(err);
    return [];
  }); 
}

export function getResultsRoom(idRoom: string) {
  const room = getRoom(idRoom);

  if(room){
    room.results.forEach(r => {
      r.score = sumWordPoints(r.cards);
    });

    return room.results;
  }

  return [];
}

export function identTotalScore(results: Result[]) {
  const roundsSet = new Set<number>(results.map(r => r.round).reverse());
  const resultPerRound: Record<string, Result[]> = {};

  roundsSet.forEach((r, i) => {
    resultPerRound[i] = results.filter(rd => rd.round === r);
  });

  return resultPerRound;
}

export function addWordPlayerInResults(idRoom: string, idPlayer: string, cards: GameCard[]) {
  console.log("[addWordPlayerInResults] init player:", idPlayer);
  
  const room = getRoom(idRoom);

  if(room){
    const player = extractPlayerRoom(room, idPlayer);

    if(player){
      console.log("wordCards: ", cards);
      console.log("handCards before: ", player.handCards);
      
      // remove as cartas usadas da mão
      if(player.handCards.length && cards.length){
        player.handCards = player.handCards.filter(c => !cards.some(cd => c.id === cd.id));
      }

      console.log("handCards after: ", player.handCards);
    
      room.results.push({
        cards,
        idPlayer,
        round: room.round,
        score: sumWordPoints(cards),
        playerName: player.name ?? "",
      });

      console.log("[addWordPlayerInResults] finish");
    }
  }
}

export function getTotalScorePlayers(results: Record<string, Result[]>, handCardsPerPlayer: HandCardsPerPlayer[]){
  const totalScorePlayer = [] as TotalScorePlayer[];
  const playersData = [] as Result[];
  let allResults = [] as Result[];

  Object.values(results)
    .forEach(r => {
      allResults = [...allResults, ...r] as Result[];
    });

  const idPlayersSet = new Set(
    allResults.map(ar => ar.idPlayer)
  );

  for (let result of allResults) {
    idPlayersSet.forEach(idPlayer => {
      if(result.idPlayer === idPlayer){
        if(!playersData.some(pd => pd.idPlayer === idPlayer)){
          playersData.push(result);
        }
      }
    });
  }

  playersData.forEach(player => {
    const totalScore =
      allResults.filter(ar => player.idPlayer === ar.idPlayer)
      .map(ar => ar.score)
      .reduce((t, ar) => ar + t, 0);

    totalScorePlayer.push({
      totalScore,
      idPlayer: player.idPlayer,
      playerName: player.playerName,
      scoreHand: 0
    });
  });

  totalScorePlayer.forEach(tsp => {
    const player = handCardsPerPlayer.find(p => p.idPlayer === tsp.idPlayer);

    if(player){
      tsp.scoreHand = player.handCards.reduce((t, c) => c.points + t, 0); 
      tsp.totalScore += tsp.scoreHand;
    }
  });

  return totalScorePlayer.sort((a, b) => {
    if(a.totalScore < b.totalScore) return 1;
    else if(a.totalScore > b.totalScore) return -1;
    return 0;
  });
}

export function getServerDataPlayerInGame(idRoom: string, idPlayer: string, ws?: WebSocket): ServerDataPlayerInGame | undefined {
  const room = getRoom(idRoom);

  if(room && room.gameReady){
    const player = extractPlayerRoom(room, idPlayer);
    
    if(player){
      const handCards = player?.handCards ?? [];
      const tableCards = room.tableCards;
      const profilePlayersRoom = getServerDataPlayerInRoom(idRoom);

      if(ws){
        if(player.ws){
          player.ws.close();
        }

        player.ws = ws;
      }
      
      return {
        handCards,
        tableCards,
        profilePlayersRoom,
        results: room.results
      };
    }
  }

  console.log("[getServerDataPlayerInGame] - invalid room to player in game", room)

  return undefined;
}

export function isAdmin(idUser: string, idRoom: string): boolean {
  return getRoom(idRoom)?.idAdmin === idUser;
}

export function getRoom(idRoom: string){
  return globalThis.rooms.find(r => r.id === idRoom);
}

export function extractPlayerRoom(room: Room, idPlayer: string){
  return room.players.find(p => p.id === idPlayer);
}

export function roomExists(idRoom: string){
  return !!(getRoom(idRoom));
}

export function getRoomPlayer(idPlayer: string){
  return globalThis.rooms.find(r => r.players.some(p => p.id === idPlayer));
}

export function emitAll(idRoom: string, data: ServerData){
  const room = getRoom(idRoom);

  if(room){
    try {
      room.players.forEach((p) => {
        p.ws.send(
          JSON.stringify(data)
        );
      });
    } catch (error) {
      console.log("[emitAll] Error!");
      console.log("[emitAll- data]: ", data);
      console.log(error);
    }
  }
}

export function emit(idRoom: string, idPlayer: string, data: ServerData){
  const room = getRoom(idRoom);

  if(room){
    const player = extractPlayerRoom(room, idPlayer);

    if(player){
      player.ws.send(
        JSON.stringify(data)
      );
    }
  }
}

export function setName(idRoom: string, idPlayer: string, name: string){
  const room = getRoom(idRoom);

  if(room){
    room.players.forEach(player => {
      if(player.id === idPlayer){
        player.name = name;
      }
    });
  }
}

export function setReady(idRoom: string, idPlayer: string, isReady: boolean){
  const room = getRoom(idRoom);

  if(room){
    room.players.forEach(player => {
      if(player.id === idPlayer){
        player.isReady = isReady;
      }
    });
  }
}

export function removePlayer(idRoom: string, idPlayer: string){
  const room = getRoom(idRoom);
  
  if(room && !room.gameReady){
    const indexPlayer = room?.players.findIndex(p => p.id === idPlayer)
    
    if(indexPlayer !== -1){
      // só remove o jogador caso o jogo não tenha começado
      room.players.splice(indexPlayer, 1);
      console.log("player removed from room");
    }
 }
}

export function connectRoom(idRoom: string, idPlayer: string){
  return new Promise<{ room: Room, player: PlayerRoom }>((resolve, reject) => {
    const room = getRoom(idRoom);
    
    if(room){
      if(idPlayer){
        const player = extractPlayerRoom(room, idPlayer);

        if(player){
          resolve({ room, player });
        }

        reject("player not found");
      }
    } 
    
    reject("room not found");
  })
}