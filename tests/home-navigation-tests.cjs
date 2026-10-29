// Two-activity home navigation and data separation. Node built-ins only.
const fs=require('fs'),path=require('path'),vm=require('vm');const {context}=require('./state-tests.cjs');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8'),home=html.slice(html.indexOf('<section id="home">'),html.indexOf('<section id="settings"'));
if((home.match(/<article class="activity-card/g)||[]).length!==3||!home.includes('id="gameSetup"')||!home.includes('id="homeStart"'))throw Error('Home must contain all activity setups.');
if(html.includes('id="navGames"')||!html.includes('>Exercises &amp; Quizzes</button>'))throw Error('Separate Games navigation remains.');
vm.runInContext(`
(function(){
 const check=(ok,msg)=>{if(!ok)throw Error(msg)};
 screen('home');check(!$('gameSetup').classList.contains('hidden'),'math setup hidden on home');
 const beforeQuiz=localStorage.getItem(LIBRARY_KEY);OPS.forEach((op,i)=>$('gameOp'+i).checked=op==='+');$('gameStart').click();
 check(currentScreen==='games'&&game.phase==='answer'&&!$('gamePlay').classList.contains('hidden'),'start math from home');
 $('gameAnswer').value=game.question.answer;submitGameAnswer();$('gameBack').click();check(currentScreen==='home'&&!$('gameSetup').classList.contains('hidden'),'return home from math');
 check(!$('gameResume').classList.contains('hidden'),'resume unavailable on home');$('gameResume').click();check(currentScreen==='games'&&game.phase==='feedback','resume math from home');
 finishGame();$('gameAgain').click();check(currentScreen==='home','math results return home');check(localStorage.getItem(LIBRARY_KEY)===beforeQuiz,'math changed quiz storage');
 const beforeGames=localStorage.getItem(GAME_KEY);$('mathHistoryHome').click();check(currentScreen==='games'&&$('gamePlay').classList.contains('hidden')&&$('gameResults').classList.contains('hidden'),'math history routing');
 $('gameBack').click();$('quizHistoryHome').click();check(currentScreen==='history','quiz history routing');
 screen('home');$('homeStart').click();check(currentScreen==='quiz'&&session.questions.length===config.count,'quiz start routing');check(localStorage.getItem(GAME_KEY)===beforeGames,'quiz changed math storage');
 console.log('PASS: three home choices; math start/back/resume/results; separate history links; quiz start; independent storage.');
})();`,context,{timeout:120000});
