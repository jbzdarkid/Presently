from base64 import b64encode
from hashlib import sha256
from pathlib import Path
import json
import re
import zipfile

# Add hashes for inline scripts

def hash(bytes):
  # Somehow the file gets CRLFs stripped when loading in chrome.
  h = sha256(bytes.replace(b'\r', b'')).digest()
  return 'sha256-' + b64encode(h).decode('utf-8')

with open('presently.html', 'rb') as f:
  mainpage = f.read()

csp = "object-src 'self';"

csp += " script-src 'self'"
for m in re.finditer(b'<script.*?>(.*?)</script>', mainpage, flags=re.DOTALL):
  if m[1] == b'':
    continue # Non-inline scripts

  h = hash(m[1])
  if h not in csp:
    csp += f" '{h}'"
csp += ';'

"""
csp += " style-src 'self'"
for m in re.finditer(b'<link rel="stylesheet".*?>', mainpage):
  csp += f" '{hash(m[0])}'"
csp += ';'
"""

with open('manifest.json', 'r+') as f:
  manifest = json.load(f)
  if manifest['manifest_version'] == 3:
    manifest['content_security_policy'] = {'extension_pages': csp}
  elif manifest['manifest_version'] == 2:
    manifest['content_security_policy'] = csp
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

with zipfile.ZipFile('Presently.zip', 'w') as z:
  for path in all_files:
    arcname = str(path.relative_to(Path(__file__).parent))
    z.write(path, arcname)
