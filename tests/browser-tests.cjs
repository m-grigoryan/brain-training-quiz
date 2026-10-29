// Development-only browser checks. Requires Playwright and a local Chrome installation.
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
const artifacts=path.join(__dirname,'artifacts');fs.mkdirSync(artifacts,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BRAIN_TRAINING_CHROME_PATH?{executablePath:process.env.BRAIN_TRAINING_CHROME_PATH}:{})});
 const context=await browser.newContext({offline:true,viewport:{width:1440,height:1000}}),page=await context.newPage();let errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
 await page.goto('file://'+path.resolve(__dirname,'..','index.html'));await page.screenshot({path:path.join(artifacts,'final-home.png'),fullPage:true});
 if(await page.locator('#homeDifficulty button[aria-pressed=true]').innerText().then(s=>!s.includes('Easy')))throw Error('Default difficulty');
 if(await page.locator('#homeCount button[aria-pressed=true]').innerText()!=='5')throw Error('Default count');
 await page.locator('#customize').click();await page.screenshot({path:path.join(artifacts,'final-settings.png'),fullPage:true});
 await page.locator('#start').click();
 for(let i=0;i<5;i++){
  if(await page.evaluate(()=>session.phase==='memorization'))await page.evaluate(()=>expireMemory());
  if(await page.evaluate(()=>session.phase==='arithmetic')){await page.locator('#answer').fill(await page.evaluate(()=>currentQuestion().answer.arithmetic));await page.locator('#submit').click();if(await page.evaluate(()=>session.phase)!=='recall')throw Error('Dual recall stage');}
  const value=await page.evaluate(()=>expectedAnswer(currentQuestion(),session.phase));await page.locator('#answer').fill(value);await page.locator('#submit').click();await page.locator('#next').click();
 }
 if(await page.locator('#resultScore').textContent()!=='5/5')throw Error('Default result');await page.screenshot({path:path.join(artifacts,'final-results.png'),fullPage:true});await page.locator('#reviewButton').click();if(await page.locator('#reviewList tr').count()!==5)throw Error('Review count');await page.locator('#missedReview').click();if(await page.locator('#reviewList tr').count())throw Error('Review missed filter');await page.locator('#allReview').click();await page.screenshot({path:path.join(artifacts,'final-review.png'),fullPage:true});
 console.log(await page.evaluate(()=>{
  let completed=0;const check=(v,msg)=>{if(!v)throw Error(msg)};
  for(let level=0;level<3;level++)for(const count of [10,20,30]){
   config.adaptive=false;config.difficulty=level;config.count=count;start();const signatures=new Set();
   for(let i=0;i<count;i++){
    const q=currentQuestion();check(!signatures.has(q.signature),'duplicate');signatures.add(q.signature);
    if(session.phase==='memorization'){check(EXERCISES.find(e=>e.id===q.id).memory,'wrong timer');expireMemory();$('toggle').click();$('toggle').click();check(session.memoryExpired,'memory protection');check(!$('question').textContent.includes(q.digits.join(' ')),'material remains visible');}
    else {check(!EXERCISES.find(e=>e.id===q.id).memory,'missing memory stage');$('answer').value='draft';$('toggle').click();$('toggle').click();check($('answer').value==='draft','hide cleared input');}
    const old=session.answers.length;
    if(q.id==='dual'){$('answer').value=q.answer.arithmetic;submitAnswer();check(session.phase==='recall'&&session.answers.length===old,'premature dual score');check($('feedback').classList.contains('hidden'),'premature dual feedback');}
    $('answer').value=expectedAnswer(q,session.phase);submitAnswer();check(session.phase==='feedback','no feedback');check(session.answers.length===old+1,'score increment');if(!EXERCISES.find(e=>e.id===q.id).memory){$('toggle').click();check(!$('questionPanel').classList.contains('hidden'),'feedback question reveal');$('toggle').click();check($('questionPanel').classList.contains('hidden'),'feedback question hide')}submitAnswer();check(session.answers.length===old+1,'duplicate score');$('next').click();completed++;
   }
   check(session.phase==='results','not finished');check($('resultScore').textContent===count+'/'+count,'final score');check($('resultAccuracy').textContent==='100%','accuracy');
  }
  return {fullyCompletedQuestions:completed,allNineDifficultyAndLengthCombinations:'PASS'};
 }));
 console.log(await page.evaluate(()=>{
  const check=(v,m)=>{if(!v)throw Error(m)};let cases=0;
  for(const [mathCorrect,recallCorrect] of [[true,true],[false,true],[true,false],[false,false]]){
   config.count=10;start();session.index=session.questions.findIndex(q=>q.id==='dual');session.phase='home';showQuestion();expireMemory();const q=currentQuestion();
   $('answer').value=mathCorrect?q.answer.arithmetic:String(Number(q.answer.arithmetic)+1);submitAnswer();
   check(session.phase==='recall','wrong math skipped recall');check(session.answers.length===0,'math awarded point');check(!$('feedback').textContent.includes('Correct!')||$('feedback').classList.contains('hidden'),'math correctness revealed');
   $('answer').value=recallCorrect?q.answer.recall:'9'.repeat(q.digits.length);submitAnswer();check(session.answers.length===1&&session.answers[0].correct===(mathCorrect&&recallCorrect),'dual conjunction scoring');$('toggle').click();$('toggle').click();check(!$('question').textContent.includes(q.digits.join(' ')),'memory reveal in feedback');cases++;
  }
  start();session.index=session.questions.findIndex(q=>q.id==='reverse');session.phase='home';showQuestion();const old={token:generation,id:session.id,qid:session.questionId};start();const before={phase:session.phase,index:session.index,id:session.id};countdownTick(old.token,old.id,old.qid);expireMemory(old.token,old.id,old.qid);check(session.phase===before.phase&&session.index===before.index&&session.id===before.id,'stale timer affected restart');
  session.index=session.questions.findIndex(q=>q.id==='arithmetic');session.phase='home';showQuestion();$('answer').value='12.5';submitAnswer();check(session.phase==='answer'&&session.answers.length===0&&$('answerError').textContent,'malformed accepted');$('answer').value=currentQuestion().answer;submitAnswer();finish(true);check($('resultScore').textContent==='1/10','early denominator');check($('resultAccuracy').textContent==='10%','early accuracy');check($('summary').textContent.includes('Incorrect Answers9'),'incorrect count');
  renderReview();check($('reviewList').children.length===10,'unanswered review');
  const saved=recent.length;for(let i=0;i<36;i++)buildQuiz(i%3,30);check(recent.length===1000,'history bound');check(JSON.parse(localStorage.getItem(HISTORY_KEY)).length===1000,'storage');
  return {dualScenarios:cases,timerRestartSafety:'PASS',earlyResults:'PASS',validationAndStorage:'PASS'};
 }));
 // Exercise the real countdown; preserve text input on ordinary hide/show.
 await page.evaluate(()=>{config.adaptive=false;config.count=10;config.difficulty=0;start();session.index=session.questions.findIndex(q=>q.id==='reverse');session.phase='home';showQuestion()});
 await page.waitForTimeout(7200);if(await page.evaluate(()=>session.phase)!=='answer')throw Error('Real timer did not expire');
 await page.waitForTimeout(600);if(await page.evaluate(()=>session.phase)!=='answer')throw Error('Answer stage timed out');
 if(await page.locator('#question .digit').count())throw Error('Real timer did not hide');
 await page.evaluate(()=>{start();session.index=session.questions.findIndex(q=>q.id==='arithmetic');session.phase='home';showQuestion()});await page.screenshot({path:path.join(artifacts,'final-quiz.png'),fullPage:true});
 await page.locator('#answer').fill('17');await page.locator('#toggle').click();if(await page.locator('#answer').inputValue()!=='17')throw Error('Hide input loss');await page.screenshot({path:path.join(artifacts,'final-hidden.png'),fullPage:true});await page.locator('#toggle').click();
 await page.locator('#navHome').click();if(!await page.locator('#navigationDialog').isVisible())throw Error('Navigation guard');await page.locator('#stay').click();await page.locator('#answer').fill('-9999');await page.locator('#submit').click();await page.screenshot({path:path.join(artifacts,'final-feedback.png'),fullPage:true});
 for(const width of [390,768,1280]){await page.setViewportSize({width,height:900});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow '+width)}
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{finish(true);screen('home')});await page.screenshot({path:path.join(artifacts,'final-mobile.png'),fullPage:true});
 // Storage denial must not prevent an offline quiz.
 const other=await browser.newContext({offline:true});const denied=await other.newPage();await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('Storage disabled')}}));await denied.goto('file://'+path.resolve(__dirname,'..','index.html'));await denied.locator('#homeStart').click();if(!await denied.locator('#quiz').isVisible())throw Error('Storage denial broke app');
 if(errors.length)throw Error(errors.join('\n'));if(requests.some(url=>/^https?:/.test(url)))throw Error('External request');
 await browser.close();console.log('PASS: offline file; no external requests; storage denial; real timer; unlimited answer stage; hide/show; desktop/mobile; navigation guard; no browser errors.');
})().catch(e=>{console.error(e);process.exit(1)});
