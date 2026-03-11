const { addonBuilder, serveHTTP } = require("stremio-addon-sdk")
const axios = require("axios")
const { exec } = require("child_process")

const manifest = {
    id: "org.seriesstatus",
    version: "1.0.4",
    name: "Series Status",
    description: "Shows series status + desktop notifications",
    resources: [
        {
            name: "meta",
            types: ["series"],
            idPrefixes: ["tt"]
        }
    ],
    types: ["series"],
    idPrefixes: ["tt"],
    catalogs: []
}

const builder = new addonBuilder(manifest)

const cache = new Map()
const CACHE_TTL = 60 * 60 * 1000

function notify(title, message, icon = "dialog-information") {
    // aspas para não quebrar o comando
    const safeTitle = title.replace(/"/g, '\\"')
    const safeMsg = message.replace(/"/g, '\\"')
    exec(`notify-send "${safeTitle}" "${safeMsg}" -i ${icon} -t 6000`)
}

builder.defineMetaHandler(async ({ type, id }) => {

    console.log(`[SeriesStatus] ${type} ${id}`)

    if (type !== "series") return { meta: null }

    const cached = cache.get(id)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
        console.log(`[SeriesStatus] Cache hit: ${id}`)
        // mostra mesmo no cache hit (usuário está abrindo a série agora)
        notify(cached.seriesName, cached.statusLabel)
        return cached.data
    }

    try {
        const [cinemetaRes, tvmazeRes] = await Promise.allSettled([
            axios.get(`https://v3-cinemeta.strem.io/meta/series/${id}.json`, { timeout: 8000 }),
            axios.get(`https://api.tvmaze.com/lookup/shows?imdb=${id}`, { timeout: 8000 })
        ])

        if (cinemetaRes.status === "rejected") return { meta: null }

        const meta = cinemetaRes.value.data.meta
        if (!meta) return { meta: null }

        let statusLabel = "❓ Status desconhecido"
        let icon = "dialog-question"

        if (tvmazeRes.status === "fulfilled") {
            const status = tvmazeRes.value.data?.status

            if (status === "Running") {
                statusLabel = "🟢 Em exibição (Ongoing)"
                icon = "dialog-information"
            } else if (status === "Ended") {
                statusLabel = "🏁 Encerrada (Ended)"
                icon = "dialog-warning"
            } else if (status === "To Be Determined") {
                statusLabel = "⏳ Aguardando decisão (TBD)"
                icon = "dialog-question"
            } else if (status === "In Development") {
                statusLabel = "🔧 Em desenvolvimento"
                icon = "dialog-information"
            } else if (status) {
                statusLabel = `📺 ${status}`
            }
        }

        const seriesName = meta.name || id
        console.log(`[SeriesStatus] ${seriesName} → ${statusLabel}`)

        // mostra notificação desktop
        notify(seriesName, statusLabel, icon)

        meta.description = `${statusLabel}\n\n${meta.description || ""}`.trim()
        meta.id = id
        meta.type = "series"

        const result = { meta }
        cache.set(id, { data: result, ts: Date.now(), seriesName, statusLabel })
        return result

    } catch (err) {
        console.log(`[SeriesStatus] Erro: ${err.message}`)
        return { meta: null }
    }
})

serveHTTP(builder.getInterface(), { port: 7000 })

console.log(" Series Status rodando em http://127.0.0.1:7000/manifest.json")
notify("Series Status", "Addon iniciado e pronto! 🎬")