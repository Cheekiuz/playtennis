/** Compact bookmarklet extractor. Prefer the Tampermonkey userscript on Facebook. */
export function facebookEventExtractSource(catchUrl: string): string {
  const target = catchUrl.replace(/\/$/, "");
  return `
(function(){
  function meta(sel){var el=document.querySelector(sel);return el&&(el.getAttribute('content')||el.content)||'';}
  function jsonLd(){
    var nodes=document.querySelectorAll('script[type="application/ld+json"]');
    for(var i=0;i<nodes.length;i++){
      try{
        var data=JSON.parse(nodes[i].textContent||'');
        var list=Array.isArray(data)?data:[data];
        for(var j=0;j<list.length;j++){
          var row=list[j];
          if(!row)continue;
          if(row['@type']==='Event'||(Array.isArray(row['@type'])&&row['@type'].indexOf('Event')>=0))return row;
        }
      }catch(e){}
    }
    return null;
  }
  function fmt(d){return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Vilnius',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);}
  function toDate(v){
    if(!v)return '';
    v=String(v).trim();
    if(/^\\d{4}-\\d{2}-\\d{2}$/.test(v))return v;
    var m=v.match(/^(\\d{4}-\\d{2}-\\d{2})[T\\s]/);
    if(m){
      if(/[zZ]|[+\\-]\\d{2}:?\\d{2}$/.test(v)){var p=Date.parse(v);if(isFinite(p))return fmt(new Date(p));}
      return m[1];
    }
    if(/^\\d{10}$/.test(v))return fmt(new Date(Number(v)*1000));
    if(/^\\d{13}$/.test(v))return fmt(new Date(Number(v)));
    var p=Date.parse(v);return isFinite(p)?fmt(new Date(p)):'';
  }
  function mainText(){
    var main=document.querySelector('[role="main"]')||document.querySelector('main');
    return ((main&&main.innerText)||(document.body&&document.body.innerText)||'').slice(0,4000);
  }
  function textDate(text){
    var m=text.match(/\\b(\\d{1,2})\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(20\\d{2})\\b/i);
    if(m){var months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};return m[3]+'-'+('0'+months[m[2].toLowerCase()]).slice(-2)+'-'+('0'+m[1]).slice(-2);}
    m=text.match(/\\b(spalio|sausio|vasario|kovo|balandžio|gegužės|birželio|liepos|rugpjūčio|rugsėjo|lapkričio|gruodžio)\\s+(\\d{1,2})/i);
    if(m){var lt={sausio:1,vasario:2,kovo:3,'balandžio':4,'gegužės':5,'birželio':6,liepos:7,'rugpjūčio':8,'rugsėjo':9,spalio:10,'lapkričio':11,'gruodžio':12};var y=(text.match(/\\b(20\\d{2})\\b/)||[])[1]||new Date().getFullYear();return y+'-'+('0'+lt[m[1].toLowerCase()]).slice(-2)+'-'+('0'+m[2]).slice(-2);}
    return '';
  }
  var ld=jsonLd();
  var id=(location.href.match(/\\/events\\/(?:[^/]+\\/)?(\\d{8,})/i)||[])[1];
  if(!id){alert('Open a Facebook event page first.');return;}
  var url='https://www.facebook.com/events/'+id;
  var title=((ld&&ld.name)||meta('meta[property="og:title"]')||document.title||'').replace(/\\s*\\|\\s*Facebook\\s*$/i,'').trim();
  var scoped=mainText();
  var start=toDate(ld&&ld.startDate)||toDate(meta('meta[property="event:start_time"]'))||textDate(scoped);
  var end=toDate(ld&&ld.endDate)||toDate(meta('meta[property="event:end_time"]'))||start;
  if(!start){alert('Could not find the event date.');return;}
  var payload={title:title,startDate:start,endDate:end||start,city:'',venue:'',description:(ld&&ld.description)||meta('meta[property="og:description"]')||'',url:url};
  var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
  location.href=${JSON.stringify(target)}+'#fb='+encoded;
})();`.replace(/\n/g, "").replace(/\s+/g, " ").trim();
}
