const MAX_BYTES=20*1024*1024;
const response=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function validateProgress(p){
 if(!p||p.version!==1)throw Error('Unsupported progress format.');
 for(const key of ['quiz','math','flow']){
  const group=p[key];if(!group||group.version!==1||!Array.isArray(group.sessions)||group.sessions.length>20000)throw Error('Invalid activity history.');
  const ids=new Set();for(const r of [...group.sessions,...(group.active?[group.active]:[])]){
   const id=key==='quiz'?r.storageId:r.id;
   if(typeof id!=='string'||id.length>150||ids.has(id)||!Array.isArray(r.answers)||r.answers.length>30||!Number.isFinite(Date.parse(r.startedAt)))throw Error('Invalid session.');ids.add(id);
  }
 }
 return p;
}
async function limitedJson(request){const reader=request.body?.getReader();if(!reader)throw Error('Missing body.');let size=0,chunks=[];for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw Error('Progress backup exceeds 20 MB.')}chunks.push(value)}const bytes=new Uint8Array(size);let i=0;for(const chunk of chunks){bytes.set(chunk,i);i+=chunk.byteLength}return JSON.parse(new TextDecoder().decode(bytes))}
export async function handleProgress(request,db,user){
 if(!user?.userId)return response({error:'Sign in to sync your progress.'},401);
 if(!db)return response({error:'Cloud storage is temporarily unavailable. Your browser data is unchanged.'},503);
 const userId=user.userId;
 const read=async()=>{const row=await db.prepare('SELECT revision,payload FROM account_progress WHERE user_id = ?').bind(userId).first();return {accountId:userId,revision:row?.revision||0,progress:row?JSON.parse(row.payload):null}};
 try{
  if(request.method==='GET')return response(await read());
  if(request.method!=='POST')return response({error:'Method not allowed.'},405);
  if(request.headers.get('origin')!==new URL(request.url).origin||!request.headers.get('content-type')?.startsWith('application/json'))return response({error:'Invalid request origin or format.'},403);
  const body=await limitedJson(request);if(body.accountId!==userId)return response({error:'Signed-in account changed.'},403);if(!Number.isSafeInteger(body.revision)||body.revision<0)return response({error:'Invalid progress revision.'},400);validateProgress(body.progress);
  const payload=JSON.stringify(body.progress),now=new Date().toISOString();
  const result=body.revision===0?await db.prepare('INSERT OR IGNORE INTO account_progress (user_id,revision,payload,updated_at) VALUES (?,1,?,?)').bind(userId,payload,now).run():await db.prepare('UPDATE account_progress SET revision=revision+1,payload=?,updated_at=? WHERE user_id=? AND revision=?').bind(payload,now,userId,body.revision).run();
  if(result.meta.changes!==1)return response(await read(),409);
  return response({revision:body.revision+1,savedAt:now});
 }catch(error){return response({error:error instanceof SyntaxError?'Invalid JSON.':error.message==='Progress backup exceeds 20 MB.'?error.message:'Could not save progress. Your browser data is unchanged.'},error.message==='Progress backup exceeds 20 MB.'?413:400)}
}
