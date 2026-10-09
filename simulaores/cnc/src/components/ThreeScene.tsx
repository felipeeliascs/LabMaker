'use client';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MachineState } from '@/lib/machine/machineState';
import { UR5State } from '@/lib/machine/ur5State';
import { BED } from '@/lib/machine/cutProgram';
import { createRenderScheduler } from '@/lib/machine/renderScheduler';
import styles from './Simulator.module.css';
export interface SceneHandle { resetView: () => void; loadRobot: () => void }
interface Props {
  onProgress: (_p: number) => void; onLoaded: () => void;
  machineState: MachineState; ur5State: UR5State; onToggleDoor: () => void;
  onUr5TcpUpdate?: (_c: {x:number;y:number;z:number}) => void;
  onRobotStatus: (_s: string) => void;
}
type Quality = 'auto' | 'low' | 'normal';
export default forwardRef<SceneHandle, Props>(function ThreeScene(props, ref) {
  const hostRef=useRef<HTMLDivElement>(null), labelRef=useRef<HTMLDivElement>(null), metricsRef=useRef<HTMLOutputElement>(null);
  const api=useRef({reset:()=>{},cut:()=>{},robot:()=>{},quality:(_q:Quality)=>{}});
  const callbacks=useRef(props); callbacks.current=props;
  const [error,setError]=useState('');
  const {machineState:machine,ur5State:robot}=props;
  useImperativeHandle(ref,()=>({resetView:()=>api.current.reset(),loadRobot:()=>api.current.robot()}));
  useEffect(()=>{
    const host=hostRef.current;if(!host)return;
    let disposed=false,robotLoading=false,frames=0,suspended=false;
    let proxy:THREE.Mesh|undefined;
    const scene=new THREE.Scene();scene.background=new THREE.Color('#E8ECF0');
    scene.add(new THREE.AmbientLight(0xffffff,0.8));
    const light=new THREE.DirectionalLight(0xffffff,1);light.position.set(5000,-5000,10000);light.castShadow=true;
    light.shadow.mapSize.set(1024,1024);
    Object.assign(light.shadow.camera,{left:-2500,right:2500,top:2500,bottom:-2500,far:20000});scene.add(light);
    const grid=new THREE.GridHelper(5000,50,0xaaaaaa,0xcccccc);grid.rotation.x=Math.PI/2;grid.position.set(860,725,0.5);scene.add(grid);
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(10000,10000),new THREE.MeshStandardMaterial({color:0xf0f0f0,roughness:0.8}));
    floor.position.set(860,725,-1);floor.receiveShadow=true;scene.add(floor);
    const camera=new THREE.PerspectiveCamera(45,1,1,20000);camera.up.set(0,0,1);
    let renderer:THREE.WebGLRenderer;
    try {renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});}
    catch {callbacks.current.onLoaded();setError('Não foi possível iniciar o WebGL neste navegador.');return;}
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
    const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=0.12;
    controls.minDistance=300;controls.maxDistance=10000;
    const sensor=new THREE.Vector3();
    const scheduler=createRenderScheduler(dt=>{
      machine.updateFrame(dt);
      if(robot.loaded){robot.update();callbacks.current.onUr5TcpUpdate?.(robot.tcpCoords);}
      controls.update();renderer.render(scene,camera);frames++;
      if(metricsRef.current)metricsRef.current.textContent=renderer.info.render.triangles.toLocaleString('pt-BR')+' triângulos · '+renderer.info.render.calls+' chamadas · '+frames+' quadros';
      if(labelRef.current&&machine.vibrationSensorMesh){
        machine.vibrationSensorMesh.getWorldPosition(sensor);sensor.z+=15;sensor.project(camera);
        labelRef.current.style.display=sensor.z<1?'block':'none';
        labelRef.current.style.left=(sensor.x*.5+.5)*host.clientWidth+'px';labelRef.current.style.top=(-sensor.y*.5+.5)*host.clientHeight+'px';
      }
      return machine.cutting.status==='running'||Math.abs(machine.porte_cible-machine.porte_progression)>1e-6||(machine.en_marche&&machine.laser_actif);
    });
    const invalidate=()=>scheduler.invalidate();controls.addEventListener('change',invalidate);
    const reset=()=>{camera.position.set(2500,-1800,1800);controls.target.set(860,725,590);controls.update();invalidate();};
    const resize=()=>{
      if(disposed||!host.clientWidth||!host.clientHeight)return;
      camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);invalidate();
    };
    let quality:Quality='auto';
    const setQuality=(q:Quality)=>{
      quality=q;const low=q==='low'||(q==='auto'&&(window.innerWidth<768||navigator.hardwareConcurrency<=4));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio,low?1:1.5));renderer.shadowMap.enabled=!low;
      scene.traverse(o=>{if(o instanceof THREE.Mesh)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);});resize();
    };
    api.current={reset,cut:()=>{
      const x=BED.x+BED.width/2,y=BED.y-BED.height/2;camera.position.set(x,y-500,BED.z+1200);controls.target.set(x,y,BED.z);controls.update();invalidate();
    },quality:setQuality,robot:async()=>{
      if(disposed||robotLoading||robot.loaded)return;robotLoading=true;callbacks.current.onRobotStatus('Carregando robô…');
      const loaded=await robot.loadRobot('/ur5',p=>{if(!disposed)callbacks.current.onRobotStatus('Carregando robô: '+Math.round(p*100)+'%');});
      if(disposed)return;robotLoading=false;
      if(loaded){
        robot.robotGroup.scale.setScalar(1000);robot.robotGroup.position.set(2200,700,0);scene.add(robot.robotGroup);callbacks.current.onRobotStatus('Robô pronto');
        camera.position.set(3300,-2400,2200);controls.target.set(1300,700,700);controls.update();
      }else callbacks.current.onRobotStatus('Falha ao carregar. Tente novamente.');
      invalidate();
    }};
    setQuality('auto');reset();
    machine.initSTLLoader(p=>{if(!disposed)callbacks.current.onProgress(p);});
    void machine.loadMachineComponents().then(loaded=>{
      if(disposed)return;
      if(!loaded){setError('Falha ao carregar os modelos. Recarregue a página para tentar novamente.');callbacks.current.onLoaded();return;}
      scene.add(machine.groupBase,machine.doorPivot);
      const door=machine.getComponent('door')?.mesh;
      if(door){
        const box=door.geometry.boundingBox!,size=box.getSize(new THREE.Vector3());
        proxy=new THREE.Mesh(new THREE.BoxGeometry(size.x,size.y,size.z),new THREE.MeshBasicMaterial({visible:false}));
        proxy.position.copy(box.getCenter(new THREE.Vector3()));door.add(proxy);
      }
      callbacks.current.onProgress(1);callbacks.current.onLoaded();invalidate();
    });
    const observer=new ResizeObserver(()=>setQuality(quality));observer.observe(host);
    // Seleção por caixa: somente 12 triângulos, independente da resolução da tampa.
    const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
    let downX=0,downY=0;
    const down=(e:PointerEvent)=>{downX=e.clientX;downY=e.clientY;};
    const up=(e:PointerEvent)=>{
      if(!proxy||!machine.getComponent('door')?.mesh.visible||Math.hypot(e.clientX-downX,e.clientY-downY)>=4)return;
      const rect=host.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
      raycaster.setFromCamera(mouse,camera);
      if(raycaster.intersectObject(proxy,false).length){callbacks.current.onToggleDoor();invalidate();}
    };
    host.addEventListener('pointerdown',down);host.addEventListener('pointerup',up);
    const visibility=()=>{
      const active=!document.hidden&&!suspended;if(!active)machine.pauseCut();scheduler.setActive(active);
    };
    const message=(e:MessageEvent)=>{
      if(e.source!==window.parent||e.origin!==window.location.origin||e.data?.type!=='labmaker:visibility')return;
      suspended=!e.data.visible;visibility();
    };
    document.addEventListener('visibilitychange',visibility);window.addEventListener('message',message);
    document.addEventListener('input',invalidate);document.addEventListener('click',invalidate);window.addEventListener('cnc:invalidate',invalidate);visibility();
    return()=>{
      disposed=true;scheduler.dispose();observer.disconnect();controls.dispose();
      document.removeEventListener('visibilitychange',visibility);window.removeEventListener('message',message);
      document.removeEventListener('input',invalidate);document.removeEventListener('click',invalidate);window.removeEventListener('cnc:invalidate',invalidate);
      host.removeEventListener('pointerdown',down);host.removeEventListener('pointerup',up);
      scene.remove(machine.groupBase,machine.doorPivot,robot.robotGroup);machine.dispose();robot.dispose();
      grid.geometry.dispose();(grid.material as THREE.Material).dispose();floor.geometry.dispose();floor.material.dispose();
      light.shadow.map?.dispose();scene.clear();renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();
    };
  },[machine,robot]);
  return <div style={{width:'100%',height:'100%',position:'relative'}}>
    <div ref={hostRef} style={{width:'100%',height:'100%'}}/>
    <div className={styles.camera}>
      <button onClick={()=>api.current.cut()} className={styles.button}>Vista de corte</button>
      <button onClick={()=>api.current.reset()} className={styles.button}>Vista geral</button>
      <select aria-label="Qualidade gráfica" className={styles.select} defaultValue="auto" onChange={e=>api.current.quality(e.target.value as Quality)}>
        <option value="auto">Qualidade automática</option><option value="low">Econômica</option><option value="normal">Normal</option>
      </select>
    </div>
    {error&&<div role="alert" className={styles.loading}><div className={styles.loadingBox}>{error}<button className={styles.button} onClick={()=>location.reload()}>Tentar novamente</button></div></div>}
    <div ref={labelRef} className={styles.sensorLabel}>Sensor de vibração</div>
    <details className={styles.metrics}><summary>Desempenho</summary><output ref={metricsRef}/><p>A cena parada não gera novos quadros.</p></details>
  </div>;
});
