import React, { Component , useState, useEffect , useRef } from 'react';
import './Style.css';

import * as signalR from "@aspnet/signalr";
import { connect } from 'react-redux';
import { Modal , Button } from 'react-bootstrap';

import { ReactComponent as Vector } from './svg/Vector.svg';
import boop from './sirena.mp3';
import IndicatorsComponent from './components/IndicatorsComponent';
import MessagesComponent from './components/MessagesComponent';
import ButtonsDownComponent from './components/ButtonsDownComponent';
/*import { ErrorComponent } from '../../components/ErrorComponent';*/

 /*Центральный экран на котором расположены оповещающие индикаторы */  
function Central(props) { 

  const [alertMas , setAlertMas]=useState([]);/*массив для оповещателей alert */
  const [warningMas , setWarningMas] = useState([]);/*массив для оповещателей warning */
  
  const warningRef = useRef([]);/*ссылка накапливающая значения текста предупреждений */
  const alertRef = useRef([]);/*ссылка накапливающая значения текста ошибок */
  const warningRefTime = useRef([]);/*ссылка накапливающая значения времени для предупреждений */
  const alertRefTime = useRef([]);/*ссылка накапливающая значения времени для ошибок */

  const [oldAlertMessages , setOldAlertMessages] = useState([]);/*предыдущие значения (часть текст) для левой панели отображения сообщений */
  const [oldWarningMessages , setOldWarningMessages] = useState([]);/*предыдущие значения (часть текст) для правой панели отображенитя сообщений */
  const [oldAlertTime , setOldAlertTime] = useState([]);/*предыдущие значения (часть время) для левой панели отображения сообщений */
  const [oldWarningTime , setOldWarningTime] = useState([]);/*предыдущие значения (часть время) для правой панели отображенитя сообщений */
  const [warningMessages , setWarningMessages] = useState([]);/*новые сообщения(часть текст) для левой стороны панели  отображения сообщений  */
  const [alertMessages , setAlertMessages] = useState([]);/*новые сообщения(часть текст) для правой стороны панели отображения сообщений  */
  const [warningTime , setWarningTime] = useState([]);/*новые сообщения (часть время) для левой стороны панели отображения сообщений*/
  const [alertTime , setAlertTime] = useState([]);/*новые сообщения (часть время) для правой стороны панели отображения сообщений */
  const [error , setError]=useState(false);/*если не прошло аякс соединение выдать сообщение об ошибке */
  const [message , setMessage] = useState('');
  const [isClickBuzzNotif , setIsClickBuzzNotif] = useState(false);/*был ли нажат зуммер ЦСО */
  const [isClickBuzzRadioAlt , setIsClickBuzzRadioAlt] = useState(false);/*был ли нажат зуммер РВ */
  const [vibrationColor , setVibrationColor] = useState([]);/*цвета для шкалы вибрации */
  const [vibrationRect , setVibrationRect] = useState('');/*текущее значение для шкалы вибрации */ 

  //const [mas , setMas] = useState([false,false,false,false,false,false]);/*массив из состояний для кнопок внизу. Каждый из его элементов привязан к соответствующей кнопке. Те если первый элемент true то кнопка АВТОМ УПР ВКЛ будет зеленой */
  const [isClicked , setIsClicked] = useState(false);/*была ли нажата какая либо из кнопок внизу */
 
  const protocol = new signalR.JsonHubProtocol();
  const [failsHubUrl, setFailsHubUrl] = useState(props.network.failsHubUrl);
  const [plannerConnection, setPlannerConnection] = useState(hubConnect);
  /*соединение по веб-сокету для получения данных о предупреждающих и опасных индикаторах*/

  const protocolConsole = new signalR.JsonHubProtocol();
  const [afsHubUrl, setAfsHubUrl] = useState(props.network.afsHubUrl);
  const [consoleConnection, setConsoleConnection] = useState(consoleConnect);
  /*соединение по веб-сокету для получения данных о сообщениях для панели*/

  const protocolButtons = new signalR.JsonHubProtocol();
  const [buttonsHubUrl, setButtonsHubUrl] = useState(props.network.pilotHubUrl);
  const [buttonsConnection, setButtonsConnection] = useState(buttonsConnect);
  /*соединение по веб-сокету для получения данных о состоянии нижних кнопок */

  const protocolTelemetry = new signalR.JsonHubProtocol();
  const [telemetryHubUrl, setTelemetryHubUrl] = useState(props.network.telemetryHubUrl);
  const [telemetryConnection, setTelemetryConnection] = useState(telemetryConnect);
  /*соединение по веб-сокету для получения данных о вибрации*/

  let myRefAudio = useRef({});/*ссылка на объект для обработки и декодирования звуков */
  let myRefSource = useRef({});/*ссылка на ресурс со звуковой дорожкой */
  let myRef = useRef(0);/* ссылка на количество запусков аудиофайла */
  const timerRef = useRef(0);/*ссылка на таймер который через 3 сек бездействия после появления ползунка спрячетего */

  const clickRef = useRef(null);
  const footerClickRef = useRef(null);
  const masRef = useRef([false,false,false,false,false,false]);

  /*получаем переменную из css-файла */
  let root = document.querySelector(':root');
  let rootStyles = getComputedStyle(root);
  let green = rootStyles.getPropertyValue('--greenColor');
  let red = rootStyles.getPropertyValue('--redColor');
  let yellow = rootStyles.getPropertyValue('--yellowColor');
  const color=[green , green , green, yellow , green , red];/*массив цветов для каждой из кнопок внизу. Если из веб-сокета для кнопки СТОП БВС придет true то задействовать цвет yellow*/


  /*приведение времени к формату чч:мм:сс */
  function splitTime (time) {
    const tim=time.split('T'); 
    const tim1=tim[1].split(':');
    const tim2=tim1[2].split('.'); 
    const itogTim=tim1[0]+':'+tim1[1]+':'+tim2[0];
    return itogTim;
  }

    /*получение данных для кнопок внизу */
  function buttonsConnect() {
      let connection = new signalR.HubConnectionBuilder().withUrl(buttonsHubUrl).withHubProtocol(protocolButtons).build();
      connection.on('ButtonInfo', (message) => { 
        
        const arr=[message.automaticControl,message.distressSignal,message.stopTakeoff,message.stopUav,message.reLanding,message.emergencyCargoDischarge]; 
        if(JSON.stringify(masRef.current) !== JSON.stringify(arr)) masRef.current=arr;
      });
  
      connection.start();
      return connection;
  }

    /*получение данных для вибрации */
  function telemetryConnect() {
      let connection = new signalR.HubConnectionBuilder().withUrl(telemetryHubUrl).withHubProtocol(protocolTelemetry).build();
      connection.on('BlockVibration', (message) => { 
    
        setVibrationColor(message.rectangles);
        setVibrationRect(message.value);
      });
  
      connection.start();
      return connection;
  }  

  /*получение данных (свежих) для панели */
  function consoleConnect() {
    let connection = new signalR.HubConnectionBuilder().withUrl(afsHubUrl).withHubProtocol(protocolConsole).build();
    connection.on('UpdateConsole', (message) => {  
      if(message.severity>=4){
        warningRef.current.unshift(message.text);/*последнее полученное сообщение помещать в начало массива */
        setWarningMessages(warningRef.current);
        warningRefTime.current.unshift(splitTime(message.time));
        setWarningTime(warningRefTime.current);
      }
/*для того чтобы дополнять массив  warningMessages новыми значениями в веб-сокете нужно их накапливать в ссылке а потом заносить в стейт, 
  тк если этого не делать и сразу все в стейте накапливать то он все время будет перезаписываться и в нем будет только последнее значение*/     
      if(message.severity<4) { 
        alertRef.current.unshift(message.text);
        setAlertMessages(alertRef.current);
        alertRefTime.current.unshift(splitTime(message.time));
        setAlertTime(alertRefTime.current);
      } 
    });

    connection.start();
    return connection;
  }

    
  /*получение данных для оповещающих табло, зуммеров и вибрации */
 function hubConnect()  { 
    let connection = new signalR.HubConnectionBuilder().withUrl(failsHubUrl).withHubProtocol(protocol).build();

    connection.on('Fails', (message) => {    
     setAlertMas(message.emergencyFails);
     setWarningMas(message.warningFails);
     setIsClickBuzzNotif(message.buzzerNotificationSystem);
     setIsClickBuzzRadioAlt(message.buzzerRadioAltimeter);

     if(myRef.current==0) {
      if((message.buzzerNotificationSystem==true) || (message.buzzerRadioAltimeter==true)) playAudio();/*если зуммер true и дорожка не была запущена то запустить ее. При запуске устанавливаем myRef.current=1 и второй раз эту дорожку не запустишь */
     }
     if(myRef.current==1) {
      if((message.buzzerNotificationSystem==false) && (message.buzzerRadioAltimeter==false)) stopAudio();/*если зуммер false и дорожка была уже была запущена то остановить ее. При остановке устанавливаем myRef.current=0 чтобы когда зуммер будет true мы могли бы ее снова запустить*/
     }
    });

    connection.on('BlockVibration' , (message) => {
    
    })
   connection.start(); 
   return connection;
 }



  /*получение предыдущих данных для панели */
  useEffect(() => { 
    /*создаем объект для обработки и декодирования звуков ОДИН РАЗ*/
    let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    myRefAudio.current=audioCtx;
    myRef.current=0;/*изначально файл не был запущен и количество запусков его =0 */
    
    fetch("http://localhost:5000/afs/console")
   .then(res => res.json())
   .then(
     (result) => {  
      
      let oldMesAlert=[];
      let oldTimAlert=[];
      let oldMesWarn=[];
      let oldTimWarn=[];

      for (let i=0;i<result.length;i++){
        if(result[i].severity>=4){
           oldMesWarn.push(result[i].text);
           oldTimWarn.push(splitTime(result[i].time));
        }
        if(result[i].severity<4) {
          oldMesAlert.push(result[i].text);
          oldTimAlert.push(splitTime(result[i].time));
        } 
      }
      setOldAlertMessages(oldMesAlert);
      setOldAlertTime(oldTimAlert);
      setOldWarningMessages(oldMesWarn);
      setOldWarningTime(oldTimWarn);
    },
    (error) => {  setError(true); setMessage('Не удалось загрузить стартовые значения'); }
  )

  }, [null]);

  /*если с сервера аяксом не удалось получить данные отобразим компонент диалогового окна с сообщением об ошибке */
const ErrorComponent=() => {
  if(error==false) return <></>
  else return (
    <Modal.Dialog className='modalDialog'>
        <Modal.Body className='textStyle modalStyle'>
          <p>Не удалось загрузить стартовые значения</p>
        </Modal.Body>
        <Modal.Footer className='modalFooter'>
          <Button className='textStyle modalButtonStyle' variant="primary" onClick={reloadPage}>Ок</Button>
        </Modal.Footer>
    </Modal.Dialog>
  );
}

/*перезагрузка стр*/
const reloadPage = () => {window.location.reload()};

useEffect(() => {
    return () => {
      console.log("TemperatureComponent unmount");
      plannerConnection.stop();
      consoleConnection.stop();
      buttonsConnection.stop();
      telemetryConnection.stop();
    };
}, []);

/*загрузка звуковой дорожки, ее декодирование и перемещение в буфер */
function getData() {
  let source = myRefAudio.current.createBufferSource();
  myRefSource.current=source; 
  var request = new XMLHttpRequest();
  request.open('GET', 'sirena.mp3', true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    var audioData = request.response;/*загрузили звуковую дорожку */

    myRefAudio.current.decodeAudioData(audioData, function(buffer) {/*декодировали ее и поместили в буфер и задали ей атрибуты */
        source.buffer = buffer;
        source.connect(myRefAudio.current.destination);
        source.loop = true;/*атрибут означающий циклическое повторение дорожки */
      },
      );
  }
  request.send();
}

/*проигрывание звуковой дорожки */
function playAudio() {
  getData();
  myRefSource.current.start(0);
  myRef.current=1;
}

/*остановка проигрывания */
function stopAudio() {
  myRefSource.current.stop(0);
  myRef.current=0;
}

/*клик по зуммеру или поднятие вверх ползунка и отправка пустого пост запрса на сервер */
function sendFooterClick(param){
fetch("http://localhost:5000/pilot/"+param , {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  },
  body: JSON.stringify()})
  .then(async response=>{
    if(response.status!==200) { setError(true); setMessage('Не удалось загрузить стартовые значения');}
  })
}

const setClick = (arg) => { setIsClicked(arg); }
/*шкала вибрации*/
function Vibrations(props) {  
  const items=props.color;
  
  const vibrationsItems=items.map((art,ind) =>
      <VibrationsItem key={ind+1}
               color={art} />);
  
  return ( 
          <div className='vibrationsScale'>
            {vibrationsItems}
          </div>
          );
} 

/* элементы шкалы вибрации*/
function VibrationsItem(props) {
  return (
  <div className='vibrationsScaleElem' style={{ backgroundColor: props.color }}>
  </div>
  )
} 

React.useEffect(() => {  
  clickRef.current = setClick;
  footerClickRef.current = sendFooterClick;
}, []);

    return (
        <div className='centerMainDiv fullWidth' onClick={()=>{ 
          if (isClicked==true) {  console.log(isClicked+'clear');
            setIsClicked(false); 
            clearInterval(timerRef.current); 
            timerRef.current=0;
          }
        }}>
          <div className='childDiv'  ></div>
          <div className='centerDiv' >
              
              <div style={{position: 'relative',zIndex: '10'}}><ErrorComponent /></div>

              <IndicatorsComponent alertMas={alertMas} red={red} warningMas={warningMas} yellow={yellow}/>
              <div className='footerDiv fullWidth'>
                <div className='footerMainDiv'>
                  <div className='fullWidth messageDiv'>
                    <div className='zummDiv'>
                      <div className='zummOnOff fullWidth'>
                        <div className='zummCSO'>
                          <div className='textStyle textZumm'>ВЫКЛ. ЗУММ. ЦСО</div>
                          <div className={(isClickBuzzNotif==true) ? 'circleZumm buzzAlert' : 'circleZumm'} onClick={()=>{ sendFooterClick('buzzerNotificationOff');  }}></div>
                          <Vector  className='fullWidth vectorStyle' onClick={()=>{ sendFooterClick('buzzerNotificationOff'); }}/>
                        </div>
                        <div className='zummRV'>
                          <div className='textStyle textZumm'>ВЫКЛ. ЗУММ. РВ</div>
                          <div className={(isClickBuzzRadioAlt==true) ? 'circleZumm buzzAlert' : 'circleZumm'}  onClick={()=>{ sendFooterClick('buzzerRadioAltimeterOff'); }}></div>
                          <Vector className='fullWidth vectorStyle' onClick={()=>{  sendFooterClick('buzzerRadioAltimeterOff'); }}/>
                        </div>
                      </div>
                      <div className='vibrDiv fullWidth'>
                        <div className='buttonVibrDiv'>
                          <div className='fullWidth textStyle vibrText'> ВИБРАЦИИ ДВС</div>
                          <div className='fullWidth classVibration' style={{height: '50%'}}>
                            <Vibrations color={ vibrationColor} />
                            <div className='vibrationValue textStyle'>{vibrationRect}g</div>
                          </div>
                        </div>
                        <div className='buttonVibrDiv textStyle otherText'>АВАР. ОСТАТОК ТОПЛ. 5 ЛИТРОВ</div>
                        <div className='buttonVibrDiv textStyle otherText'>РУЧН. РЕЖ. ВКЛЮЧЕН</div>
                      </div>
                    </div>
                    <MessagesComponent warningMessages={warningMessages} 
                                       warningTime={warningTime} 
                                       oldAlertMessages={oldAlertMessages} 
                                       oldAlertTime={oldAlertTime} 
                                       alertMessages={alertMessages} 
                                       alertTime={alertTime}
                                       oldWarningMessages={oldWarningMessages}
                                       oldWarningTime={oldWarningTime}/>
                  </div>
                  <div className='fullWidth buttonDiv'>
                    {/*<ButtonsDownComponent isClicked={isClicked} timerRef={timerRef} mas={mas} clickFunc={clickRef} sendFooterClick={footerClickRef}/>*/}
                    <ButtonsDownComponent isClicked={isClicked} timerRef={timerRef} mas={masRef.current} clickFunc={clickRef} sendFooterClick={footerClickRef}/>
                  </div>
                  
               </div>
              </div>
          </div>
          <div className='childDiv' ></div>
        </div>
    )
}

const mapStateToProps = (state) => {
    return {
      network: state.engineReducer.network
    };
  };

export default connect (mapStateToProps)(Central);
