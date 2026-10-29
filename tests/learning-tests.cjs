// Local persistence, learning, worked examples, and backup tests. Node built-ins only.
const vm=require('vm');const {context}=require('./state-tests.cjs');
(async()=>{
await vm.runInContext(`(async function(){
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 function selectLocal(id){start();const at=session.questions.findIndex(q=>q.id===id);[session.questions[0],session.questions[at]]=[session.questions[at],session.questions[0]];session.questions.forEach((q,i)=>q.questionId=i+1);session.index=0;session.questionId=0;session.phase='home';showQuestion()}
 library=emptyLibrary();localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));libraryReadIssue='';recoveryLibraryRaw=null;config.adaptive=false;config.count=10;config.difficulty=0;
 check(Object.keys(EXAMPLES).length===9,'nine worked examples');check(EXAMPLES.chain.answer==='13'&&EXAMPLES.transform.answer==='8414210','example answers');
 start();let q=currentQuestion();if(q.requiresMemorization)expireMemory();if(q.id==='dual'){$('answer').value=q.answer.arithmetic;submitAnswer()}
 $('answer').value=q.id==='transform'?q.answer.join(''):expectedAnswer(q,session.phase);submitAnswer();
 let saved=JSON.parse(localStorage.getItem(LIBRARY_KEY));check(saved.active.answers.length===1&&saved.active.answers[0].correct,'answer not persisted');const originalId=session.storageId;
 session=null;library=loadLibrary();resumeSession();check(session.storageId===originalId&&session.phase==='feedback'&&session.answers[0].q===session.questions[0],'rehydrate feedback');
 finish(true);saved=JSON.parse(localStorage.getItem(LIBRARY_KEY));check(saved.sessions.length===1&&!saved.active,'completion storage');validateSavedSession(saved.sessions[0]);
 // Export/import data shape round-trips, merges IDs, and rejects altered scores.
 const backup=JSON.stringify(library);library=emptyLibrary();await importBackup({size:backup.length,text:async()=>backup});check(library.sessions.length===1,'import lost history');await importBackup({size:backup.length,text:async()=>backup});check(library.sessions.length===1,'import duplicates');
 const bad=JSON.parse(backup);bad.sessions[0].answers[0].correct=false;const count=library.sessions.length;await importBackup({size:100,text:async()=>JSON.stringify(bad)});check(library.sessions.length===count&&$('storageStatus').textContent.startsWith('Import failed:'),'invalid backup accepted');
 // Five recent successes advance one exercise; unrelated exercises stay Easy.
 const evidence=[];function addEvidence(level,correct,i){const questions=buildQuiz(level,10),at=questions.findIndex(q=>q.id==='sort');[questions[0],questions[at]]=[questions[at],questions[0]];questions.forEach((q,n)=>{q.sessionId=900+i;q.questionId=n+1});const q=questions[0],date=new Date(1700000000000+i*1000).toISOString();evidence.push({id:900+i,storageId:'e'+i,startedAt:date,finishedAt:date,updatedAt:date,phase:'results',difficulty:level,questions,answers:[{q,raw:correct?q.answer:'9'.repeat(q.digits.length),correct}]})}
 for(let i=0;i<5;i++)addEvidence(0,true,i);library.sessions=evidence;check(exerciseRecommendation('sort').level===1,'promotion');check(exerciseRecommendation('reverse').level===0,'cross-exercise leak');
 for(let i=5;i<10;i++)addEvidence(1,false,i);check(exerciseRecommendation('sort').level===0,'demotion');
 library.sessions=evidence.slice(0,5);config.adaptive=true;start();check(session.questions.filter(q=>q.id==='sort').every(q=>q.level===1),'adaptive level not used');check(session.questions.filter(q=>q.id!=='sort').every(q=>q.level===0),'other levels changed');
 renderSettings();check(JSON.parse(localStorage.getItem(LIBRARY_KEY)).preferences.adaptive===true,'mode preference not saved');
 // A saved, expired memorization resumes directly into protected recall.
 config.adaptive=false;selectLocal('reverse');const memory=JSON.stringify(currentQuestion().digits);saveActive();advanceClock(8000); // timer normally expires
 library.active.phase='memorization';library.active.memoryExpired=false;library.active.deadline=Date.now()-1;library.active.draft='';persistLibrary();session=null;resumeSession();check(session.phase==='answer'&&session.memoryExpired,'expired resume exposed memorization');check(!$('question').textContent.includes(JSON.parse(memory).join(' ')),'saved digits exposed');
 $('answer').value='01234';saveActive();const persisted=JSON.parse(localStorage.getItem(LIBRARY_KEY));check(persisted.active.draft==='01234','draft not stored');
 const interruptedId=session.storageId;start();check(library.sessions.some(r=>r.storageId===interruptedId),'starting new quiz lost unfinished session');
 // Locked Dual Task arithmetic survives reload and must still be combined with recall.
 selectLocal('dual');expireMemory();q=currentQuestion();$('answer').value=String(Number(q.answer.arithmetic)+1);submitAnswer();const dualId=session.storageId;session=null;library=loadLibrary();resumeSession();check(session.storageId===dualId&&session.phase==='recall'&&session.dualCorrect===false,'locked dual answer lost');$('answer').value=currentQuestion().answer.recall;submitAnswer();check(session.answers.at(-1).correct===false,'resumed dual scored incorrectly');
 console.log('PASS: nine examples; per-answer saves; completed history; feedback/draft/memory/Dual Task resume; backup merge and validation; per-exercise adaptation; saved preferences.');
})()`,context,{timeout:120000});
})().catch(error=>{console.error(error);process.exit(1)});
