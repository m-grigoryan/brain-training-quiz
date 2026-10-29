// Development-only state-machine tests with an in-memory DOM and virtual clock.
// No browser or external package is needed. Run: node tests/state-tests.cjs
const fs=require('fs'),path=require('path'),vm=require('vm');
let now=1_800_000_000_000,nextTimer=0;const timers=new Map(),listeners={};
class Node {
 constructor(tag='div'){this.tagName=tag;this.children=[];this.attributes={};this.style={setProperty(k,v){this[k]=v}};this.value='';this.disabled=false;this._text='';this._html='';this.classes=new Set();this.classList={add:(...xs)=>xs.forEach(x=>this.classes.add(x)),remove:(...xs)=>xs.forEach(x=>this.classes.delete(x)),contains:x=>this.classes.has(x),toggle:(x,force)=>{const add=force===undefined?!this.classes.has(x):force;add?this.classes.add(x):this.classes.delete(x);return add}};}
 set className(x){this.classes=new Set(x.split(/\s+/).filter(Boolean))}get className(){return [...this.classes].join(' ')}
 set textContent(x){this._text=String(x);this._html='';this.children=[]}get textContent(){return this._text+this._html.replace(/<[^>]*>/g,'')+this.children.map(x=>x.textContent).join('')}
 set innerHTML(x){this._html=x;this._text='';this.children=[]}get innerHTML(){return this._html}
 append(...nodes){this.children.push(...nodes.map(x=>x instanceof Node?x:Object.assign(new Node('text'),{textContent:String(x)})))}
 replaceChildren(...nodes){this._text='';this._html='';this.children=[];this.append(...nodes)}
 setAttribute(k,v){this.attributes[k]=String(v)}getAttribute(k){return this.attributes[k]??null}
 get lastElementChild(){return this.children.at(-1)}get firstElementChild(){return this.children[0]}
 focus(){document.activeElement=this}click(){if(!this.disabled)this.onclick?.({preventDefault(){}})}showModal(){this.open=true}close(){this.open=false}
}
const elements=new Map();const document={getElementById(id){if(!elements.has(id)){let n=new Node();n.id=id;elements.set(id,n)}return elements.get(id)},createElement:t=>new Node(t),createTextNode:t=>Object.assign(new Node('text'),{textContent:t}),querySelectorAll(selector){if(selector==='.nav button')return ['navHome','navHow','navExercises','navAbout'].map(id=>document.getElementById(id));if(selector==='.session-caption')return [document.getElementById('caption')];return []},querySelector(selector){if(selector==='dialog[open]')return [...elements.values()].find(n=>n.open&&['quitDialog','navigationDialog','exampleDialog'].includes(n.id))||null;return null},addEventListener(type,fn){(listeners[type]??=[]).push(fn)}};
const storage=new Map();class VirtualDate extends Date{static now(){return now}}
const context=vm.createContext({console,document,window:{scrollTo(){}},Date:VirtualDate,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval(fn){const id=++nextTimer;timers.set(id,fn);return id},clearInterval:id=>timers.delete(id)});
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
context.advanceClock=ms=>{now+=ms;for(const fn of [...timers.values()])fn()};context.timerCount=()=>timers.size;context.dispatchEnter=(repeat=false)=>{let prevented=false;for(const fn of listeners.keydown||[])fn({key:'Enter',repeat,isComposing:false,preventDefault(){prevented=true}});return prevented};
vm.runInContext(`
(function(){
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 let completed=0;
 for(let level=0;level<3;level++)for(const count of [10,20,30]){
  config.difficulty=level;config.count=count;start();check(session.answers.length===0,'restart score reset');
  for(let i=0;i<count;i++){
   const q=currentQuestion(),source=JSON.stringify(q);check(session.index===i,'question index');
   const before=session.index;nextQuestion();check(session.index===before,'skip unfinished question');
   const oldStage=session.phase;check(!transitionStage('results'),'illegal results transition');check(session.phase===oldStage,'illegal stage changed state');
   if(q.requiresMemorization){
    check(timerCount()===1,'one memory timer');const deadline=session.deadline;toggleQuestionVisibility();toggleQuestionVisibility();check(session.deadline===deadline,'toggle changed deadline');
    $('answer').value='1';submitAnswer();check(session.phase==='memorization'&&session.answers.length===i,'memorization submit');
    advanceClock(memorySeconds(q)*1000+1);check(timerCount()===0&&session.memoryExpired,'expiry cleanup');check(!$('question').textContent.includes(q.digits.join(' ')),'original memory visible');
    toggleQuestionVisibility();toggleQuestionVisibility();check(!$('question').textContent.includes(q.digits.join(' ')),'toggle bypassed memory');
   }else check(timerCount()===0,'ordinary question timer');
   $('answer').value='draft';toggleQuestionVisibility();toggleQuestionVisibility();check($('answer').value==='draft','input lost on hide');
   if(q.id==='dual'){
    $('answer').value=q.answer.arithmetic;submitAnswer();check(session.phase==='recall'&&session.answers.length===i,'dual arithmetic score/stage');check($('feedback').classList.contains('hidden'),'dual premature feedback');
   }
   const phase=session.phase;advanceClock(5*60*1000);check(session.phase===phase,'answer deadline');
   $('answer').value=q.id==='transform'?q.answer.join(''):expectedAnswer(q,session.phase);submitAnswer();check(session.phase==='feedback','valid submission failed '+q.id);check(session.answers.length===i+1&&session.answers.at(-1).correct,'incorrect score');
   submitAnswer();check(session.answers.length===i+1,'duplicate score');const feedback=session.phase;advanceClock(5*60*1000);check(session.phase===feedback,'automatic advance');
   if(!q.requiresMemorization){toggleQuestionVisibility();check(!$('questionPanel').classList.contains('hidden'),'feedback reveal');toggleQuestionVisibility()}
   nextQuestion();completed++;
  }
  check(session.phase==='results','results stage');check($('resultScore').textContent===count+'/'+count,'final result');check($('resultAccuracy').textContent==='100%','final accuracy');
  check($('reviewList').children.length===count,'answer review');missedOnly=true;renderReview();check($('reviewList').children.length===0,'review filter');
 }
 function select(id){start();const at=session.questions.findIndex(q=>q.id===id);[session.questions[0],session.questions[at]]=[session.questions[at],session.questions[0]];session.questions.forEach((q,i)=>q.questionId=i+1);session.index=0;session.questionId=0;session.phase='home';showQuestion();}
 for(const [math,recall] of [[true,true],[true,false],[false,true],[false,false]]){
  config.count=10;select('dual');expireMemory();const q=currentQuestion(),fingerprint=JSON.stringify(q);
  $('answer').value=math?q.answer.arithmetic:String(Number(q.answer.arithmetic)+1);submitAnswer();check(session.phase==='recall'&&session.answers.length===0,'incorrect math blocked recall');
  $('answer').value=recall?q.answer.recall:'9'.repeat(q.digits.length);if(!recall&&$('answer').value===q.answer.recall)$('answer').value='0'.repeat(q.digits.length);submitAnswer();
  check(session.answers[0].correct===(math&&recall),'dual full-credit rule');check(session.answers[0].arithmeticCorrect===math&&session.answers[0].recallCorrect===recall,'component correctness');check(JSON.stringify(q)===fingerprint,'dual data changed');
 }
 select('reverse');const stale={token:generation,sid:session.id,qid:session.questionId};restartQuiz();const phase=session.phase,sid=session.id;expireMemory(stale.token,stale.sid,stale.qid);check(session.phase===phase&&session.id===sid,'stale timer changed restart');
 select('sort');expireMemory();for(const bad of ['',',12345','12345,','1,,2','1, ,2','12A45','123','123456']){
  $('answer').value=bad;submitAnswer();check(session.phase==='answer'&&session.answers.length===0&&$('answer').value===bad&&$('answerError').textContent,'malformed input scored/lost '+bad);
 }
 $('answer').value=currentQuestion().answer;dispatchEnter();check(session.phase==='feedback','Enter submit');const index=session.index;dispatchEnter();dispatchEnter(true);check(session.index===index,'rapid Enter advanced');advanceClock(401);dispatchEnter();check(session.index===index+1,'Enter advancement');
 select('arithmetic');check(!transitionStage('recall'),'ordinary question entered recall');$('answer').value='12.5';submitAnswer();check(session.answers.length===0,'decimal score');$('answer').value=currentQuestion().answer;submitAnswer();finish(true);check($('resultScore').textContent==='1/10'&&$('resultAccuracy').textContent==='10%','early result denominator');check($('summary').textContent.includes('Incorrect Answers9'),'incorrect count');check($('reviewList').children.length===10,'early review count');
 console.log(JSON.stringify({status:'PASS',completedQuestions:completed,configurations:9,dualScenarios:4,checks:'five-minute untimed stages; live and final scores; invalid transitions; hide/show in all stages; no memory reveal; stale timers; Enter repeat guard; malformed inputs; restart; review'}));
})();`,context,{timeout:120000});

const blockedElements=new Map();const blockedDocument={...document,getElementById(id){if(!blockedElements.has(id)){const n=new Node();n.id=id;blockedElements.set(id,n)}return blockedElements.get(id)},querySelectorAll(){return []},querySelector(){return null},addEventListener(){}};
const blocked=vm.createContext({console,document:blockedDocument,window:{scrollTo(){}},Date:VirtualDate,setInterval(){return 1},clearInterval(){}});
Object.defineProperty(blocked,'localStorage',{get(){throw Error('Storage denied')}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],blocked);
vm.runInContext("start();if(session.questions.length!==5)throw Error('storage failure prevented quiz');console.log('PASS: denied-storage fallback and offline initialization.');",blocked);

module.exports={context,storage,elements};
