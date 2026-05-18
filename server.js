const express = 
require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve static files from current directory
app.use(express.static(__dirname));
// Specifically ensure assets folder is served
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Protected Data (Stored on Server)
const PROTECTED_DATA = {
    referral: "Bv9FatggxzDiWqYNEL9szrDvtmhXcx2xPeUKptGiWmie",
    wallet: "Bv9FatggxzDiWqYNEL9szrDvtmhXcx2xPeUKptGiWmie",
    airdrops: [
        {i:'🚀',t:'Jupiter JUP Rewards',d:'Participe do ecossistema Jupiter para ganhar tokens JUP retroativos.',btn:'Verificar',url:'https://jup.ag/stats'},
        {i:'💧',t:'Drift Protocol',d:'Use derivativos Drift para se qualificar para distribuições futuras de DRIFT.',btn:'Acessar',url:'https://drift.trade'},
        {i:'🌊',t:'Kamino Finance',d:'Forneça liquidez na Kamino e ganhe pontos KMNO conversíveis em tokens.',btn:'Depositar',url:'https://kamino.finance'},
    ],
    alpha: [
        {tag:'🔥 HOT CALL',text:'bull/SOL mostrando breakout no gráfico 4h. Volume 3x acima da média.',time:'15 min atrás'},
        {tag:'📊 ANÁLISE',text:'Dominância BTC abaixo de 53% — sinal histórico de alt season. Solana lidera rotação.',time:'42 min atrás'},
        {tag:'👀 DEX ALERT',text:'Novo par na Raydium com $2M de liquidez em 30min. Contrato verificado. DYOR.',time:'1h atrás'},
        {tag:'🚀 LAUNCH',text:'Pump.fun: token AI com 500 holders em 10min. Market cap abaixo de $500k.',time:'2h atrás'},
        {tag:'💡 INSIGHT',text:'Baleias acumulando WIF nos últimos 3 dias. Total: +8.2M tokens. Confluência bullish.',time:'3h atrás'},
    ],
    partners: [
        {i:'🪐',n:'Jupiter',d:'Melhor agregador DEX na Solana. Swap com os melhores preços.',t:'DEX Aggregator',u:'https://jup.ag/?referral=REPLACE_REF'},
        {i:'📡',n:'DexScreener',d:'Rastreamento em tempo real de pares em todas as chains.',t:'Analytics',u:'https://dexscreener.com'},
        {i:'👻',n:'Phantom',d:'Carteira não-custodial líder no ecossistema Solana.',t:'Wallet',u:'https://phantom.app'},
        {i:'⚡',n:'Helius',d:'Infraestrutura RPC de alta performance para Solana.',t:'Infrastructure',u:'https://helius.dev'},
        {i:'🦅',n:'Raydium',d:'AMM nativa da Solana com pools de liquidez profunda.',t:'AMM / DEX',u:'https://raydium.io'},
        {i:'🌊',n:'Orca',d:'Swap intuitivo com Whirlpools de liquidez concentrada.',t:'DEX',u:'https://orca.so'},
    ],
    news: [
        {t:'Solana bate recorde de transações com 5.000 TPS em 2025',src:'CoinDesk',time:'2h atrás',url:'https://coindesk.com',e:'📈'},
        {t:'Memecoins Solana dominam volume em DEXs nesta semana',src:'The Block',time:'4h atrás',url:'https://theblock.co',e:'🚀'},
        {t:'Jupiter DEX ultrapassa $1B em volume diário de swaps',src:'CryptoSlate',time:'5h atrás',url:'https://cryptoslate.com',e:'🔄'},
        {t:'WIF e BONK lideram gainers entre memecoins do mês',src:'CoinTelegraph',time:'7h atrás',url:'https://cointelegraph.com',e:'🐕'},
        {t:'Airdrops Solana: projetos distribuem tokens para early users',src:'Decrypt',time:'8h atrás',url:'https://decrypt.co',e:'🎁'},
        {t:'Análise: Por que memecoins Solana superam EVM em 2025',src:'Messari',time:'12h atrás',url:'https://messari.io',e:'🧠'},
    ]
};

// API Routes
app.get('/api/config', (req, res) => {
    res.json({
        referral: PROTECTED_DATA.referral,
        wallet: PROTECTED_DATA.wallet
    });
});

app.get('/api/airdrops', (req, res) => {
    res.json(PROTECTED_DATA.airdrops);
});

app.get('/api/alpha', (req, res) => {
    res.json(PROTECTED_DATA.alpha);
});

app.get('/api/partners', (req, res) => {
    // Inject referral into partner URLs
    const partners = PROTECTED_DATA.partners.map(p => ({
        ...p,
        u: p.u.replace('REPLACE_REF', PROTECTED_DATA.referral)
    }));
    res.json(partners);
});

app.get('/api/news', (req, res) => {
    res.json(PROTECTED_DATA.news);
});

// Proxy for Jupiter Swap or similar if needed
app.post('/api/swap', (req, res) => {
    const { outputMint } = req.body;
    const referral = PROTECTED_DATA.referral;
    // Here you could integrate with Jupiter API server-side to sign transactions or just return the URL
    // For now, we return the URL with the protected referral
    const swapUrl = `https://jup.ag/swap/SOL-${outputMint}?referral=${referral}`;
    res.json({ url: swapUrl });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
