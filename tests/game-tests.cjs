// Progressive arithmetic game checks; no external dependencies.
const vm=require('vm');const {context}=require('./state-tests.cjs');
(async()=>{
await vm.runInContext(`(async function(){
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};let generated=0;const quizData=localStorage.getItem(LIBRARY_KEY);
 for(const operator of OPS)for(let i=0;i<1000;i++){
  const digits=GAME_BASE[operator]+i%(GAME_MAX_DIGITS-GAME_BASE[operator]+1),q=makeGameQuestion(operator,digits,'test-'+operator+i);
  const a=BigInt(q.a),b=BigInt(q.b);const expected=operator==='+'?a+b:operator==='-'?a-b:operator==='*'?a*b:a/b;
  check(String(expected)===q.answer,'independent answer');check(q.a.length===digits,'operand length');check(q.b.length===(operator==='/'?Math.max(1,Math.ceil(digits/2)):digits),'second operand length');
  check(expected>=0n,'negative generated answer');if(operator==='/')check(b!==0n&&a%b===0n&&expected>=2n,'division exactness');validateGameQuestion(q);generated++;
 }
 function select(ops){OPS.forEach((op,i)=>$('gameOp'+i).checked=ops.includes(op))}
 gameStore=emptyGameStore();localStorage.setItem(GAME_KEY,JSON.stringify(gameStore));gameReadIssue='';gameRecoveryRaw=null;game=null;select([]);startGame();check(game===null&&$('gameSetupError').textContent,'empty operations');
 select(['+']);startGame();check(game.question.op==='+'&&game.question.digits===4,'addition start');$('gameAnswer').value='12.5';submitGameAnswer();check(game.answers.length===0&&$('gameError').textContent,'malformed submission');
 $('gameAnswer').value=game.question.answer;submitGameAnswer();check(game.answers.length===1&&game.answers[0].correct&&game.levels['+']===5,'correct progression');submitGameAnswer();check(game.answers.length===1,'duplicate scoring');nextGameQuestion();check(game.question.digits===5&&game.question.op==='+','new difficulty');
 $('gameAnswer').value=String(BigInt(game.question.answer)+1n);submitGameAnswer();check(game.answers.length===2&&!game.answers[1].correct&&game.levels['+']===5,'wrong answer progression');const current=game.question;nextGameQuestion();check(game.question.digits===5&&(game.question.a!==current.a||game.question.b!==current.b),'fresh question after mistake');
 $('gameAnswer').value='123';saveGameActive();const gameId=game.id;game=null;gameStore=loadGameStore();resumeGame();check(game.id===gameId&&$('gameAnswer').value==='123'&&game.answers.length===2,'resume draft/score');
 finishGame();check(gameStore.sessions.length===1&&gameStore.active===null,'completed game persistence');validateGameSession(gameStore.sessions[0]);check($('gameResultScore').textContent==='1 / 2','result score');
 // Each operation advances independently; rotation only uses checked operations.
 select(['+','*']);startGame();const used=new Set();for(let i=0;i<5;i++){used.add(game.question.op);check(['+','*'].includes(game.question.op),'unchecked operation');$('gameAnswer').value=game.question.answer;submitGameAnswer();nextGameQuestion()}
 check(used.size===2&&game.levels['+']+game.levels['*']===GAME_BASE['+']+GAME_BASE['*']+5,'independent rotation/progression');finishGame();
 select(['/']);startGame();check(game.question.a.length===1&&game.question.b.length===1,'one-digit division start');$('gameAnswer').value=game.question.answer;submitGameAnswer();check(game.levels['/']===2,'division promotion');gameStore=loadGameStore();game=null;resumeGame();check(game.phase==='feedback'&&game.answers.length===1,'resume feedback');nextGameQuestion();check(game.question.a.length===2,'division next level');finishGame();
 select(['-']);startGame();check(game.question.digits===4,'subtraction start');finishGame();select(['*']);startGame();check(game.question.digits===1,'multiplication start');finishGame();
 const backup=JSON.parse(JSON.stringify(gameStore)),count=backup.sessions.length;gameStore=emptyGameStore();localStorage.setItem(GAME_KEY,JSON.stringify(gameStore));const added=importGames(backup);check(added===count&&gameStore.sessions.length===count,'game backup import');check(importGames(backup)===0,'game backup duplicates');
 const corrupt='{"version":1,';localStorage.setItem(GAME_KEY,corrupt);gameStore=loadGameStore();persistGames();check(localStorage.getItem(GAME_KEY)===corrupt&&gameReadIssue,'corrupt game history preservation');importGames(backup);check(!gameReadIssue&&gameStore.sessions.length===count,'game backup recovery');
 check(localStorage.getItem(LIBRARY_KEY)===quizData,'game changed quiz history');
 for(const malformed of ['', '1.5','2/3','1e4','12abc','--2','9'.repeat(257)])check(gameInteger(malformed)===null,'integer format');check(gameInteger('+000123')==='123','signed integer normalization');
 let rejected=false;try{gameMath(3n,'/',2n)}catch{rejected=true}check(rejected,'fractional division allowed');rejected=false;try{gameMath(3n,'/',0n)}catch{rejected=true}check(rejected,'division by zero allowed');
 console.log(JSON.stringify({status:'PASS',randomGameQuestions:generated,checks:'independent BigInt answers up to 32 digits; operation selection; progression; incorrect answers; exact division; duplicate submissions; resume; separate history; backup merge/recovery; malformed input'}));
})()`,context,{timeout:120000});
})().catch(error=>{console.error(error);process.exit(1)});
