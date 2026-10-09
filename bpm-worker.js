importScripts('bpm-logic.js?v=45845db63070');
self.onmessage=event=>{try{const {samples,rate}=event.data;self.postMessage({result:BPMLogic.analyze(samples,rate)});}catch(error){self.postMessage({error:error.message});}};
