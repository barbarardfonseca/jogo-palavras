import { v4 as uuid, } from "uuid";

export default defineNuxtPlugin(() => {
  if (process.server) return;

  const config = useRuntimeConfig();

  const route = useRoute();

  const idRoom = route.params.id as string;

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(`${wsProtocol}//${config?.public.server_websocket ?? window.location.hostname}:${config?.public?.websocket_port ?? "3007"}`);

  // console.log(`SERVER_WEBSOCKET => ${config.public.server_websocket}`);
  // console.log(`WEBSOCKET_PORT => ${config.public.websocket_port}`);

  // console.log(config);

  const getIdUser = () => {
    const idUser = localStorage?.idUser ?? uuid();
    
    localStorage.setItem("idUser", idUser)
  
    return idUser;
  };
  
  const getName = () => {
    let userName = localStorage?.userName;

    if(!userName){
      localStorage.setItem("userName", "sem nome");
      userName = "sem nome";
    }
  
    return userName;
  };

  return { 
    provide: {
      socket,
      idRoom,
      idUser: getIdUser(),
      userName: getName()
    }
  };
});