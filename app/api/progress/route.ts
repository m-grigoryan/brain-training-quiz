import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {handleProgress} from '../../../cloud/progress-server.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return handleProgress(request,env.DB,await getChatGPTUser())}
export async function POST(request:Request){return handleProgress(request,env.DB,await getChatGPTUser())}
