var thredshold = 0.15;

function parched(){//dry run
  let t0 = new Date().getTime();
  let dry = fuzzywozzy("puppy","happy,tappy,flappy");
  let dt = new Date().getTime() - t0;
  doGet({
    "queryString":"w=puppy&ws=happy,scrappy,flappy",
    "parameter":{"w":"puppy","ws":"happy,scrappy,flappy"},
    "contextPath":"",
    "contentLength":-1,
    "parameters":{"w":["puppy"],"ws":["happy,scrappy,flappy"]}
  });
  Logger.log(dt+" ms; "+JSON.stringify(dry));
}
function LevenshteinDistance(w1,w2,tolerance) { //https://www.tutorialspoint.com/levenshtein-distance-in-javascript
  const track = Array(w2.length + 1).fill(0).map(() =>
    Array(w1.length + 1).fill(0));
  for (let i = 0; i <= w1.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= w2.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= w2.length; j += 1) {
    for (let i = 1; i <= w1.length; i += 1) {
      const indicator = w1[i - 1] === w2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
              track[j][i - 1] + 1, // deletion
              track[j - 1][i] + 1, // insertion
              track[j - 1][i - 1] + indicator, // substitution
      );
    }
    let hopoff = Math.min(track[j].slice(j+1));
    if( hopoff > tolerance ) return [tolerance+"+",false];
  }
  return [track[w2.length][w1.length],true];
}
function SpecialCharByChar(w1,w2){ 
  let ws1 = w1.split('');
  let ws2 = w2.split('');
  for(let i=0;i<w1.length;i++){
    if( ws1[i] != ws2[i] )  return [w1.length+w2.length,false];
  }
  return [0,true];
}
function ContainedWithin(shorter,longer){
  let re = new RegExp(shorter);
  return re.test(longer) ? [longer.length-shorter.length,true] : [longer.length+shorter.length,false];
}
function SpecialWordByWord(w1,w2){
}

function fuzzywozzy(wSubject,ws){
  let wordy = /,/;
  var wCompare = [ws];
  if ( wordy.test(ws) ) wCompare = ws.split(wordy);
  // The object to be returned as JSON
  let response = {
    origin : wSubject,
    overview : {},
    scores : {}
  };
  
  let t0 = new Date().getTime();
  let best = wSubject.length + ws.length;
  // Fill the dict with requested matching
  for (var i = 0; i < wCompare.length; i++){ 
    //sheetData = productQuery(prodIds[i])
    //product = formatProduct(sheetData)
    maxChange = Math.ceil( wSubject.length*thredshold+wCompare[i].length*thredshold );
    if( wSubject == wCompare[i] ){
      response.scores[ wCompare[i] ] = 0;
      break;
    }
    if( wSubject.length != wCompare[i].length ){
      d = ( wSubject.length<wCompare[i].length ) ? ContainedWithin(wSubject,wCompare[i]) : ContainedWithin(wCompare[i],wSubject);
      response.scores[ wCompare[i] ] = d[0];
      //if( d[1] ) break;
    }
    d = LevenshteinDistance(wSubject,wCompare[i], (best<maxChange) ? best : maxChange );
    response.scores[ wCompare[i] ] = d[0];
    best = (d[0]<best) ? d[0] : best;
  }
  let dt = new Date().getTime() - t0;
  response.overview = {"best":best,"time":dt};
  return response;
}

const summarize = (key,r) => ({"bigN":Object.keys(r[key]),"text":JSON.stringify(r)});
const success = (e,v) => ContentService.createTextOutput(e+v);
const errorNoHit = (v) => success("Invalid Request- no candidate found.<br>",v);
const errorGet = (v) => success("Invalid Request- provide both the subject word and the compare words.<br>",v);
function doGet(request) {
  // Check for a valid request URI
  if (request.parameter === undefined){
    return ContentService.createTextOutput('Invalid Request.<br>'+JSON.stringify(request));
  }
  const task = request.parameter.action;
  // ContentService.createTextOutput();
  if (request.parameter.action === undefined){
    return ContentService.createTextOutput('Invalid Request. Use an "action" parameter.<br>'+JSON.stringify(request));
  }
  if (request.parameter.action == 'get'){
    if (request.parameter.w !== undefined && request.parameter.ws !== undefined){
      // The object to be returned as JSON
      response = fuzzywozzy(request.parameter.w,request.parameter.ws);

      let summary = summarize('score',response);
      return ( summary.bigN > 0 ) ? success(summary.text) : errorNoHit(summary.text);
    } else {
      return errorGet(JSON.stringify(request));
    }
  }
  if (request.parameter.action == 'read'){
    
  }
}
