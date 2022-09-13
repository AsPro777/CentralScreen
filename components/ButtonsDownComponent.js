import React, { Component , useState, useEffect , useRef } from 'react';
import '../Style.css';
import * as signalR from "@aspnet/signalr";
import { connect } from 'react-redux';
import { Modal , Button } from 'react-bootstrap';
import {getStyle, getPseudoStyle} from '../style-utils.js'

function ButtonsDownComponent(props){
  const [idTarget , setIdTarget] = useState(0);/*id нажатой кнопки для того чтобы определить какой именно ползунок отображать*/
  const [classToggle , setClassToggle] = useState('');/*установка класса для ползунка (для верного отображения текста на нем) */
  const [classToggleColor , setClassToggleColor] = useState('');/*установка класса для ползунка (для верного отображения цвета кнопки на нем) */

  /*получаем переменную из css-файла */
  let root = document.querySelector(':root');
  let rootStyles = getComputedStyle(root);
  let green = rootStyles.getPropertyValue('--greenColor');
  let red = rootStyles.getPropertyValue('--redColor');
  let yellow = rootStyles.getPropertyValue('--yellowColor');
  const color=[green , green , green, yellow , green , red];/*массив цветов для каждой из кнопок внизу. Если из веб-сокета для кнопки СТОП БВС придет true то задействовать цвет yellow*/

/*кликнули по кнопке внизу */
function clickFooterBut (event){ 
    clearInterval(props.timerRef.current);
    props.timerRef.current=0; 
    setClassToggle('classTarget'+event.target.id);
    setIdTarget(event.target.id);
    props.clickFunc.current(true);
    /*setFlagClick(1);*/
    const tim=setTimeout(clearToogle,3000);
    props.timerRef.current=tim;
  
    if(props.mas[event.target.id-1]==false) setClassToggleColor('classNormal');
    else setClassToggleColor('classAlert'+event.target.id);
  }

  function clearToogle () {
    props.clickFunc.current(false);
    clearInterval(props.timerRef.current);
    props.timerRef.current=0;
  }

  
const switches = new WeakMap();

/*данная функция привязывается к событию когда происходит перетаскивание ползунка */
const dragging = event => {
  const elements = document.querySelectorAll('.gui-switch');
  elements.forEach(guiswitch => {
    let checkbox = guiswitch.querySelector('input')
    let thumbsize = getPseudoStyle(checkbox, 'width')
    let padding = getStyle(checkbox, 'padding-left') + getStyle(checkbox, 'padding-right')
  
    switches.set(guiswitch, {
      thumbsize,
      padding,
      bounds: {
        lower: 0,
        middle: (checkbox.clientWidth - padding) / 4,
        upper: checkbox.clientWidth - thumbsize - padding,
      },
    })
  })

  let {thumbsize, bounds, padding} = switches.get(event.target.parentElement);

  let directionality = getStyle(event.target, '--isLTR')

  let track = (directionality === -1)
    ? (event.target.clientWidth * -1) + thumbsize + padding
    : 0

  let pos = Math.round(event.offsetX - thumbsize / 2)

  if (pos < bounds.lower) pos = 0
  if (pos > bounds.upper) pos = bounds.upper

  event.target.style.setProperty('--thumb-position', `${track + pos}px`);
}

/*функция привязывается к событию когда нажата клавиша мыши */
const dragInit = event => {
  event.target.addEventListener('pointermove', dragging)
  event.target.style.setProperty('--thumb-transition-duration', '0s')
}


  /*данная функция привязывается к событию когда кнопка мыши отпущена */
const dragEnd = (event) => {  
    let footerParam=event.target.getAttribute('data-addr');
    event.target.style.removeProperty('--thumb-transition-duration')
    event.target.style.removeProperty('--thumb-position')
    event.target.removeEventListener('pointermove', dragging)
    props.sendFooterClick.current(footerParam);
    props.clickFunc.current(false);
  }




/*кнопки внизу экрана*/
const ButtonsDown= () => {
    const cont=[];    
    const titles=['АВТОМ. УПР. ВКЛ.','ВКЛ. СИГН. БЕДСТВИЕ','ПРЕКРАТИТЬ ВЗЛЕТ','СТОП БВС','ПОВТОРНЫЙ ЗАХОД НА ПОСАДКУ','АВАРИЙНЫЙ СБРОС ГРУЗА'];
    const address=['enableAutomaticControl','enableDistressSignal','stopTakeoff','stopUav','reLanding','emergencyCargoDischarge'];
    for (let i=0;i<6;i=i+1) cont.push(<ButtonsDownItem key={i+1} isClick={props.isClicked} id={i+1} val={titles[i]} arr={props.mas[i]} color={color[i]} addr={address[i]}/>);
    return ( cont );
  }
  
  const ButtonsDownItem = (props) => { 
    return (<div className='allFooterButtons'>
      <div  style={{display:((props.isClick==true) && (idTarget==props.id)) ? 'none' : 'inline-block'}}>
        <div onClick={clickFooterBut } className='circleZumm circleButton' id={props.id} style={{background: (props.arr==false) ? 'transparent' : props.color}}>
          <div onClick={clickFooterBut} id={props.id} className= {((props.id==4) && (props.arr==true)) ? 'textStyle fullWidth buttonStyle buttonYellow' : 'textStyle fullWidth buttonStyle buttonRedGreen' }>{props.val}</div>
        </div>
      </div>
      <div className='classToggle' style={{display:((props.isClick==true) && (idTarget==props.id)) ? 'inline-block' : 'none'}} id={props.id}>
        <label htmlFor='switch-vertical' className="gui-switch -vertical">
          <input onPointerDown={dragInit} onPointerUp={dragEnd} role="switch"  data-addr={props.addr} id="switch-vertical"  className={classToggle+' '+classToggleColor} type="checkbox" />
        </label>
      </div>
    </div>
    )
  }

  console.log(props.mas);

   return (
    <ButtonsDown/>
   )

}

export default React.memo(ButtonsDownComponent);