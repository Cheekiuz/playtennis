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
    var off=v.match(/^(\\d{4}-\\d{2}-\\d{2})T[0-9:.]+[+\\-]\\d{2}:?\\d{2}$/);
    if(off)return off[1];
    if(/^(\\d{4}-\\d{2}-\\d{2})T[0-9:.]+Z$/i.test(v)){var p=Date.parse(v);return isFinite(p)?fmt(new Date(p)):'';}
    var m=v.match(/^(\\d{4}-\\d{2}-\\d{2})[T\\s]/);if(m)return m[1];
    if(/^\\d{10}$/.test(v))return fmt(new Date(Number(v)*1000));
    if(/^\\d{13}$/.test(v))return fmt(new Date(Number(v)));
    var p=Date.parse(v);return isFinite(p)?fmt(new Date(p)):'';
  }
  var ld=jsonLd();
  var id=(location.href.match(/\\/events\\/(?:[^/]+\\/)?(\\d{8,})/i)||[])[1];
  if(!id){alert('Open a Facebook event page first.');return;}
  var url='https://www.facebook.com/events/'+id;
  var title=((ld&&ld.name)||meta('meta[property="og:title"]')||document.title||'').replace(/\\s*\\|\\s*Facebook\\s*$/i,'').trim();
  var html=document.documentElement.innerHTML;
  var ts=(html.match(new RegExp('"event_id"\\\\s*:\\\\s*"?'+id+'"?[\\\\s\\\\S]{0,2500}?"start_timestamp"\\\\s*:\\\\s*(\\\\d{10})','i'))||html.match(new RegExp('"start_timestamp"\\\\s*:\\\\s*(\\\\d{10})[\\\\s\\\\S]{0,2500}?"event_id"\\\\s*:\\\\s*"?'+id+'"?','i'))||[])[1];
  var start=toDate(ts)||toDate(ld&&ld.startDate)||toDate(meta('meta[property="event:start_time"]'));
  var end=toDate(ld&&ld.endDate)||toDate(meta('meta[property="event:end_time"]'))||start;
  if(!start){alert('Could not find the event date.');return;}
  if(!confirm('Save to PlayTennis?\\n\\n'+title+'\\nDate: '+start))return;
  var payload={title:title,startDate:start,endDate:end||start,city:'',venue:'',description:(ld&&ld.description)||meta('meta[property="og:description"]')||'',url:url};
  var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
  location.href=${JSON.stringify(target)}+'#fb='+encoded;
})();`.replace(/\n/g, "").replace(/\s+/g, " ").trim();
}
