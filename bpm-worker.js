importScripts('bpm-logic.js?v=cac1797569fb');
self.onmessage=event=>{try{const {samples,rate}=event.data;self.postMessage({result:BPMLogic.analyzeTrack(samples,rate)});}catch(error){self.postMessage({error:error.message});}};
