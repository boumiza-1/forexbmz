import {getHistoricalRates} from 'dukascopy-node';
import {writeFile} from 'node:fs/promises';
const now=new Date();let result;
try{
const raw=await getHistoricalRates({instrument:'eurusd',dates:{from:new Date(now-3*86400000),to:now},timeframe:'m5',format:'json'});
const bars=raw.map(x=>({t:typeof x.timestamp==='number'?x.timestamp:Date.parse(x.timestamp),c:Number(x.close),h:Number(x.high),l:Number(x.low)})).filter(x=>Object.values(x).every(Number.isFinite)&&x.c>0&&x.h>=x.l).sort((a,b)=>a.t-b.t);
if(bars.length<25)throw Error('Historique insuffisant');
const b=bars.at(-1),avg=n=>bars.slice(-n).reduce((s,x)=>s+x.c,0)/n,dir=Math.sign(avg(9)-avg(21)),range=bars.slice(-14).reduce((s,x)=>s+x.h-x.l,0)/14;
if(!(range>0))throw Error('Amplitude indisponible');
result={source:'Dukascopy',method:'BMZ SMA9/21 et amplitude moyenne 14 bougies',timestamp:new Date(b.t).toISOString(),retrievedAt:now.toISOString(),price:b.c,direction:dir>0?'Hausse':dir<0?'Baisse':'Neutre',targets:dir?[1,2,3].map(n=>b.c+dir*n*range):[],invalidation:dir?b.c-dir*range:null};
}catch(e){result={error:String(e.message||e),retrievedAt:now.toISOString()};}
await writeFile('market-data.json',JSON.stringify(result,null,2));