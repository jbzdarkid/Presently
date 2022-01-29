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

print(f'Publishing version {version}')

# Make zipfile
paths = ['_locales', 'apis', 'manifest.json', 'presently.html', 'resources', *Path().glob('*.js')]

with zipfile.ZipFile(f'Presently-{version}.zip', 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
  for path in paths:
    path = Path(path).resolve()
    if path.is_file():
      files = [path]
    else:
      files = [path for path in path.glob('**/*') if path.is_file()]

    for file in files:
      arcname = str(file.relative_to(Path(__file__).parent))
      if file.suffix not in ['.js', '.html']:
        z.write(file, arcname)
        continue

      with file.open('r', encoding='utf-8') as f:
        contents = f.read()
      contents = contents.replace('%version%', version)
      z.writestr(arcname, contents)

import webbrowser
wb = webbrowser.get(r'cmd /c "C:/Program Files/Google/Chrome/Application/chrome.exe" "%s"')
# wb.open('https://accounts.google.com/ServiceLogin?service=chromewebstore&continue=https://chrome.google.com/webstore/developer/dashboard')
wb.open('https://chrome.google.com/webstore/devconsole/81cc570c-d6f5-41a5-9253-968836988de5/aikckckhmjomanhniabajcbhmhpifepf/edit/package') # This one might be better?
