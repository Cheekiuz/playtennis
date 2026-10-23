/** Shared browser-side extractor used by the bookmarklet and userscript. */
export function facebookEventExtractSource(catchUrl: string): string {
  const target = catchUrl.replace(/\/$/, "");
  return `
(function(){
  function meta(sel){
    var el=document.querySelector(sel);
    return el && (el.getAttribute('content')||el.content)||'';
  }
  function jsonLd(){
    var nodes=document.querySelectorAll('script[type="application/ld+json"]');
    for (var i=0;i<nodes.length;i++){
      try{
        var data=JSON.parse(nodes[i].textContent||'');
        var list=Array.isArray(data)?data:[data];
        for (var j=0;j<list.length;j++){
          var row=list[j];
          if (!row) continue;
          if (row['@type']==='Event' || (Array.isArray(row['@type']) && row['@type'].indexOf('Event')>=0)) return row;
        }
      }catch(e){}
    }
    return null;
  }
  function textDate(){
    var body=(document.body && document.body.innerText)||'';
    var m=body.match(/\\b(20\\d{2})[-.\\/](\\d{1,2})[-.\\/](\\d{1,2})\\b/);
    if (m) return m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2);
    m=body.match(/\\b(\\d{1,2})\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(20\\d{2})\\b/i);
    if (m){
      var months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
      var mo=months[m[2].toLowerCase()];
      return m[3]+'-'+('0'+mo).slice(-2)+'-'+('0'+m[1]).slice(-2);
    }
    return '';
  }
  var ld=jsonLd();
  var url=(location.href||'').split('?')[0];
  if (!/facebook\\.com\\/events\\/\\d+/i.test(url)){
    alert('Open a Facebook event page first (URL should contain /events/123...).');
    return;
  }
  var title=(ld && ld.name) || meta('meta[property="og:title"]') || document.title || '';
  title=title.replace(/\\s*\\|\\s*Facebook\\s*$/i,'').trim();
  var start=(ld && ld.startDate) || meta('meta[property="event:start_time"]') || '';
  var end=(ld && ld.endDate) || meta('meta[property="event:end_time"]') || start;
  var desc=(ld && ld.description) || meta('meta[property="og:description"]') || meta('meta[name="description"]') || '';
  var venue='';
  var city='';
  if (ld && ld.location){
    if (typeof ld.location==='string') venue=ld.location;
    else {
      venue=ld.location.name||'';
      city=(ld.location.address && (ld.location.address.addressLocality||ld.location.address.addressRegion))||'';
    }
  }
  if (!city && /SEB Arena|Vilnius|Kaunas|Klaip/i.test((document.body && document.body.innerText)||'')){
    if (/Kaunas/i.test(document.body.innerText)) city='Kaunas';
    else if (/Klaip/i.test(document.body.innerText)) city='Klaipėda';
    else if (/Vilnius|SEB Arena|Sportima/i.test(document.body.innerText)) city='Vilnius';
  }
  if (!start) start=textDate();
  if (!start){
    alert('Could not find the event date on this page. Wait for it to finish loading, then try again.');
    return;
  }
  var payload={
    title:title,
    startDate:String(start).slice(0,10),
    endDate:String(end||start).slice(0,10),
    city:city||'',
    venue:venue||'',
    description:desc||'',
    url:url
  };
  var encoded=btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
  location.href=${JSON.stringify(target)}+'#fb='+encoded;
})();`.replace(/\n/g, "").replace(/\s+/g, " ").trim();
}
