(function(){
"use strict";
var $=function(id){return document.getElementById(id);};
var rows=window.DSNY_DATA;
var STORE_KEY="dsny_review_log_v1";
var PAGE=25, shownCount=PAGE;
var log={}, memoryOnly=false;

// ---- data check (failure path) ----
function fail(msg){
  var e=$("loadError");e.hidden=false;e.textContent=msg;
  ["flagN","lateDays","cap","more","export","clear"].forEach(function(i){$(i).disabled=true;});
}
if(!Array.isArray(rows)||rows.length===0){fail("The data file could not be loaded, so the tool cannot run. Reload the page; if this continues, the data.js file is missing.");return;}

var data=rows.map(function(r){return {key:r[0],created:r[1],closed:r[2],days:r[3]};});
var dates=data.map(function(r){return Date.parse(r.created);});
var windowDays=Math.round((Math.max.apply(null,dates)-Math.min.apply(null,dates))/86400000)+1;

// ---- storage (fallback path) ----
function loadLog(){
  try{var s=window.localStorage.getItem(STORE_KEY);log=s?JSON.parse(s):{};}
  catch(e){memoryOnly=true;log={};}
}
function saveLog(){
  if(memoryOnly)return;
  try{window.localStorage.setItem(STORE_KEY,JSON.stringify(log));}catch(e){memoryOnly=true;showStorageNote();}
}
function showStorageNote(){
  $("storageNote").textContent=memoryOnly?"Notice: this browser is blocking storage, so reviews will not be kept after you close or reload the page. Export the CSV before leaving.":"";
}

// ---- inputs with validation ----
function readNum(id,errId,min,max){
  var el=$(id),raw=el.value.trim(),n=Number(raw),err=$(errId);
  if(raw===""||!isFinite(n)||n<min||n>max){
    err.textContent="Enter a number from "+min+" to "+max+".";el.setAttribute("aria-invalid","true");return null;
  }
  err.textContent="";el.removeAttribute("aria-invalid");return n;
}
var last={N:5,L:5,C:5};
function readSettings(){
  var N=Number($("flagN").value);
  var L=readNum("lateDays","err-late",1,10);
  var C=readNum("cap","err-cap",0.5,100);
  if(L===null)L=last.L; if(C===null)C=last.C;
  last={N:N,L:L,C:C};return last;
}

// ---- calculations ----
function stats(N,L){
  var flagged=0,truly=0,late=0;
  data.forEach(function(r){
    if(r.days>L)late++;
    if(r.days>N){flagged++;if(r.days>L)truly++;}
  });
  return {flagged:flagged,perDay:flagged/windowDays,precision:flagged?truly/flagged:0,recall:late?truly/late:0,late:late};
}
function pct(x){return (x*100).toFixed(1)+"%";}
function fmtInt(x){return x.toLocaleString("en-US");}

// ---- rendering ----
function card(v,l){var d=document.createElement("div");d.className="card";var a=document.createElement("div");a.className="v";a.textContent=v;var b=document.createElement("div");b.className="l";b.textContent=l;d.appendChild(a);d.appendChild(b);return d;}
function renderResult(s){
  var st=stats(s.N,s.L),box=$("cards");box.textContent="";
  box.appendChild(card(fmtInt(st.flagged),"requests flagged"));
  box.appendChild(card(st.perDay.toFixed(1),"flagged per day"));
  box.appendChild(card(pct(st.precision),"of flags truly late (> "+s.L+" days)"));
  box.appendChild(card(pct(st.recall),"of late requests caught ("+fmtInt(st.late)+" late)"));
  var v=$("verdict");
  if(st.perDay<=s.C){v.className="verdict ok";v.textContent="Fits your cap: "+st.perDay.toFixed(1)+" flagged per day is at or below "+s.C+".";}
  else{v.className="verdict over";v.textContent="Over your cap: "+st.perDay.toFixed(1)+" flagged per day is above "+s.C+" (by "+(st.perDay-s.C).toFixed(1)+" per day). Raise N or the cap.";}
  $("windowNote").textContent="Window: "+windowDays+" days of requests ("+fmtInt(data.length)+" requests). Per-day figures divide by "+windowDays+".";
}
function renderCompare(s){
  var tb=$("compareTable").tBodies[0];tb.textContent="";
  for(var n=2;n<=6;n++){
    var st=stats(n,s.L),tr=document.createElement("tr");if(n===s.N)tr.className="sel";
    [String(n),fmtInt(st.flagged),st.perDay.toFixed(1),pct(st.precision),pct(st.recall),st.perDay<=s.C?"yes":"no"].forEach(function(t,i){
      var c=document.createElement(i===0?"th":"td");if(i===0)c.scope="row";c.textContent=t;tr.appendChild(c);});
    tb.appendChild(tr);
  }
}
function renderDist(s){
  var b=[["0",0,0],["1",1,1],["2",2,2],["3",3,3],["4",4,4],["5",5,5],["6-7",6,7],["8+",8,99]],box=$("dist");box.textContent="";
  b.forEach(function(x){
    var n=data.filter(function(r){return r.days>=x[1]&&r.days<=x[2];}).length,share=n/data.length;
    var row=document.createElement("div");row.className="bar"+(x[1]>s.L?" tail":"");
    var l=document.createElement("span");l.textContent=x[0]+" d";
    var t=document.createElement("span");t.className="track";var f=document.createElement("span");f.className="fill";f.style.display="block";f.style.width=(share*100).toFixed(1)+"%";t.appendChild(f);
    var v=document.createElement("span");v.textContent=(share*100).toFixed(1)+"%";
    row.appendChild(l);row.appendChild(t);row.appendChild(v);box.appendChild(row);
  });
}
var OUTCOMES=[["","Not reviewed"],["missed","Collection confirmed missed"],["collected","Already collected"],["unknown","Cannot tell"]];
function renderFlags(s){
  var list=data.filter(function(r){return r.days>s.N;}).sort(function(a,b){return b.days-a.days||a.key-b.key;});
  var tb=$("flagTable").tBodies[0];tb.textContent="";
  list.slice(0,shownCount).forEach(function(r){
    var tr=document.createElement("tr");
    [String(r.key),r.created,r.closed,String(r.days)].forEach(function(t){var c=document.createElement("td");c.textContent=t;tr.appendChild(c);});
    var saved=log[r.key]||{};
    var c5=document.createElement("td"),sel=document.createElement("select");sel.setAttribute("aria-label","Review outcome for request "+r.key);
    OUTCOMES.forEach(function(o){var op=document.createElement("option");op.value=o[0];op.textContent=o[1];if((saved.outcome||"")===o[0])op.selected=true;sel.appendChild(op);});
    c5.appendChild(sel);tr.appendChild(c5);
    var c6=document.createElement("td"),inp=document.createElement("input");inp.type="text";inp.maxLength=140;inp.value=saved.note||"";inp.setAttribute("aria-label","Note for request "+r.key);c6.appendChild(inp);tr.appendChild(c6);
    var c7=document.createElement("td"),btn=document.createElement("button");btn.type="button";btn.textContent="Save";
    btn.addEventListener("click",function(){
      if(sel.value===""&&inp.value.trim()===""){delete log[r.key];}
      else{log[r.key]={key:r.key,outcome:sel.value,note:inp.value.trim().slice(0,140),savedAt:new Date().toISOString()};}
      saveLog();renderSummary();btn.textContent="Saved";setTimeout(function(){btn.textContent="Save";},1200);
    });
    c7.appendChild(btn);tr.appendChild(c7);tb.appendChild(tr);
  });
  $("shown").textContent="Showing "+Math.min(shownCount,list.length)+" of "+fmtInt(list.length)+" flagged requests.";
  $("more").hidden=shownCount>=list.length;
}
var MIN_REVIEWS=20,SCALE=0.6,REVISE=0.3;
function renderSummary(){
  var vals=Object.keys(log).map(function(k){return log[k];}).filter(function(e){return e.outcome;});
  var missed=vals.filter(function(e){return e.outcome==="missed";}).length,collected=vals.filter(function(e){return e.outcome==="collected";}).length,unk=vals.filter(function(e){return e.outcome==="unknown";}).length;
  var box=$("summary");box.textContent="";
  var p1=document.createElement("p");p1.textContent="Reviewed: "+vals.length+" (confirmed missed "+missed+", already collected "+collected+", cannot tell "+unk+").";box.appendChild(p1);
  var p2=document.createElement("p");
  if(vals.length<MIN_REVIEWS){p2.textContent="Review at least "+MIN_REVIEWS+" flagged requests before reading a result ("+(MIN_REVIEWS-vals.length)+" more).";}
  else{
    var share=missed/vals.length,msg;
    if(share>=SCALE)msg="Supports scaling the pilot.";else if(share>=REVISE)msg="Revise the flag or check closing practice before scaling.";else msg="Stop, or fix closing practice first.";
    p2.textContent="Share confirmed missed: "+pct(share)+". "+msg+" (Assumed thresholds: scale at "+(SCALE*100)+"% or more, revise at "+(REVISE*100)+"% to under "+(SCALE*100)+"%, stop below "+(REVISE*100)+"%. A small review sample is not proof.)";
  }
  box.appendChild(p2);
}
// ---- export with CSV-injection guard ----
function csvCell(v){
  var s=String(v==null?"":v).replace(/[\r\n]+/g," ");
  if(/^[=+\-@\t]/.test(s))s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
$("export").addEventListener("click",function(){
  var items=Object.keys(log).map(function(k){return log[k];});
  var out=["unique_key,outcome,note,saved_at"];
  items.forEach(function(e){out.push([e.key,e.outcome,e.note,e.savedAt].map(csvCell).join(","));});
  var blob=new Blob([out.join("\r\n")],{type:"text/csv"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="review_log.csv";document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(function(){URL.revokeObjectURL(a.href);},500);
});
var armed=false;
$("clear").addEventListener("click",function(){
  var m=$("clearMsg");
  if(!armed){armed=true;m.textContent="Click Clear again within 5 seconds to delete all saved reviews.";setTimeout(function(){armed=false;m.textContent="";},5000);return;}
  log={};saveLog();armed=false;m.textContent="Review log cleared.";refresh();
});
$("more").addEventListener("click",function(){shownCount+=PAGE;refresh();});

function refresh(){
  var s=readSettings();
  renderResult(s);renderCompare(s);renderDist(s);renderFlags(s);renderSummary();
}
["flagN","lateDays","cap"].forEach(function(id){$(id).addEventListener("input",function(){shownCount=PAGE;refresh();});});
loadLog();showStorageNote();refresh();
})();
