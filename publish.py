from base64 import b64encode
from hashlib import sha256
from pathlib import Path
import json
import re
import zipfile

# Re-format manifest (and get the version for later)
with open('manifest.json', 'r+') as f:
  manifest = json.load(f)
  version = manifest['version']
  f.seek(0)
  f.truncate(0)
  json.dump(manifest, f, indent=4, sort_keys=True)

# Make zipfile

paths = ['_locales', 'apis', 'manifest.json', 'presently.html', 'resources', *Path().glob('*.js')]

all_files = []
for path in paths:
  path = Path(path).resolve()
  if path.is_file():
    all_files.append(path)
  else:
    all_files += list(path.glob('**/*'))

with zipfile.ZipFile(f'Presently-{version}.zip', 'w') as z:
  for path in all_files:
    arcname = str(path.relative_to(Path(__file__).parent))
    z.write(path, arcname)

import webbrowser
wb = webbrowser.get(r'cmd /c "C:/Program Files/Google/Chrome/Application/chrome.exe" "%s"')
# wb.open('https://accounts.google.com/ServiceLogin?service=chromewebstore&continue=https://chrome.google.com/webstore/developer/dashboard')
wb.open('https://chrome.google.com/webstore/devconsole/81cc570c-d6f5-41a5-9253-968836988de5/aikckckhmjomanhniabajcbhmhpifepf/edit') # This one might be better?
