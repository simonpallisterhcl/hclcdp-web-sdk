"use strict";var p=Object.defineProperty;var I=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var S=Object.prototype.hasOwnProperty;var E=(i,e)=>{for(var t in e)p(i,t,{get:e[t],enumerable:!0})},C=(i,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of f(e))!S.call(i,n)&&n!==t&&p(i,n,{get:()=>e[n],enumerable:!(s=I(e,n))||s.enumerable});return i};var D=i=>C(p({},"__esModule",{value:!0}),i);var T={};E(T,{HclCdp:()=>h});module.exports=D(T);var c=require("uuid");var u={name:"hclcdp-web-sdk",version:"0.0.1",description:"HCL CDP Web SDK",keywords:["HCLCDP"],homepage:"https://github.com/simonpallisterhcl/hclcdp-web-sdk#readme",bugs:{url:"https://github.com/simonpallisterhcl/hclcdp-web-sdk/issues"},repository:{type:"git",url:"git+https://github.com/simonpallisterhcl/hclcdp-web-sdk.git"},license:"MIT",author:"Simon Pallister",type:"module",main:"./dist/hclcdp-web.js",scripts:{build:"tsup"},dependencies:{axios:"^1.7.9",tsup:"^8.3.6",typescript:"^5.7.3","ua-parser-js":"^2.0.2",uuid:"^11.0.5"},devDependencies:{terser:"^5.39.0"}};var v=require("ua-parser-js"),l=class{deviceId=null;userId=null;context=null;config={writeKey:"",cdpEndpoint:"",inactivityTimeout:30,enableSessionLogging:!1};DEVICE_ID="hclcdp_device_id";USER_ID="hclcdp_user_id";constructor(){this.deviceId||(this.deviceId=this.getDeviceId())}init=async e=>{this.config=e,console.log("init",e);let t=(0,v.UAParser)(window.navigator.userAgent);this.context={library:{name:u.name,type:"javascript",version:u.version},userAgent:{deviceType:t.device.type||"Desktop",osType:t.os.name||"",osVersion:t.os.version||"",browser:t.browser.name||"",ua:t.ua}}};page=async(e,t,s,n,r)=>{this.context.utm=n;let a={type:"page",name:e,id:this.deviceId||"",originalTimestamp:Date.now(),sessionId:t,messageId:(0,c.v4)(),writeKey:this.config.writeKey||"",otherIds:{...r},context:this.context,properties:{...s}};console.log("Page event...",a),this.sendPayload(a)};track=async(e,t,s,n)=>{let r={type:"track",event:e,id:this.deviceId||"",originalTimestamp:Date.now(),sessionId:t,messageId:(0,c.v4)(),writeKey:this.config.writeKey||"",otherIds:{...n},context:this.context,properties:{...s}};console.log("Tracking event...",r),this.sendPayload(r)};identify=async(e,t,s,n)=>{this.setUserId(e);let r={type:"identify",userId:e,id:this.deviceId||"",originalTimestamp:Date.now(),sessionId:t,messageId:(0,c.v4)(),writeKey:this.config.writeKey||"",otherIds:{...n},context:this.context,customerProperties:{...s}};console.log("Identify event...",r),this.sendPayload(r)};login=async(e,t,s,n)=>{this.identify(e,t,s,n),this.config.enableUserLogoutLogging&&this.track("User_login",t,s,n),this.setUserId(e)};logout=async e=>{this.track("User_logout",e),this.removeUserId()};setUserId=e=>{this.userId=e||null,localStorage.setItem(this.USER_ID,e)};removeUserId=()=>{this.userId=null,localStorage.removeItem(this.USER_ID)};getDeviceId=()=>{let e=localStorage.getItem(this.DEVICE_ID);return e||(e=this.createDeviceId(),localStorage.setItem(this.DEVICE_ID,e)),e};createDeviceId=()=>(0,c.v4)();sendPayload=async e=>{let t=new XMLHttpRequest;t.open("POST",`${this.config.cdpEndpoint.endsWith("/")?this.config.cdpEndpoint:`${this.config.cdpEndpoint}/`}analyze/analyze.php`,!0),t.withCredentials=!0,t.send(JSON.stringify(e)),t.onerror=s=>{console.error("Request error:",s)}}};var y=require("uuid"),g=class{sessionId=null;inactivityTimeout;inactivityTimer=null;SESSION_DATA="hclcdp_session";onSessionStart;onSessionEnd;constructor(e,t,s){this.inactivityTimeout=(e.inactivityTimeout||30)*60*1e3,this.onSessionStart=t||(n=>{console.log(`Default: Session started with ID: ${n}`)}),this.onSessionEnd=s||(n=>{console.log(`Default: Session ended with ID: ${n}`)}),this.initializeSession(),this.setupActivityListeners()}initializeSession(){let e=this.getSessionData();e&&this.isSessionValid(e)?(this.sessionId=e.sessionId,this.resetInactivityTimer()):this.startNewSession()}getSessionData(){let e=localStorage.getItem(this.SESSION_DATA);return e?JSON.parse(e):null}saveSessionData(e){localStorage.setItem(this.SESSION_DATA,JSON.stringify(e))}isSessionValid(e){return Date.now()-e.lastActivityTimestamp<this.inactivityTimeout}generateSessionId(){return(0,y.v4)()}startNewSession(){this.sessionId=this.generateSessionId();let e={sessionId:this.sessionId,lastActivityTimestamp:Date.now(),sessionStartTimestamp:Date.now()};this.saveSessionData(e),this.resetInactivityTimer(),this.onSessionStart(this.sessionId)}resetInactivityTimer(){this.inactivityTimer&&clearTimeout(this.inactivityTimer),this.inactivityTimer=setTimeout(()=>{this.endSession()},this.inactivityTimeout);let e=this.getSessionData();e&&(e.lastActivityTimestamp=Date.now(),this.saveSessionData(e))}endSession(){localStorage.removeItem(this.SESSION_DATA),this.onSessionEnd(this.sessionId),this.sessionId=null}setupActivityListeners(){["mousemove","keydown","scroll"].forEach(t=>{window.addEventListener(t,()=>this.resetInactivityTimer())})}getSessionId(){return this.sessionId}};var m=class i{static PAGE_QUEUE_KEY="hcl_cdp_page_queue";static TRACK_QUEUE_KEY="hcl_cdp_track_queue";static IDENTIFY_QUEUE_KEY="hcl_cdp_identify_queue";static addToQueue(e,t){let s=this.getQueue(e);s.push(t),localStorage.setItem(e,JSON.stringify(s))}static getQueue(e){let t=localStorage.getItem(e);return t?JSON.parse(t):[]}static clearQueue(e){localStorage.removeItem(e)}static flushQueue(e,t){this.getQueue(e).forEach(n=>{try{switch(e){case i.PAGE_QUEUE_KEY:t(n.pageName,n.properties,n.otherIds);break;case i.TRACK_QUEUE_KEY:t(n.eventName,n.properties,n.otherIds);break;case i.IDENTIFY_QUEUE_KEY:t(n.userId,n.properties,n.otherIds);break}}catch(r){console.error(`Error flushing ${e} event:`,r)}}),this.clearQueue(e)}},o=m;var h=class i{static instance;cdpClient=null;static deviceId=null;sessionId=null;sessionManager=null;static config={writeKey:"",cdpEndpoint:"",inactivityTimeout:30,enableSessionLogging:!1,enableUserLogoutLogging:!1};constructor(){}static async init(e,t){i.instance||(i.instance=new i),this.config=e,i.instance.cdpClient=new l,i.instance.sessionManager=new g(e,i.onSessionStart,i.onSessionEnd);try{await i.instance.cdpClient.init(e),o.flushQueue(o.PAGE_QUEUE_KEY,i.instance.cdpClient.page.bind(i.instance.cdpClient)),o.flushQueue(o.TRACK_QUEUE_KEY,i.instance.cdpClient.track.bind(i.instance.cdpClient)),o.flushQueue(o.IDENTIFY_QUEUE_KEY,i.instance.cdpClient.identify.bind(i.instance.cdpClient)),typeof window<"u"&&(window.HclCdp?console.warn("window.HclCdp is already defined. Skipping attachment."):window.HclCdp=i);let s={};["_ga","_fbc","_fbp","mcmid"].forEach(r=>{let a=this.getCookie(r);a&&(s[r]=a)}),t&&t(null,{deviceId:i.getDeviceId()||null,sessionId:i.getSessionId()||null})}catch(s){console.log("Error initializing HCL CDP SDK:",s),t&&t(s)}}static onSessionStart=e=>{this.config.enableSessionLogging&&i.instance.cdpClient?.track("Session_Start",e)};static onSessionEnd=e=>{this.config.enableSessionLogging&&i.instance.cdpClient?.track("Session_End",e)};static page=async(e,t,s)=>{let n={sessionId:this.getSessionId(),pageName:e,properties:{...t,path:window.location.pathname,url:window.location.href,referrer:document.referrer,title:document.title,search:document.location.search},otherIds:s};if(!i.instance||!i.instance.cdpClient){console.log("adding to queue"),o.addToQueue(o.PAGE_QUEUE_KEY,n);return}let r={...t,path:document.location.pathname,url:document.location.href,referrer:document.referrer,title:document.title,search:document.location.search},a=this.parseUtmParameters(document.location.pathname);i.instance.cdpClient.page(e,this.getSessionId(),r,a,s)};static track=async(e,t,s)=>{let n={sessionId:this.getSessionId(),eventName:e,properties:t,otherIds:s};if(!i.instance||!i.instance.cdpClient){o.addToQueue(o.TRACK_QUEUE_KEY,n);return}i.instance.cdpClient.track(e,this.getSessionId(),t,s)};static identify=async(e,t,s)=>{let n={sessionId:this.getSessionId(),userId:e,properties:t,otherIds:s};if(!i.instance||!i.instance.cdpClient){o.addToQueue(o.IDENTIFY_QUEUE_KEY,n);return}i.instance.cdpClient.identify(e,this.getSessionId(),t,s)};static getDeviceId(){return i.instance?.cdpClient?.deviceId||""}static getSessionId(){return i.instance?.sessionManager?.getSessionId()||""}static logout=async()=>{this.config.enableUserLogoutLogging&&i.instance.cdpClient?.logout(this.getSessionId())};static parseUtmParameters=e=>{try{let t=/(?:\?|&)(utm_[^=]+)=(.*?)(?=&|$)/gi,s={},n;for(;(n=t.exec(document.URL))!==null;)s[n[1]]=n[2];return s}catch(t){return console.error("Error parsing UTM parameters:",t),{}}};static getCookie=e=>{let s=`; ${document.cookie}`.split(`; ${e}=`);return s.length===2?s.pop()?.split(";").shift()??"":""}};0&&(module.exports={HclCdp});
