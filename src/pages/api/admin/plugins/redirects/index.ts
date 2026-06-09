/**
 * API Route: /api/admin/plugins/redirects
 *
 * GET  — lê src/data/redirects.json
 * PUT  — escreve src/data/redirects.json + sincroniza _redirects (Cloudflare Pages)
 */
import type { APIRoute } from 'astro';
import { readDataFile, writeFileToRepo, readFileFromRepo } from '../../../../../plugins/_server';
export const prerender = false;
const REDIRECTS_PATH = 'src/data/redirects.json';
const CF_REDIRECTS_PATH = 'public/_redirects';
/** Sincroniza redirects ativos pro _redirects (Cloudflare Pages) */
async function syncCloudflareRedirects(redirects: any[]) {
    try {
        const lines = redirects
            .filter((r: any) => r.enabled && r.from && r.to)
            .map((r: any) => `${r.from.replace(/\/+$/, '') || '/'} ${r.to} ${r.type === 301 ? 301 : 302}`);
        await writeFileToRepo(CF_REDIRECTS_PATH, lines.join('\n'), {
            message: 'CMS: Sync redirects to _redirects (Cloudflare Pages)',
        });
    } catch {}
}
export const GET: APIRoute = async () => {
    try {
        const redirects = readDataFile<any[]>(REDIRECTS_PATH.split('/').pop()!, []);
        return new Response(JSON.stringify(redirects), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
};
export const PUT: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const ok = await writeFileToRepo(REDIRECTS_PATH, JSON.stringify(body, null, 2), {
            message: 'CMS: Update redirects',
        });
        if (!ok) return new Response(JSON.stringify({ error: 'Falha ao salvar' }), { status: 500 });
        await syncCloudflareRedirects(body);
        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 400 });
    }
};
