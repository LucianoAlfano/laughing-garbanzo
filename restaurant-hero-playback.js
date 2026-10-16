(function(){
'use strict';
var v=document.querySelector('video.hero-video-bg'),h=v&&v.closest('.hero-video');if(!v)return;
var mobile=/iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent)||((navigator.maxTouchPoints||0)>0&&Math.min(screen.width,screen.height)<768);
var desktop='Restaurant-Home-Video.mp4',src=mobile?'Restaurant-Home-Video-Mobile.mp4':desktop;
var pending=false,failedOver=false;
function mute(){if(!v.muted)v.muted=true;if(!v.defaultMuted)v.defaultMuted=true;if(v.volume!==0)v.volume=0;}
function message(text){var s=document.getElementById('hero-playback-status');if(s){s.textContent=text;s.hidden=!text;}}
function play(){if(pending||document.hidden)return;mute();pending=true;var p=v.play();if(p&&p.then)p.then(function(){pending=false;message('');}).catch(function(e){pending=false;if(e.name==='NotAllowedError')message('Tap anywhere in this section to start the silent film.');});else pending=false;}
v.addEventListener('volumechange',mute);
v.addEventListener('playing',function(){pending=false;message('');});
v.addEventListener('canplay',play);
v.addEventListener('error',function(){pending=false;if(mobile&&!failedOver){failedOver=true;v.src=desktop;v.load();play();}else message('The background film is unavailable.');});
// Keep the chosen mobile source through rotation; do not reload on resize.
v.controls=false;v.playsInline=true;mute();v.src=src;v.load();play();
// Repeated gestures are allowed: an early touch may happen before data is ready.
['touchend','click','keydown'].forEach(function(event){h.addEventListener(event,function(){if(v.paused)play();},{passive:true});});
document.addEventListener('visibilitychange',function(){if(!document.hidden)play();});
window.addEventListener('pageshow',play);
})();
