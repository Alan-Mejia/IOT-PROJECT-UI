import React, { useEffect, useState } from 'react'
import {over} from 'stompjs';
import SockJS from 'sockjs-client';

const outputPins = [18, 19, 22, 23];
const defultOutputPin = outputPins[0];

var stompClient =null;
const ChatRoom = () => {
    const [deviceName, setDeviceName] = useState("")
    const [isUserLogged, setIsUserLogged] = useState(false)
    const [pinSelected, setPinSelected] = useState(defultOutputPin)
    const [isPinActive, setIsPinActive] = useState(false)

    const [lastPayload, setLastPayload] = useState({})

    const onConnected = () => {
        var connectionWithDeviceMessage = {
          status: 200,
          typeOfConecctionEstablished: "user_interface",
          connectedTo: deviceName
        }
        stompClient.subscribe(`/topic/messages/${deviceName}`, onMessageReceived);
        stompClient.send(`/app/chat/${deviceName}`, {}, JSON.stringify(connectionWithDeviceMessage));
    }

    useEffect(()=>{
      console.log("NUEVO MENSAJE RECIVIDO", lastPayload) //JSON.parse(lastPayload.body))

        const messageFromServer = lastPayload
        if(messageFromServer.messageAction === "connection-confirmed"){
            alert("A connection with device: ", messageFromServer.deviceName, " has been established")
        }else if(messageFromServer.messageType === "INFO"){
          if(messageFromServer.pin === pinSelected){
              if(messageFromServer.value === 0){
                setIsPinActive(false)
                console.log("El switch esta Apagado")
              }else{
                setIsPinActive(true)
                console.log("El switch esta Prendido")
              }
          }else{
            console.log("Pins don't match" , messageFromServer.pin, pinSelected)
          }
        }

      
    },[lastPayload])



    const onMessageReceived = (payload)=>{
        setLastPayload(JSON.parse(lastPayload?.body))
    }

    const onError = (err) => {
        console.log(err);
    }


    const handleOnChangePinList = (e)=>{
      setPinSelected(Number(e.target.value))
        const sendMessage = {
            message: "Desde Fron End",
            actionToPerform: "read-pin-info",
            username: "INTARFAZ",
            created: new Date(),
            messageType: "ADMIN",
            pin: Number(e.target.value),
        }

        stompClient.send(`/app/chat/${deviceName}`, {}, JSON.stringify(sendMessage));
    }

    const handleDeviceName = (e)=>{
      setDeviceName(e.target.value)
    }

    const registerToWebSocketChannel = ()=>{
      setIsUserLogged(true)
      let Sock = new SockJS('http://localhost:8080/chat');
        stompClient = over(Sock);
        stompClient.connect({},onConnected, onError);
    }

    const handleOnTurnPinSwitch = (e)=>{
      setIsPinActive(e.target.checked)
      const valueForSelectedPin = e.target.checked? 1 : 0

        const mesageToWriteOnPin = {
            message: "Desde Fron End",
            actionToPerform: "set-pin-status",
            username: "INTARFAZ",
            created: new Date(),
            messageType: "ADMIN",
            pin: pinSelected,
            pinValue: valueForSelectedPin,
            pinMode: "output"
        }

      stompClient.send(`/app/chat/${deviceName}`, {}, JSON.stringify(mesageToWriteOnPin));
    }


    return (
    <div className="container">
        {isUserLogged?
        <div className="App">
        <h1>ESP32 Control Panel</h1>
        <div style={{backgroundColor: "red"}}>
          <label>Select a Pin</label>
          <select value={pinSelected} onChange={handleOnChangePinList}>
              {outputPins.map((pin, key)=>{
                return(
                  <option key={key} value={pin}>
                    GPIO{pin}
                  </option>
                )
              })}
          </select>
        </div>
        <div style={{marginTop: "20px"}}>
          <label>
            <input type="checkbox" defaultChecked={isPinActive} onChange={handleOnTurnPinSwitch}/>
            <div></div>
            <span>
              {pinSelected ? "On" : "Off"}
            </span>
          </label>
        </div>
      </div>
        :
        <div className="register">
            <input
                id="user-name"
                placeholder="Enter device you want to connect"
                name="userName"
                onChange={handleDeviceName}
                margin="normal"
              />
              <button type="button" onClick={registerToWebSocketChannel}>
                    connect
              </button> 
        </div>}
    </div>
    )
}

export default ChatRoom
