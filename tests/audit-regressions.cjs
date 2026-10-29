// Data-safety regressions discovered during the three-session audit.
const vm=require('vm');const {context}=require('./state-tests.cjs');
vm.runInContext(`
(function(){
 const failures=[];const check=(ok,msg)=>{if(!ok)failures.push(msg)};
 const template=library.sessions.find(s=>s.answers.length===s.questions.length),clone=x=>JSON.parse(JSON.stringify(x));
 const valid=clone(template);valid.storageId='regression-valid';
 const validLibrary={version:1,sessions:[valid],active:null};
 localStorage.setItem(LIBRARY_KEY,JSON.stringify(validLibrary));library=loadLibrary();
 const corrupt='{"version":1,"sessions":[';localStorage.setItem(LIBRARY_KEY,corrupt);library=loadLibrary();renderSettings();check(localStorage.getItem(LIBRARY_KEY)===corrupt,'Corrupt saved history was overwritten on startup.');
 localStorage.setItem(LIBRARY_KEY,JSON.stringify(validLibrary));library=loadLibrary();const local=clone(valid);local.storageId='local-tab';const remote=clone(valid);remote.storageId='other-tab';library.sessions=[local];localStorage.setItem(LIBRARY_KEY,JSON.stringify({version:1,sessions:[remote],active:null}));persistLibrary();const ids=JSON.parse(localStorage.getItem(LIBRARY_KEY)).sessions.map(s=>s.storageId);check(ids.includes('local-tab')&&ids.includes('other-tab'),'Saving in a stale tab deleted another tab’s completed session.');
 localStorage.setItem(LIBRARY_KEY,JSON.stringify(validLibrary));library=loadLibrary();
 // Resume keyboard guard can be checked without manufacturing a feedback record.
 start();const live=clone(library.active);session=null;stageEnteredAt=0;resumeSession();check(stageEnteredAt===Date.now(),'Resuming did not reset the keyboard transition guard.');

 localStorage.setItem(LIBRARY_KEY,JSON.stringify(validLibrary));library=loadLibrary();start();let q=currentQuestion();if(q.requiresMemorization)expireMemory();if(q.id==='dual'){$('answer').value=q.answer.arithmetic;submitAnswer()}const stale=snapshotSession();$('answer').value=expectedAnswer(q,session.phase);submitAnswer();nextQuestion();const newest=JSON.parse(localStorage.getItem(LIBRARY_KEY)).active;session=rehydrate(stale);$('answer').value=expectedAnswer(currentQuestion(),session.phase);saveActive();check(JSON.parse(localStorage.getItem(LIBRARY_KEY)).active.index===newest.index,'A stale active tab rolled saved progress backwards.');submitAnswer();check(session.answers.length===stale.answers.length,'Stale tab accepted another submission.');
 if(failures.length)throw Error(failures.join('\\n'));console.log('PASS: corrupted-history protection; completed-session merge across tabs; resume keyboard guard; stale-active-session protection.');
})();`,context,{timeout:120000});

Promise.resolve(vm.runInContext(`(async function(){
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 const template=library.sessions.find(s=>s.answers.length===s.questions.length),backup=JSON.stringify({version:1,sessions:[template],active:null});
 const corrupt='{"broken":';localStorage.setItem(LIBRARY_KEY,corrupt);library=loadLibrary();renderSettings();check(localStorage.getItem(LIBRARY_KEY)===corrupt,'Corrupt history not protected');
 await importBackup({size:backup.length,text:async()=>backup});check(!libraryReadIssue&&JSON.parse(localStorage.getItem(LIBRARY_KEY)).sessions.length>0,'Valid backup did not restore saving');
 check(localStorage.getItem(LIBRARY_KEY+'-recovery-'+Date.now())===corrupt,'Original corrupt history was not backed up before recovery');
 start();if(currentQuestion().requiresMemorization)expireMemory();const key=$('keypad').children.find(b=>b.textContent==='7');key.click();check(JSON.parse(localStorage.getItem(LIBRARY_KEY)).active.draft==='7','Keypad draft not saved: '+JSON.stringify({draft:JSON.parse(localStorage.getItem(LIBRARY_KEY)).active.draft,input:$('answer').value,phase:session.phase,status:$('storageStatus').textContent,locked:session.locked,valid:activeQuestionValid()}));
 $('answer').value=expectedAnswer(currentQuestion(),session.phase);if(currentQuestion().id==='dual'){$('answer').value=currentQuestion().answer.arithmetic;submitAnswer();$('answer').value=currentQuestion().answer.recall}submitAnswer();nextQuestion();check($('feedback').textContent==='','Previous feedback was retained on the next question');
 console.log('PASS: safe recovery import; original damaged data retained; keypad draft persistence; cleared feedback.');
})()`,context,{timeout:120000})).catch(error=>{console.error(error);process.exitCode=1});
