import React, { Component, useState, useEffect , useRef } from 'react';
import '../Style.css';
import * as signalR from "@aspnet/signalr";

/*сообщения */
export default function MessagesComponent(networkParam) {

    /*сообщения для левой и правой части панели */
  const Messages=(props)=>{
    const arr=[];

    props.mas.map((str,id) => { 
    arr.push(<MessagesItem key={id+1} text={props.mas[id]} time={props.tim[id]} attr={props.attr}/>)});

    return arr;
  }
  
  const MessagesItem=(props)=>{
    let st='';
    if(props.attr=='warning') st='textWarning';
    if(props.attr=='alert')  st='textAlert';
  
    return(
    <div className='warningMes'>
      <div className='textStyle time'>{props.time}</div>
      <div className={st+' textStyle textWA'}>{props.text}</div>
    </div>);
  
  }

    return (
        <div className='mesDiv'>
            <div id='warningMes'style={{overflowY: 'auto'}} className='message_Div'>
                <Messages mas={networkParam.warningMessages} tim={networkParam.warningTime} attr={'warning'}/>
                <Messages mas={networkParam.oldWarningMessages} tim={networkParam.oldWarningTime} attr={'warning'}/>
            </div>
            <div className='separatorDiv'></div>
            <div id='alertMes' style={{overflowY: 'auto'}} className='message_Div'>
                <Messages mas={networkParam.alertMessages} tim={networkParam.alertTime} attr={'alert'}/>
                <Messages mas={networkParam.oldAlertMessages} tim={networkParam.oldAlertTime} attr={'alert'}/>
            </div>
        </div>
    )
}
