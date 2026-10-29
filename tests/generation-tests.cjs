// Development-only randomized checks. Run with Node; not loaded by the offline app.
const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.resolve(__dirname,'..','index.html'),'utf8');const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storage=new Map();const ctx=vm.createContext({console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},setInterval,clearInterval});
vm.runInContext(script.slice(0,script.indexOf('ACTIVE_EXERCISES.forEach(e=>{const b=')),ctx);
vm.runInContext(`
(function(){
 let total=0;const coverage={};function check(ok,msg){if(!ok)throw Error(msg)}
 function arithmetic(a,op,b){if(!Number.isSafeInteger(a)||!Number.isSafeInteger(b))throw Error('unsafe input');if(op==='/'&&(b===0||a%b!==0))throw Error('illegal division');let value=op==='+'?a+b:op==='-'?a-b:op==='*'?a*b:op==='/'?a/b:NaN;if(!Number.isSafeInteger(value))throw Error('unsafe output');return value}
 function task(t){let value=t.initial;for(const s of t.steps){value=arithmetic(value,s.op,s.b);check(Math.abs(value)<=1000,'intermediate bound');coverage[s.op]=(coverage[s.op]||0)+1}return value}
 for(const e of EXERCISES)for(let level=0;level<3;level++){
  const l=LEVELS[level];for(let trial=0;trial<1000;trial++){
   const q=generate(e.id,level),before=JSON.stringify(q.digits);let expected,d=q.digits;
   check(q.id===e.id&&q.level===level,'identity');if(d){check(d.length===[5,9,11][level],'length');check(d.every(x=>e.id==='mixed'?/^[A-Z0-9]$/.test(String(x)):Number.isInteger(x)&&x>=0&&x<=9),'alphabet')}
   if(e.id==='reverse'){expected=[...d].reverse().join('');check(expected!==d.join(''),'palindrome')}
   if(e.id==='sort'){expected=[...d].sort((a,b)=>a-b).join('');check(expected!==d.join(''),'already sorted')}
   if(e.id==='mixed'){const numbers=d.filter(c=>/^[0-9]$/.test(c)),letters=d.filter(c=>/^[A-Z]$/.test(c));check(numbers.length===[3,5,6][level]&&letters.length===[2,4,5][level],'mixed counts');expected=numbers.sort().concat(letters.sort()).join('');check(d.join('')!==expected,'already sorted mixed')}
   if(e.id==='missing'){check(d.every(x=>typeof x==='number'),'missing digits');const remaining=d.filter((_,i)=>i!==q.removedIndex);check(remaining.length===l.length-1,'one removal');const missing=d[q.removedIndex];check(d.filter(x=>x===missing).length===1,'missing uniqueness');expected=String(missing)}
   if(e.id==='swap'){check(q.pairs.length===[1,2,3][level],'swap count');const indices=q.pairs.flat();check(new Set(indices).size===indices.length,'disjoint');const out=[...d];for(const [a,b] of q.pairs){check(a>=0&&b>=0&&a<l.length&&b<l.length&&d[a]!==d[b],'swap validity');[out[a],out[b]]=[out[b],out[a]]}expected=out.join('');check([...expected].sort().join('')===[...d].sort().join(''),'digit preservation')}
   if(e.id==='arithmetic'){check(q.positions.length===[2,3,4][level],'position count');check(new Set(q.positions).size===q.positions.length,'distinct positions');check(q.steps.length===q.positions.length-1,'op count');let value=d[q.positions[0]];q.steps.forEach((s,i)=>{check(s.b===d[q.positions[i+1]],'position operand');value=arithmetic(value,s.op,d[q.positions[i+1]]);coverage[s.op]=(coverage[s.op]||0)+1});expected=String(value)}
   if(e.id==='chain'){check(q.task.steps.length===[4,8,10][level],'chain count');check(q.task.initial>=[10,20,30][level]&&q.task.initial<=[50,100,150][level],'start range');expected=String(task(q.task))}
   if(e.id==='transform'){check(q.steps.length===(level===2?2:1),'transformation count');expected=d.map(n=>{let value=n;for(const s of q.steps){value=arithmetic(value,s.op,s.b);check(value>=0,'nonnegative transformed');coverage[s.op]=(coverage[s.op]||0)+1}return value});check(expected.some((n,i)=>n!==d[i]),'no-op transform');check(JSON.stringify(expected)===JSON.stringify(q.answer),'transform answer');check(answerIsCorrect(q,expected.join(' '),'answer'),'transform spaced');check(answerIsCorrect(q,expected.join(','),'answer'),'transform commas');check(answerIsCorrect(q,expected.join(''),'answer'),'canonical compact transform');}
   if(e.id==='dual'){check(q.task.steps.length===level+1,'dual operations');expected={arithmetic:String(task(q.task)),recall:[...d].reverse().join('')};check(answerIsCorrect(q,expected.arithmetic,'arithmetic'),'dual math answer');check(answerIsCorrect(q,expected.recall.split('').join(' '),'recall'),'dual reverse answer')}
   check(JSON.stringify(expected)===JSON.stringify(q.answer),'independent answer '+e.id);check(JSON.stringify(q.digits)===before,'mutated original');
   if(!['transform','dual','chain','arithmetic'].includes(e.id)){check(answerIsCorrect(q,String(expected),'answer'),'compact answer');check(answerIsCorrect(q,String(expected).split('').join(' '),'answer'),'spaced answer');check(answerIsCorrect(q,String(expected).toLowerCase().split('').join(','),'answer'),'lowercase/comma answer')}
   check(parseAnswer(q,'<script>alert(1)</script>','answer').error,'malformed format');check(validateQuestion(q),'validator');total++;
  }
 }
 for(const op of OPS)check(coverage[op]>0,'operator missing '+op);
 for(const args of [[1,'/',0],[3,'/',2],[Number.MAX_SAFE_INTEGER,'+',1],[1,'?',2],[1.2,'+',2]]){let rejected=false;try{calculate(...args)}catch{rejected=true}check(rejected,'engine must reject '+args)}
 check(calculate(24,'/',-6)===-4,'signed division');check(evaluate(10,[{op:'+',b:2},{op:'*',b:3}])===36,'left-to-right');
 for(const count of [10,20,30])for(let level=0;level<3;level++){const qs=buildQuiz(level,count),counts=ACTIVE_EXERCISES.map(e=>qs.filter(q=>q.id===e.id).length);check(qs.length===count,'quiz size');check(Math.min(...counts)>=1,'all active types');check(Math.max(...counts)-Math.min(...counts)<=1,'balanced');check(new Set(qs.map(q=>q.signature)).size===count,'duplicate quiz question');}
 let old=new Set(recent);const fresh=buildQuiz(0,30);check(fresh.every(q=>!old.has(q.signature)),'recent history repeat');for(let i=0;i<35;i++)buildQuiz(i%3,30);check(recent.length===1000,'history bound');check(JSON.parse(localStorage.getItem(HISTORY_KEY)).length===1000,'persisted history');
 
 const generators=[generateReverseDigits,generateSortDigits,generateMentalArithmetic,generateCalculationChain,generateMixedSorting,generateMissingElement,generateSwapPositions,generateTransformDigits,generateDualTask];
 for(const generator of generators)for(const difficulty of ['easy','hard','veryHard']){const q=generator(difficulty);check(q.difficulty===difficulty&&q.type&&q.requiresMemorization===!!EXERCISES.find(e=>e.id===q.id).memory,'public generator model');check(buildInstructions(q)===q.instructions,'stored instructions');}
 for(const name of ['nope',-1,3,1.5]){let rejected=false;try{generateReverseDigits(name)}catch{rejected=true}check(rejected,'unsupported difficulty');}
 for(const id of ['reverse','mixed','transform']){const q=generate(id,0);for(const input of ['',',12345','12345,','1,,2','1, ,2','12;34','А1234','K1234'])check(parseAnswer(q,input,'answer').error,'malformed input accepted '+input);}
 const t=generate('transform',0);check(answerIsCorrect(t,t.answer.join(''),'answer'),'compact transform answer');
 let q=generate('arithmetic',0),bad=JSON.parse(JSON.stringify(q));bad.instructions='Add random unrelated numbers';let rejected=false;try{validateQuestion(bad)}catch{rejected=true}check(rejected,'inconsistent instructions');
 q=generate('chain',0);bad=JSON.parse(JSON.stringify(q));bad.task.intermediateResults[1]+=1;rejected=false;try{validateQuestion(bad)}catch{rejected=true}check(rejected,'bad stored intermediate');
 q=generate('missing',2);bad=JSON.parse(JSON.stringify(q));bad.modifiedSequence.reverse();if(JSON.stringify(bad.modifiedSequence)!==JSON.stringify(q.modifiedSequence)){rejected=false;try{validateQuestion(bad)}catch{rejected=true}check(rejected,'wrong modified order');}
 const previousRand=rand; // Deterministic exhaustion: every candidate becomes a palindrome.
 const historyCount=recent.length;let errorShown=false;try{generate('reverse',0,new Proxy(new Set(),{get(target,key){if(key==='has')return ()=>true;return Reflect.get(target,key)}}))}catch(error){errorShown=error.message==='Unable to generate a valid question. Please try again.'}check(errorShown,'bounded controlled generation error');
 console.log(JSON.stringify({status:'PASS',randomizedQuestions:total,operatorCoverage:coverage,otherChecks:'engine rejection; 9 balanced quiz configurations; fresh signatures; storage cap; answer formats; mutation safety'}));
})();`,ctx,{timeout:120000});
