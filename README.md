# POps – installable demo (PWA)

Static files only. No server code, no build step.

## Put it online (needs HTTPS, otherwise phones will not offer "Install")
- **Netlify Drop**: go to app.netlify.com/drop and drag this whole folder in. You get an https link in seconds.
- **Cloudflare Pages / GitHub Pages / Render Static Site**: upload the folder as the site root.

## Use it
- Ranger app, full-screen: `https://YOUR-LINK/#field`  (open on an Android phone in Chrome, then menu > Install app)
- Whole platform: `https://YOUR-LINK/`
- Open once with signal so the app and map tiles are saved. Use "Save map area" in the Ranger app to keep the Iweni area offline.

## Notes
- Maps: satellite from Esri World Imagery and streets from OpenStreetMap public tile servers. Demo use only. For the live build use a licensed provider or a self-hosted tile server.
- GPS needs HTTPS and the phone's permission. The camera uses the phone's own camera app.
- Zone shapes and the core area are illustrative until Patte confirms the real boundaries. Iweni boundary points come from the supplied coordinate table.
- `app.js` is the combined source. The readable source files are in the `src` folder of the full project.
# POps
