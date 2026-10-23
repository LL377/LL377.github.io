"""Package the current dist for both root and repository GitHub Pages URLs."""
from pathlib import Path
import argparse
import re
import shutil

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--base-path', default='')
args = parser.parse_args()
base = '/' + args.base_path.strip('/') if args.base_path.strip('/') else ''
if base and not re.fullmatch(r'/[A-Za-z0-9_.-]+', base):
    raise ValueError('Expected a repository path such as /personal-portfolio')
output = root / '_site'
if output.exists():
    shutil.rmtree(output)
output.mkdir()
shutil.copy2(root / 'dist/index.html', output / 'index.html')
shutil.copytree(root / 'dist/assets', output / 'assets')
for file in output.rglob('*'):
    if file.is_file() and file.suffix in {'.html', '.css', '.js', '.json', '.svg'}:
        text = file.read_text()
        text = re.sub(r'''(["'(=])/assets/''', lambda m: m[1] + base + '/assets/', text)
        file.write_text(text)
(output / '.nojekyll').touch()
print(f'GitHub Pages ready: {output} (base path: {base or "/"})')
