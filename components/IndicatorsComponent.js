import React, { Component, useState, useEffect , useRef } from 'react';
import '../Style.css';
import * as signalR from "@aspnet/signalr";

/*Оповещатели аварийные и предупреждающие */
export default function IndicatorsComponent(networkParam) {

/*индикаторы оповещения alert*/  
const AlertDiv= () => {
    return <tbody><AlertMain/></tbody>
  }  
  
  const AlertMain=() => {
    const cont=[];
    const titles=[ [ 'МАКС. ОБОРОТЫ НВ','ПРЕДЕЛЬНЫЙ β','ПРЕДЕЛЬНАЯ g','ОТКАЗ СИСТ. ОХЛАЖД.БРЭО','ВКЛЮЧЕНО АВАР. ПИТ.БИС','ВКЛЮЧЕНО АВАР. ПИТ.ПДП'],
                   ['ПОЖАР В ОТСЕКЕ ДВИГ.','ПОЖАР В ОТСЕКЕ БРЭО','ОТКАЗ СЕРВОПРИВОДА  ДЗ ДВИГ.','ПОЖАР В ГРУЗ.ОТСЕКЕ','ОТКАЗ СЕРВОПРИВОДА СИСТ.УПР.НВ','ОТКАЗ СЕРВОПРИВОДА СИСТ.УПР.РВ'],
                   ['ПРОВЕРЬ ДВИГ.','ОТКАЗ ТОПЛ.НАСОСА','ОТКАЗ ГЕНЕРАТОРА','СТРУЖКА В МАСЛЕ ДВИГ.', 'МИН. ОБОРОТЫ ДВИГ.','МАКС Т° ДВИГ'],
                   ['НЕТ ДАВЛ.ТОПЛИВА','НЕТ ДАВЛ.   МАСЛА ДВИГ','МАКС. Т° МАСЛА ДВИГ.','МИН.УРОВЕНЬ   МАСЛА ДВИГ.','МИН.УРОВЕНЬ ОХЛ. ЖИДК.ДВИГ.','ПОВЫШ. ВИБРАЦИЯ БВС ВТ'],
                   ['ОТКАЗ ДВИГАТЕЛЯ','СИСТ.УПРАВЛ.ПОЛ. ЗАБЛОКИРОВАНА','ГРУЗ СБРОШЕН','ПОВЫШ.ВИБРАЦИЯ ДВИГ.','ОТКАЗ РУЛЕВ.ВИНТА','РЕЗЕРВ'],
                   ['РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ']];
  
    const mas=[];
    for(let i=0;i<36;i++)
         mas[i]=false;
  
    for(let i=0;i<networkParam.alertMas.length;i++){
          if((networkParam.alertMas[i] == 1) || (networkParam.alertMas[i] == 2)) mas[0]=networkParam.alertMas[i]; 
          else if((networkParam.alertMas[i] > 2) && (networkParam.alertMas[i] < 18)) mas[networkParam.alertMas[i]-2]=true;
          else if((networkParam.alertMas[i] == 18) || (networkParam.alertMas[i] == 19)) mas[16]=networkParam.alertMas[i];
          else if((networkParam.alertMas[i] > 19) && (networkParam.alertMas[i] <= 31)) mas[networkParam.alertMas[i]-3]=true;
    }
  
    const result=[];
    for (let i = 0; i < mas.length; i += 6) {
          result.push(mas.slice(i, i + 6));
    }
          
    for (let i=0;i<=5;i=i+1) cont.push(<tr className='trAlert' key={i+1}><AlertMainItem key={i+1} val={titles[i]} alertMes={result[i]} /></tr>);
      return ( cont );                 
  }
  
  const AlertMainItem =(props) => {
    const cont=[]; 
    let value='';
  
    for(let i=0;i<=5;i++) { 
         switch(props.alertMes[i]) {
           case 1: { value='МАКС. ОБОРОТЫ НВ'; break;}
           case 2: { value='МИН. ОБОРОТЫ НВ'; break;}
           case 18: {value='МАКС. ОБОРОТЫ ДВИГ.'; break;}
           case 19: {value='МИН. ОБОРОТЫ ДВИГ.'; break;}
           default: value=props.val[i];
         }
  
         cont.push(<td className='textStyle tdAlert' style={{backgroundColor : (props.alertMes[i] !== false) ? networkParam.red : 'transparent' , 
                                                                              border: (props.alertMes[i] !== false) ? '1px solid white' : '1px solid #535353'}} key={i+1}>
                                      <div className='divTd' style={{color: (props.alertMes[i] !== false) ? 'black' : '#535353'}}> {value}</div>
                                    </td>);
                            }
      return ( cont );
  }    

    /*индикаторы оповещения warning */
const WarningDiv= () => {
    return <tbody><WarningMain/></tbody>
 }
 
 const WarningMain=() => {
 
   const mas=[];
   for(let i=0;i<18;i++)
        mas[i]=false;
 
   for(let i=0;i<networkParam.warningMas.length;i++){
     if((networkParam.warningMas[i] >= 1) && (networkParam.warningMas[i] < 10)) mas[networkParam.warningMas[i]-1]=true;
     else if((networkParam.warningMas[i] == 10) || (networkParam.warningMas[i] == 11)) mas[9]=networkParam.warningMas[i];
     else if(networkParam.warningMas[i] == 12) mas[10]=true;
   }
   
   const result=[];
   for (let i = 0; i < mas.length; i += 6) {
         result.push(mas.slice(i, i + 6));
   } 
 
    const cont=[];
    const titles=[ ['НАРУШ.ТЕМПЕР.РЕЖ. В ОТС.БРЭО','ОТКАЗ УКАЗАТЕЛЯ ВЫСОТЫ','ОТКАЗ УКАЗАТЕЛЯ СКОРОСТИ','ОТКАЗ АВИАГОРИЗОНТА','ОТКАЗ ПЕРВИЧНОГО КАНАЛА','ОТКАЗ ВТОРИЧНОГО КАНАЛА'],
                   ['ОТКАЗ ВОСХОДЯЩЕГО КАНАЛА','ОТКАЗ РАДИОВЫСОТОМЕРА','ОТКАЗ КОНТРОЛЯ РПДП','СКОРОСТЬ ПОЛЕТА ВЫШЕ МАКС.','ПЕРЕГРЕВ АКБ','РЕЗЕРВ'],
                   ['РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ','РЕЗЕРВ']];
                  
    for (let i=0;i<=2;i=i+1) cont.push( <tr className='trWarning' key={i+1}><WarningMainItem key={i+1} val={titles[i]} warningMes={result[i]}/></tr>);
               return ( cont );   
 }
 
 const WarningMainItem=(props) => {
    const cont=[];
    let value='';
 
    for(let i=0;i<=5;i++) {
     switch(props.warningMes[i]) {
       case 10: { value='СКОРОСТЬ ПОЛЕТА ВЫШЕ МАКС.'; break;}
       case 11: { value='СКОРОСТЬ ПОЛЕТА НИЖЕ МИН.'; break;}
       default: value=props.val[i];
     }
 
      cont.push(<td className='textStyle tdWarning' style={{backgroundColor : (props.warningMes[i] !== false) ? networkParam.yellow : 'transparent' , 
                                                            border: (props.warningMes[i] !== false) ? '1px solid white' : '1px solid #535353'}} key={i+1}>
                       <div className='divTd' style={{color: (props.warningMes[i] !== false) ? 'black' : '#535353'}}> {value}</div>
               </td>)}
     return ( cont );
 }

    return (
      <div className='headerDiv fullWidth'>
        <div className='alertNotif fullWidth'>
          
          <table className='tableAlert'>
            <AlertDiv/>
          </table>
        </div>
        <div className='warningNotif fullWidth'>
          <table className='tableWarning'>
            <WarningDiv/>
          </table>
        </div>
      </div>
    )
}