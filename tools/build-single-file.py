#!/usr/bin/env python3
"""Bundle Hollow Dome into one self-contained HTML file (dist/hollow-dome.html).

Inlines every module from js/ into tools/artifact-frame.html, which carries the
standalone page chrome (masthead, controls, content note). No build deps.
"""
import os

MODULES = ['util', 'font', 'audio', 'input', 'touch', 'gfx', 'props', 'parrots', 'world',
           'player', 'sanity', 'phone', 'story', 'ui', 'render', 'endings', 'main']

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

parts = []
for name in MODULES:
    src = open(os.path.join(root, 'js', '%s.js' % name)).read()
    if '</script' in src.lower():
        raise SystemExit('js/%s.js contains a script terminator; cannot inline' % name)
    parts.append('/* ===== %s.js ===== */\n%s' % (name, src))

frame = open(os.path.join(root, 'tools', 'artifact-frame.html')).read()
if '/*__BUNDLE__*/' not in frame:
    raise SystemExit('tools/artifact-frame.html is missing the /*__BUNDLE__*/ marker')

out_dir = os.path.join(root, 'dist')
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, 'hollow-dome.html')
with open(out_path, 'w') as f:
    f.write(frame.replace('/*__BUNDLE__*/', '\n'.join(parts)))

print('wrote %s (%d KB, %d modules)' % (out_path, os.path.getsize(out_path) // 1024, len(MODULES)))
