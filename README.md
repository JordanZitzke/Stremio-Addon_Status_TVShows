# 📺 Stremio Series Status Addon

A lightweight Stremio addon that shows whether a TV series is **Ongoing**, **Ended**, or **Cancelled** — displayed as a desktop notification whenever you open a series in Stremio.

![Linux](https://img.shields.io/badge/Linux-FCC624?style=flat&logo=linux&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Stremio](https://img.shields.io/badge/Stremio-8A5BE2?style=flat)

---

## 💡 How it works

When you open a series in Stremio, the addon:

1. Intercepts the metadata request
2. Fetches the series status from [TVmaze API](https://www.tvmaze.com/api)
3. Fetches full metadata from [Cinemeta](https://cinemeta.strem.io/)
4. Fires a native desktop notification with the series name and status

Since Stremio's built-in Cinemeta addon is protected and cannot be uninstalled, the status is delivered via **OS desktop notifications** — the same system used by Spotify to display song changes.

---

## 🔔 Notification examples

```
Stranger Things
🏁 Encerrada (Ended)

Breaking Bad
🏁 Encerrada (Ended)

The Last of Us
🟢 Em exibição (Ongoing)
```

---

## Status labels

| TVmaze status | Notification |
|---|---|
| Running | 🟢 Ongoing |
| Ended | 🏁 Ended |
| To Be Determined | ⏳ TBD |
| In Development | 🔧 In Development |

---

## 🛠️ Requirements

- Linux (uses `notify-send` for desktop notifications)
- Node.js (v18+)
- `libnotify` for desktop notifications

```bash
# Install libnotify if not present
sudo apt install libnotify-bin
```

---

## 🚀 Installation

**1. Clone the repository**
```bash
git clone https://github.com/your-username/stremio-series-status
cd stremio-series-status
```

**2. Install dependencies**
```bash
npm install
```

**3. Install and enable as a background service (runs automatically on login)**
```bash
mkdir -p ~/.config/systemd/user

cat > ~/.config/systemd/user/series-status.service << 'SERVICE'
[Unit]
Description=Stremio Series Status Addon
After=network.target

[Service]
Type=simple
ExecStart=/home/YOUR_USER/.nvm/versions/node/YOUR_NODE_VERSION/bin/node /path/to/addon.js
Restart=on-failure
RestartSec=5
Environment=DISPLAY=:0
Environment=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus

[Install]
WantedBy=default.target
SERVICE

systemctl --user daemon-reload
systemctl --user enable series-status
systemctl --user start series-status
```

> ⚠️ Replace `YOUR_USER`, `YOUR_NODE_VERSION`, and `/path/to/addon.js` with your actual values.
> Find your node path with: `which node`

**4. Add the addon to Stremio**

Open Stremio → Addons → click the `+` button and enter:
```
http://127.0.0.1:7000/manifest.json
```

---

## 🔧 Managing the service

```bash
# Check status
systemctl --user status series-status

# Restart
systemctl --user restart series-status

# Stop
systemctl --user stop series-status

# View logs
journalctl --user -u series-status -f
```



## 🤔 Why notifications instead of in-app description?

Stremio's **Cinemeta addon is protected** — it cannot be uninstalled and always takes priority for metadata on `tt` (IMDb) IDs. Even with a correctly working addon returning the right data, Stremio displays Cinemeta's response in the UI.

The desktop notification approach works around this limitation cleanly: Stremio still calls our addon (confirmed via logs), and we use that moment to fire a native OS notification — no UI hacks needed.

---

## 📦 Dependencies

- [stremio-addon-sdk](https://github.com/Stremio/stremio-addon-sdk)
- [axios](https://github.com/axios/axios)
- [TVmaze API](https://www.tvmaze.com/api) (free, no key required)

---

## 📄 License

MIT
