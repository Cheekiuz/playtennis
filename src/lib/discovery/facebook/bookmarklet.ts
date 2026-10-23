/** Generates the bookmarklet javascript: URL. Keep this self-contained for the browser. */
export function facebookEventBookmarklet(catchBaseUrl: string): string {
  const catchUrl = catchBaseUrl.replace(/\/$/, "");
  // Beautified source kept as a compact string for the bookmark.
  const source = `
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
  var ld=jsonLd();
  var url=(location.href||'').split('?')[0];
  if (!/facebook\\.com\\/events\\/\\d+/i.test(url)){
    alert('Open a Facebook event page first (URL should contain /events/123...).');
    return;
  }
  var title=(ld && ld.name) || meta('meta[property="og:title"]') || document.title || '';
  title=title.replace(/\\s*\\|\\s*Facebook\\s*$/i,'').trim();
  var start=(ld && ld.startDate) || meta('meta[property="event:start_time"]') || meta('meta[property="og:updated_time"]') || '';
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
  if (!start){
    var m=desc.match(/\\b(20\\d{2})[-.\\/](\\d{1,2})[-.\\/](\\d{1,2})\\b/) || desc.match(/\\b(\\d{1,2})[-.\\/](\\d{1,2})[-.\\/](20\\d{2})\\b/);
    if (m){
      if (m[1].length===4) start=m[1]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[3]).slice(-2);
      else start=m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);
    }
  }
  if (!start){
    alert('Could not find the event date on this page. Make sure the event page fully loaded, then try again.');
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
  location.href=${JSON.stringify(catchUrl)}+'#fb='+encoded;
})();`.replace(/\n/g, "").replace(/\s+/g, " ").trim();

  return `javascript:${encodeURIComponent(source)}`;
}
