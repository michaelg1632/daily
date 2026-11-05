#!/usr/bin/env python3
"""Baut die Web-App nach docs/. Mit dem Argument artifact entsteht die alte Einzeldatei für Claude."""
import base64, json, os, shutil, subprocess, sys, time
src = os.path.dirname(os.path.abspath(__file__))
read = lambda n: open(os.path.join(src, n), encoding='utf8').read()
NAMES = ['apfel', 'erde', 'uhr', 'auto', 'hand', 'lego', 'klettern', 'birne', 'boxen']
SHARED = ['data.js', 'core.js', 'views.js', 'sheets.js', 'actions.js']
BODY = '''<div class="shell">
  <header class="top">
    <div class="brand">Daily</div>
    <nav class="nav" id="nav" aria-label="Bereiche"></nav>
  </header>
  <div id="banner"></div>
  <main id="view"><p class="note">Dein Kalender wird geladen.</p></main>
</div>
<nav class="tabs" id="tabs" aria-label="Bereiche"></nav>
<div id="sheet" hidden></div>
<div id="toast" role="status" hidden></div>
<div id="splash" role="button" tabindex="0" aria-label="Daily öffnen"></div>
<datalist id="ex-list"></datalist>
'''
def script(platform, art):
    parts = read(SHARED[0]) + '\n' + read(platform) + '\n' + '\n'.join(read(f) for f in SHARED[1:])
    return '"use strict";\n' + parts + '\nconst ART={' + art + '};\n' + read('splash.js')
def artifact():
    art = ','.join("%s:'data:image/webp;base64,%s'" % (n, base64.b64encode(open(os.path.join(src, 'img', n + '.webp'), 'rb').read()).decode()) for n in NAMES)
    html = f'''<title>Daily</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Nunito+Sans:wght@400;600;700&display=swap">
<style>
{read('style.css')}</style>

{BODY}
<script>
{script('platform-artifact.js', art)}</script>
'''
    out = os.path.join(src, '..', 'tagwerk-artifact.html')
    open(out, 'w', encoding='utf8').write(html)
    print('tagwerk.html', len(html))
def web():
    root = os.path.join(src, '..')
    out = os.path.join(root, 'docs')
    tools = root
    for d in ['img', 'fonts']:
        os.makedirs(os.path.join(out, d), exist_ok=True)
    version = time.strftime('%Y%m%d%H%M%S')
    for n in NAMES:
        shutil.copy(os.path.join(src, 'img', n + '.webp'), os.path.join(out, 'img'))
    faces = ''
    for fam, pkg, weights in [('Nunito', 'nunito', [700, 800, 900]), ('Nunito Sans', 'nunito-sans', [400, 600, 700])]:
        for w in weights:
            f = f'{pkg}-latin-{w}-normal.woff2'
            shutil.copy(os.path.join(tools, 'node_modules/@fontsource', pkg, 'files', f), os.path.join(out, 'fonts', f))
            faces += f'@font-face{{font-family:"{fam}";font-weight:{w};font-style:normal;font-display:swap;src:url(fonts/{f}) format("woff2")}}\n'
    subprocess.run([os.path.join(tools, 'node_modules/.bin/esbuild'), os.path.join(root, 'fb-entry.js'), '--bundle', '--minify', '--format=iife', '--global-name=FB', '--legal-comments=none', '--log-level=warning', '--outfile=' + os.path.join(out, 'fb.js')], check=True)
    art = ','.join(f"{n}:'img/{n}.webp'" for n in NAMES)
    js = script('platform-web.js', art).replace('__VERSION__', version)
    html = f'''<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Daily</title>
<meta name="description" content="Dein Planer für Projekte, Ziele und den Alltag.">
<meta name="theme-color" content="#C4ECFC">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Daily">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="192x192" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-180.png">
<style>
{faces}:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
body{{margin:0}}img{{max-width:100%}}
{read('style.css')}</style>
</head>
<body>
{BODY}
<script src="config.js"></script>
<script src="fb.js"></script>
<script>
{js}</script>
</body>
</html>
'''
    write = lambda n, t: open(os.path.join(out, n), 'w', encoding='utf8').write(t)
    write('index.html', html)
    write('version.json', json.dumps({'v': version}))
    write('.nojekyll', '')
    shutil.copy(os.path.join(src, 'config.js'), os.path.join(out, 'config.js'))
    for n in ['icon-180.png', 'icon-192.png', 'icon-512.png']:
        shutil.copy(os.path.join(root, 'assets', n), os.path.join(out, n))
    write('manifest.webmanifest', json.dumps({'name': 'Daily', 'short_name': 'Daily', 'lang': 'de', 'start_url': './', 'scope': './', 'display': 'standalone', 'orientation': 'portrait', 'background_color': '#E6F7FF', 'theme_color': '#C4ECFC',
        'icons': [{'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png'}, {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}, ensure_ascii=False, indent=1))
    core = ['./', 'config.js', 'fb.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'] + [f'img/{n}.webp' for n in NAMES] + ['fonts/' + f for f in sorted(os.listdir(os.path.join(out, 'fonts')))]
    write('sw.js', read('sw.js').replace('__CORE__', json.dumps(core)))
    print('tagwerk-web', version, 'index.html', len(html), 'fb.js', os.path.getsize(os.path.join(out, 'fb.js')))
(artifact if sys.argv[1:] == ['artifact'] else web)()
