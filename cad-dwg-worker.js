import {openDwg,openProject,saveDrawing} from './cad-dwg-model.js?v=3d63a6694c6e';
import './cad-logic.js?v=3fa3c3c4944c';

self.onmessage=event=>{const {id,action,data}=event.data;try{let result;if(action==='open')result=openDwg(data.bytes);else if(action==='project')result=openProject(data.source);else if(action==='save')result=saveDrawing({...data,objects:self.CadLogic.validate(data.objects)});else throw Error('无法识别的图纸操作');if(result.bytes)self.postMessage({id,result},[result.bytes.buffer]);else self.postMessage({id,result});}catch(error){self.postMessage({id,error:error.message||'图纸处理失败'});}};
