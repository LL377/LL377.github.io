"""Exact crops/resizing of user-supplied photographs using macOS sips."""
from pathlib import Path
import subprocess,json
root=Path(__file__).resolve().parents[1]
source=Path('/Users/lelao/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_fbfdn8m5y2x422_32c9/temp/RWTemp/2026-10/5c31f617a428e83fa3d6df62aeb24def')
target=root/'assets/profile/life';target.mkdir(parents=True,exist_ok=True)
selected={
'lake':'c9173d9126ab75eff4f708e80a5bc2d3.png',
'architecture':'7cbd44bc0a2e481d30c53ac2d9d1a95a.jpg',
'pelicans':'ed58f4d9cfbc478feb1428d6e6a1c2ff.jpg',
'seaside-tree':'8b04b337630f55c25f3da97aa77fb6fd.jpg',
'cat':'45644e7ce6413f066ecd1cd1fd30eacc.png',
'with-cat':'af20950d3b71a1c748544fe499648bbd.png',
'portrait':'d801c105a119888820b45e5eb8439378.png',
'light-space':'266c97a4461d2c76fed738bdee327d6c.png'}
for name,filename in selected.items():
 subprocess.run(['sips','-Z','1800','-s','format','jpeg','-s','formatOptions','88',str(source/filename),'--out',str(target/(name+'.jpg'))],check=True,capture_output=True)
 print(name,flush=True)
# Crop the existing authored composition at visual section boundaries.
long=Path('/Users/lelao/Documents/奥创/投递资料/劳乐四件套.png')
for name,y,height in [('journal-opening',12850,4800),('journal-scrapbook',17650,5100),('journal-closing',22750,4450)]:
 temp=Path('/tmp')/(name+'.png')
 subprocess.run(['sips','--cropToHeightWidth',str(height),'5796','--cropOffset',str(y),'0',str(long),'--out',str(temp)],check=True,capture_output=True)
 subprocess.run(['sips','--resampleWidth','1500','-s','format','jpeg','-s','formatOptions','88',str(temp),'--out',str(target/(name+'.jpg'))],check=True,capture_output=True)
 print(name,flush=True)
(root/'content/life-assets.json').write_text(json.dumps({'sourceLayout':str(long),'selected':selected,'cropRange':[12850,27200],'campus':'Not included: user confirmed the group photograph is not a campus photograph.'},ensure_ascii=False,indent=2))
